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
  // 影响因子2：经济压力（双通道，区分"预期落空"与"经济衰退"）
  // 趋势增长率：动态适应当前经济阶段（50%实际增长 + 50%TFP趋势）
  //   避免人口老龄化导致的增速自然放缓被误判为"经济危机"
  //   如：GDP增速因老龄化从2%放缓至1.5%，自适应趋势≈1.75%，仅产生微小压力
  const prevGdpGrowthForStress = prevResult ? prevResult.gdpGrowthRate : params.tfpGrowthRate
  const adaptiveTrend = prevResult
    ? 0.5 * Math.max(0, prevResult.gdpGrowthRate) + 0.5 * params.tfpGrowthRate
    : params.tfpGrowthRate
  // 通道A：增长低于自适应趋势（预期落空）→ 温和压力
  const growthShortfall = Math.max(0, adaptiveTrend - prevGdpGrowthForStress)
  const expectationStress = growthShortfall * 2
  // 通道B：GDP 绝对负增长（经济衰退）→ 强烈压力
  const recessionStress = Math.max(0, -prevGdpGrowthForStress) * 5
  const economicStressFactor = Math.min(0.5, Math.max(expectationStress, recessionStress))
  // 基准出生率校准：零加班 + 零经济压力条件下的理论值
  // 中国2025年实际出生率 6.4‰ 已包含基准加班（7h/57%）的抑制效应
  // 校准使 baseBirthRate × (1 - workLifeEffect_china) = 6.4‰
  //   workLifeEffect_china = 0.57×7/40×0.4 ≈ 0.04
  //   baseBirthRate = 6.4‰ / 0.96 ≈ 6.67‰
  const baseBirthRate = 0.00667
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

  // === 2. 资本存量（含下限防护：极端情况下资本不低于初始值的10%）===
  const capitalStock = prevResult
    ? Math.max(params.initialCapital * 0.1,
        prevResult.capitalStock * (1 - params.depreciationRate) + prevResult.investment)
    : params.initialCapital

  // === 3. 技术水平（含 TFP 增长，工时对称影响）===
  // 加班 → 疲劳 → R&D时间减少 → 创新损失
  // 减时 → 更多认知余量/教育时间 → 创新加速
  // 使用累积疲劳（而非单期），反映长期过劳对创新能力的持续侵蚀
  // 系数 0.05 = 原系数 0.5 / 10，因累积疲劳 ≈ 单期疲劳 / 恢复率(0.1)
  const overworkTfpPenalty = prevCumulativeFatigue * 0.05
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

  // === 9b. 政府部门（税收→财政支出分配）===
  const govRevenue = params.taxRate * gdp
  const govConsumptionSpending = (1 - params.govInvestmentShare) * govRevenue
  const govInvestmentSpending = params.govInvestmentShare * govRevenue

  // === 10. 收入分配（Cobb-Douglas 要素份额 + 税后可支配收入）===
  const laborShare = 1 - params.capitalElasticity
  const totalLaborIncome = laborShare * gdp          // 税前总劳动收入
  const capitalIncome = params.capitalElasticity * gdp // 税前资本收入

  // 人均年工资 = 税前总劳动收入 / 就业人数（万元/人）
  const avgWage = employment > 0 ? totalLaborIncome / employment : 0

  // 税后可支配收入
  const disposableLaborIncome = (1 - params.taxRate) * totalLaborIncome
  const disposableCapitalIncome = (1 - params.taxRate) * capitalIncome

  // === 11. 消费与储蓄（含就业分配效应 + 通胀反馈）===
  // 消费倾向动态调整：
  //   衰退 → 预防性储蓄↑ → 消费倾向↓
  //   就业分配效应（对称）：
  //     低失业 → 更多人有工资收入 → 边际消费倾向更高 → 总消费倾向↑
  //     高失业 → 更多人失去收入 → 消费信心下降 → 总消费倾向↓
  //     经济学原理：凯恩斯消费函数 C = a + bY，收入分配到更多人时
  //     自发性消费 a 的贡献增大，整体消费倾向上升
  //   高通胀 → 不确定性↑ → 预防性储蓄↑ → 消费倾向↓
  const recessionEffect = -0.3 * Math.max(0, -(prevResult ? prevResult.gdpGrowthRate : 0))
  const employmentDistributionEffect = -0.5 * (unemploymentRate - naturalUnemploymentRate)
  const inflationUncertaintyEffect = -0.5 * Math.max(0, inflationRate - params.baseInflation)
  // 人口结构消费效应（凯恩斯自主消费的代理）：
  //   高出生率 → 育儿刚需消费（奶粉、教育、医疗）→ 消费倾向↑
  //   高老龄化 → 养老医疗刚需 → 消费倾向↑
  //   以2025年中国为基准，偏离基准时调整消费倾向
  const birthRateRef = 0.0064   // 2025年中国实际出生率
  const age65plusRef = 0.153    // 2025年中国老龄化率
  const birthConsumptionEffect = 20 * (birthRate - birthRateRef)
  const agingConsumptionEffect = 0.15 * (age65plus - age65plusRef)
  const demographicConsumptionEffect = birthConsumptionEffect + agingConsumptionEffect
  const adjustedConsumptionPropensity = Math.max(0.4, Math.min(0.75,
    params.consumptionPropensity + recessionEffect + employmentDistributionEffect
    + inflationUncertaintyEffect + demographicConsumptionEffect))
  const laborConsumption = adjustedConsumptionPropensity * disposableLaborIncome
  const laborSavings = disposableLaborIncome - laborConsumption

  // 资本再投资率受通胀影响（Issue 4 新增）：
  // 高通胀 → 名义利率上升 → 资本成本增加 → 再投资意愿下降
  const inflationInvestmentDrag = Math.max(0.5, 1 - 2 * Math.max(0, inflationRate - params.baseInflation))
  const adjustedReinvestmentRate = params.capitalReinvestmentRate * inflationInvestmentDrag
  const capitalReinvestment = adjustedReinvestmentRate * disposableCapitalIncome
  const capitalConsumption = disposableCapitalIncome - capitalReinvestment

  // 总消费 = 私人劳动消费 + 私人资本消费 + 政府消费
  // GDP = privateC + govC + I + NX 严格成立（见下方推导）
  const consumption = laborConsumption + capitalConsumption + govConsumptionSpending

  // === 12. 外贸（先于投资计算，因 S-I=NX 恒等式约束投资）===
  // 出口受产能约束：不能出口超过产出的合理比例（中国历史峰值约35%）
  const rawExport = calcExport(params, prevResult, currentTechLevel, inflationRate)
  const maxExportShare = 0.35
  const exportVal = Math.min(rawExport, gdp * maxExportShare)
  const importVal = calcImport(params, consumption, prevResult)
  const netExport = exportVal - importVal

  // === 13. 投资（S - I = NX 恒等式，允许负投资=资本净流出）===
  // 国民储蓄 = 私人储蓄 + 政府储蓄（政府投资性支出视为公共储蓄）
  // I = S_national - NX
  // 证明 C + I + NX = Y：
  //   C + I + NX = (privateC + govC) + (S_national - NX) + NX
  //   = privateC + govC + S_national
  //   = (laborC + capitalC) + govC + (laborS + capitalReinvest + govInvest)
  //   = disposableLaborIncome + disposableCapitalIncome + govRevenue
  //   = (1-τ)(1-α)Y + (1-τ)αY + τY = (1-τ)Y + τY = Y ✓
  const privateSavings = laborSavings + capitalReinvestment
  const nationalSavings = privateSavings + govInvestmentSpending
  const totalInvestment = nationalSavings - netExport  // 允许负值（资本净流出）

  // === 14. 最终 GDP ===
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
    savings: nationalSavings,      // 国民总储蓄 = 私人储蓄 + 政府储蓄
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
    govRevenue,
    govConsumption: govConsumptionSpending,
    govInvestment: govInvestmentSpending,
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
