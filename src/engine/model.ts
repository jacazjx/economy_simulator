import type { Params, PeriodResult } from './types'
import { calcExport, calcImport, calcImportPropensity } from './trade'

/**
 * 校准 TFP（全要素生产率）基数
 * 使生产函数 Y = tfpBase × K^α × L^(1-α) 在给定 K、L 下匹配目标 GDP
 * weeklyHours: 应使用历史实际平均工时（含加班），而非法定标准工时
 */
export function calibrateTFP(
  targetGDP: number,
  capitalStock: number,
  employment: number,
  weeklyHours: number,
  techLevel: number,
  capitalElasticity: number
): number {
  const annualHours = weeklyHours * 52
  const effectiveLabor = employment * annualHours * techLevel
  const rawOutput = Math.pow(capitalStock, capitalElasticity)
    * Math.pow(effectiveLabor, 1 - capitalElasticity)
  if (rawOutput <= 0) return 1
  return targetGDP / rawOutput
}

export function runSinglePeriod(
  params: Params,
  prevResult: PeriodResult | null,
  period: number,
  tfpBase: number
): PeriodResult {
  // === 0. 工时偏离（全局共享，多个模块引用）===
  // 正值=加班，负值=缩短工时，零=标准40h
  const rawAvgWeeklyHours = params.normalHours + params.overtimeRate * params.overtimeHours
  const workHoursDeviation = (rawAvgWeeklyHours - params.normalHours) / params.normalHours

  // === 1. 人口动力学（内生：出生率 - 死亡率 + 净迁移）===

  // 1a. 年龄结构（65+ 固定趋势；0-14 受出生率驱动）
  const baseAge65plus = prevResult ? prevResult.age65plus : 0.153
  const age65plus = Math.min(0.35, baseAge65plus + 0.005) // 每年 +0.5pp（历史队列效应）
  // 0-14岁占比：向 birthRate×14（队列均衡值）平滑收敛
  const prevAge0_14 = prevResult ? prevResult.age0_14 : 0.165
  const prevBirthRate = prevResult ? prevResult.birthPopulation / prevResult.population : 0.0064
  const birthDrivenAge0_14 = Math.min(0.25, prevBirthRate * 14)
  const age0_14 = Math.max(0.05, 0.9 * prevAge0_14 + 0.1 * birthDrivenAge0_14)
  const age15_64 = 1 - age65plus - age0_14

  // 1b. 死亡率：基础 7‰ + 老龄化 + 过劳致死 - 减时健康红利
  const prevCumulativeFatigue = prevResult ? prevResult.cumulativeFatigue : 0
  const overworkMortalityPenalty = prevCumulativeFatigue * 0.001
  // 减时 → 低压力 → 健康改善 → 死亡率下降
  const leisureHealthBonus = Math.max(0, -workHoursDeviation) * 0.001
  const deathRate = Math.max(0.005, 0.007 + age65plus * 0.005 + overworkMortalityPenalty - leisureHealthBonus)

  // 1c. 出生率：完全内生，由经济条件驱动
  // 基准出生率 6.4‰（2025年中国），不设外生时间趋势
  // 影响因子1：工时偏离对家庭时间的影响（对称）
  // 加班 → 挤压家庭时间 → 生育率↓（惩罚，上限70%）
  // 减时 → 增加家庭时间 → 生育率↑（奖励，上限30%，边际递减）
  const workLifeEffect = Math.max(-0.3, Math.min(0.7, workHoursDeviation * 0.4))
  // 影响因子2：经济压力（人均GDP下降抑制生育意愿）
  // 以2025年人均GDP为基准，低于基准时出生率下降
  const prevGdpPerCapita = prevResult ? prevResult.gdpPerCapita : 1416537 / 140600
  const baseGdpPerCapita = 1416537 / 140600 // 2025基准 ≈ 10.07 万元/人
  const economicStressFactor = Math.min(0.5, Math.max(0, 1 - prevGdpPerCapita / baseGdpPerCapita) * 0.8)
  const baseBirthRate = 0.0064
  const birthRate = Math.max(0.002, baseBirthRate * (1 - workLifeEffect) * (1 - economicStressFactor))

  // 1d. 人口 = 上期人口 × (1 + 出生率 - 死亡率 + 净迁移率)
  const naturalGrowthRate = birthRate - deathRate
  const population = prevResult
    ? prevResult.population * (1 + naturalGrowthRate + params.populationGrowthRate)
    : params.initialPopulation
  const birthPopulation = population * birthRate

  // 1e. 劳动参与率：年龄结构 + 工时弹性
  // 减时 → 更多人可参与（家长、老人、学生）→ 参与率↑
  const baseWorkingAgeShare = 0.682
  const participationBonus = Math.max(0, -workHoursDeviation) * 0.1
  const adjustedParticipation = Math.min(0.75,
    params.laborParticipation * (1 + participationBonus) * (age15_64 / baseWorkingAgeShare))
  const laborForce = population * adjustedParticipation

  // === 2. 资本存量 ===
  const capitalStock = prevResult
    ? prevResult.capitalStock * (1 - params.depreciationRate) + prevResult.investment
    : params.initialCapital

  // === 3. 技术水平（含 TFP 增长，工时对称影响）===
  // 加班 → 疲劳 → R&D时间减少 → 创新损失
  // 减时 → 更多认知余量/教育时间 → 创新加速
  const prevFatigue = prevResult ? prevResult.fatigueFactor : 0
  const overworkTfpPenalty = prevFatigue * 0.5
  const leisureTfpBonus = Math.max(0, -workHoursDeviation) * 0.15
  const adjustedTfpGrowth = params.tfpGrowthRate * Math.max(0, 1 - overworkTfpPenalty + leisureTfpBonus)
  const currentTechLevel = prevResult
    ? prevResult.currentTechLevel * (1 + adjustedTfpGrowth)
    : params.techLevel

  // === 4. 疲劳效应（二次方模型：加班越多，效率损失加速）===
  // overtimeHours 可为负（缩短工时），总工时下限 10h/周
  const totalHoursPerWeek = Math.max(10, params.normalHours + params.overtimeHours)
  const excessHours = Math.max(0, totalHoursPerWeek - params.normalHours)
  // 二次方疲劳：f = β × (excess/normal)²
  // 40h加班（excess=normal）时，fatigue = β = 0.5，效率降至50%（有效工时≈正常工时）
  // 7h加班时，fatigue = 0.5 × (7/40)² = 0.015，效率约98.5%（轻微）
  const fatigueFactor = params.fatigueCoeff
    * Math.pow(excessHours / params.normalHours, 2)
  // 对称效率模型：
  // 加班 → 疲劳 → 每小时效率下降（下限0.3）
  // 减时 → 专注度提升 → 每小时效率上升（上限1.2，即+20%）
  const reducedHours = Math.max(0, params.normalHours - totalHoursPerWeek)
  const hourlyConcentrationBonus = reducedHours / params.normalHours * 0.2
  const efficiencyFactor = excessHours > 0
    ? Math.max(0.3, 1 - fatigueFactor)
    : Math.min(1.2, 1 + hourlyConcentrationBonus)

  // === 5. 累积疲劳与劳动力留存（长期效应）===
  const fatigueRecoveryRate = 0.1
  const cumulativeFatigue = prevResult
    ? prevResult.cumulativeFatigue * (1 - fatigueRecoveryRate) + fatigueFactor
    : fatigueFactor
  const attrition = 0.001 + params.attritionCoeff * cumulativeFatigue
  const laborRetention = Math.max(0.7, 1 - attrition)

  // === 6. 就业（结构性失业 + 周期性失业 + 劳动力市场惯性）===
  const naturalUnemploymentRate = 0.03 // 摩擦性失业（无加班、均衡增长时的基底）

  // 6a. 结构性失业：加班替代效应（每人产出更多 → 企业需要更少人）
  const extraEffectiveHours = params.overtimeHours * efficiencyFactor * params.overtimeRate
  const avgEffectiveHours = params.normalHours + extraEffectiveHours
  const displacementFraction = extraEffectiveHours / avgEffectiveHours
  const displacementSensitivity = 0.36
  const structuralUnemployment = displacementFraction * displacementSensitivity

  // 6b. 周期性失业：奥肯定律（GDP偏离趋势增长 → 失业率变化）
  // GDP增长高于趋势 → 企业扩招 → 失业率↓
  // GDP增长低于趋势 → 企业裁员 → 失业率↑
  const trendGrowthRate = params.tfpGrowthRate
  const prevGdpGrowthRate = prevResult ? prevResult.gdpGrowthRate : trendGrowthRate
  const okunCoeff = 0.4
  const cyclicalUnemployment = -okunCoeff * (prevGdpGrowthRate - trendGrowthRate)

  // 6c. 目标失业率 = 自然率 + 结构性 + 周期性
  const targetUnemploymentRate = naturalUnemploymentRate + structuralUnemployment + cyclicalUnemployment

  // 6d. 劳动力市场惯性：每期向目标调整30%（招聘/裁员需要时间）
  const prevUnemploymentRate = prevResult ? prevResult.unemploymentRate : 0.05
  const laborMarketAdjustSpeed = 0.3
  const unemploymentRate = Math.max(0.02, Math.min(0.25,
    prevUnemploymentRate + laborMarketAdjustSpeed * (targetUnemploymentRate - prevUnemploymentRate)))
  const employment = laborForce * (1 - unemploymentRate) * laborRetention

  // === 7. 有效劳动投入（年化）===
  // 只有 overtimeRate 比例的工人实际加班，其余工人正常工时
  // 不加班工人：normalHours × 52 × A × 1（无疲劳）
  // 加班工人：totalHours × 52 × A × ε（有疲劳）
  const normalAnnualHours = params.normalHours * 52
  const overtimeAnnualHours = totalHoursPerWeek * 52
  const avgAnnualHoursPerWorker =
    (1 - params.overtimeRate) * normalAnnualHours
    + params.overtimeRate * overtimeAnnualHours * efficiencyFactor
  const effectiveLaborUnit = avgAnnualHoursPerWorker * currentTechLevel
  const effectiveLabor = employment * effectiveLaborUnit

  // === 8. 通胀（菲利普斯曲线 + 惯性预期）===
  // π = (1-λ)×π_base + λ×π_{t-1} + φ×(u* - u)
  // 失业率低于自然率 → 劳动力市场紧张 → 通胀上升
  // 失业率高于自然率 → 劳动力市场宽松 → 通胀下降/通缩
  const inflationInertia = 0.6
  const prevInflation = prevResult ? prevResult.inflationRate : params.baseInflation
  const rawInflation = (1 - inflationInertia) * params.baseInflation
    + inflationInertia * prevInflation
    + params.phillipsCoeff * (naturalUnemploymentRate - unemploymentRate)
  const inflationRate = Math.max(-0.05, Math.min(0.15, rawInflation))
  const priceLevel = prevResult
    ? prevResult.priceLevel * (1 + inflationRate)
    : 1.0

  // === 9. GDP（柯布-道格拉斯生产函数）===
  // Y = TFP_base × K^α × L^(1-α)
  // TFP_base 已校准使初始条件下产出匹配实际 GDP
  const gdp = tfpBase
    * Math.pow(capitalStock, params.capitalElasticity)
    * Math.pow(effectiveLabor, 1 - params.capitalElasticity)

  // === 9. 收入分配（严格遵循 Cobb-Douglas 要素份额）===
  // 劳动收入 = (1-α) × Y，资本收入 = α × Y
  const laborShare = 1 - params.capitalElasticity
  const totalLaborIncome = laborShare * gdp
  const capitalIncome = params.capitalElasticity * gdp

  // 人均年工资 = 总劳动收入 / 就业人数（万元/人）
  const avgWage = employment > 0 ? totalLaborIncome / employment : 0

  // === 10. 消费与储蓄 ===
  // 消费倾向动态调整：经济衰退/高失业 → 预防性储蓄↑ → 消费倾向↓
  const recessionEffect = -0.3 * Math.max(0, -(prevResult ? prevResult.gdpGrowthRate : 0))
  const unemploymentConfidenceEffect = -0.2 * Math.max(0, unemploymentRate - naturalUnemploymentRate)
  const adjustedConsumptionPropensity = Math.max(0.4, Math.min(0.75,
    params.consumptionPropensity + recessionEffect + unemploymentConfidenceEffect))
  const laborConsumption = adjustedConsumptionPropensity * totalLaborIncome
  const laborSavings = totalLaborIncome - laborConsumption
  // 资本所有者消费：未再投资的资本收入（分红、利润分配）
  const capitalReinvestment = params.capitalReinvestmentRate * capitalIncome
  const capitalConsumption = capitalIncome - capitalReinvestment
  // 总消费 = 劳动消费 + 资本消费，使 C + I = GDP
  const consumption = laborConsumption + capitalConsumption

  // === 11. 外贸（先于投资计算，因 S-I=NX 恒等式约束投资）===
  // 出口受产能约束：不能出口超过产出的合理比例（中国历史峰值约35%）
  const rawExport = calcExport(params, prevResult, currentTechLevel, inflationRate)
  const maxExportShare = 0.35
  const exportVal = Math.min(rawExport, gdp * maxExportShare)
  const importVal = calcImport(params, consumption, prevResult)
  const netExport = exportVal - importVal

  // === 12. 投资（遵循 S - I = NX 恒等式）===
  // 贸易顺差 → 资本净流出 → 国内投资 = 储蓄 - 净出口
  // 贸易逆差 → 资本净流入 → 国内投资 > 储蓄
  // 保证 GDP = C + I + NX 严格成立
  const domesticSavings = laborSavings + capitalReinvestment
  const totalInvestment = Math.max(0, domesticSavings - netExport)

  // === 13. 最终 GDP ===
  // 使用生产法（supply-side）作为 GDP 唯一计算来源
  const finalGdp = gdp

  return {
    period,
    population,
    birthPopulation,
    age0_14,
    age15_64,
    age65plus,
    laborForce,
    employment,
    unemploymentRate,
    laborRetention,
    gdp: finalGdp,
    gdpPerCapita: finalGdp / population,
    gdpGrowthRate: prevResult ? (finalGdp - prevResult.gdp) / prevResult.gdp : 0,
    effectiveLaborInput: effectiveLabor,
    // 实际总工时 = 不加班工人的正常工时 + 加班工人的总工时
    totalLaborHours: employment * ((1 - params.overtimeRate) * normalAnnualHours + params.overtimeRate * overtimeAnnualHours),
    // 劳动生产率 = GDP / 实际总工时（元/小时）
    // 单位换算：亿元 / (万人·小时/年) × 10000 = 元/小时
    laborProductivity: (() => {
      const actualTotalHours = employment * ((1 - params.overtimeRate) * normalAnnualHours + params.overtimeRate * overtimeAnnualHours)
      return actualTotalHours > 0 ? finalGdp / actualTotalHours * 10000 : 0
    })(),
    // 加权平均有效周工时
    effectiveHours: (1 - params.overtimeRate) * params.normalHours
      + params.overtimeRate * totalHoursPerWeek * efficiencyFactor,
    fatigueFactor,
    currentTechLevel,
    wage: avgWage,
    totalLaborIncome,
    capitalIncome,
    cumulativeFatigue,
    consumption,
    savings: laborSavings,
    export: exportVal,
    import: importVal,
    netExport,
    exportGrowthRate: prevResult ? calcExportGrowthRate(exportVal, prevResult.export) : 0,
    importPropensity: calcImportPropensity(params, prevResult),
    inflationRate,
    priceLevel,
    nominalGdp: finalGdp * priceLevel,
    capitalStock,
    investment: totalInvestment,
  }
}

function calcExportGrowthRate(current: number, prev: number): number {
  if (prev === 0) return 0
  return (current - prev) / prev
}

export function runSimulation(
  params: Params,
  periods: number,
  tfpBase: number
): PeriodResult[] {
  const results: PeriodResult[] = []
  for (let i = 0; i < periods; i++) {
    const prev = results.length > 0 ? results[results.length - 1] : null
    results.push(runSinglePeriod(params, prev, i + 1, tfpBase))
  }
  return results
}
