import type { Params, PeriodResult } from './types'
import { calcExport, calcExportGrowth, calcImport, calcImportPropensity } from './trade'

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

  // 1a. 年龄结构（65+ 受出生率反馈；0-14 受出生率驱动）
  const baseAge65plus = prevResult ? prevResult.age65plus : 0.153
  const prevAge0_14 = prevResult ? prevResult.age0_14 : 0.165
  const prevBirthRate = prevResult ? prevResult.birthPopulation / prevResult.population : 0.0064
  // 老龄化速度受出生率反馈：高出生率→年轻队列壮大→老龄化增速放缓
  const agingSpeed = Math.max(0.002, Math.min(0.008,
    0.005 + 0.4 * (0.0064 - prevBirthRate)))  // 以2025出生率6.4‰为校准锚点
  const age65plus = Math.min(0.35, baseAge65plus + agingSpeed)
  const birthDrivenAge0_14 = Math.min(0.25, prevBirthRate * 14)
  const age0_14 = Math.max(0.05, 0.9 * prevAge0_14 + 0.1 * birthDrivenAge0_14)
  const age15_64 = 1 - age65plus - age0_14

  // 1b. 死亡率：基础 7‰ + 老龄化 + 过劳致死 - 减时健康红利
  const prevCumulativeFatigue = prevResult ? prevResult.cumulativeFatigue : 0
  const overworkMortalityPenalty = prevCumulativeFatigue * 0.001
  // 减时 → 低压力 → 健康改善 → 死亡率下降
  // 减时健康红利增强：减少过劳改善慢性病预后（系数 0.001→0.003）
  const leisureHealthBonus = Math.max(0, -workHoursDeviation) * 0.003
  const deathRate = Math.max(0.005, 0.007 + age65plus * 0.005 + overworkMortalityPenalty - leisureHealthBonus)

  // 1c. 出生率：完全内生，由经济条件驱动
  // 基准出生率 6.4‰（2025年中国），不设外生时间趋势
  // 影响因子1：工时偏离对家庭时间的影响（对称）
  // 加班 → 挤压家庭时间 → 生育率↓（惩罚，上限70%）
  // 减时 → 增加家庭时间 → 生育率↑（奖励，上限30%，边际递减）
  // 非对称：减时对生育的提升更强（北欧经验：工作生活平衡政策可提升生育率30-50%）
  // 加班惩罚不变（保留2025校准）
  const workLifeEffect = workHoursDeviation >= 0
    ? Math.min(0.7, workHoursDeviation * 0.4)     // 加班惩罚（不变）
    : Math.max(-0.5, workHoursDeviation * 0.8)    // 减时奖励（增强：敏感度0.4→0.8，上限30%→50%）
  // 影响因子2：经济压力（双通道，区分"预期落空"与"经济衰退"）
  // 趋势增长率：动态适应当前经济阶段（70%实际增长 + 30%TFP趋势）
  //   更多跟随实际增速，减少政策转换期的"增长落差"冲击
  //   避免人口老龄化导致的增速自然放缓被误判为"经济危机"
  const prevGdpGrowthForStress = prevResult ? prevResult.gdpGrowthRate : params.tfpGrowthRate
  const adaptiveTrend = prevResult
    ? 0.7 * Math.max(0, prevResult.gdpGrowthRate) + 0.3 * params.tfpGrowthRate
    : params.tfpGrowthRate
  // 通道A：增长低于自适应趋势（预期落空）→ 温和压力（敏感度 2→1.5）
  const growthShortfall = Math.max(0, adaptiveTrend - prevGdpGrowthForStress)
  const expectationStress = growthShortfall * 1.5
  // 通道B：GDP 绝对负增长（经济衰退）→ 强烈压力
  const recessionStress = Math.max(0, -prevGdpGrowthForStress) * 5
  const economicStressFactor = Math.min(0.5, Math.max(expectationStress, recessionStress))
  // 影响因子3：就业安全感（Adsera 2004; Sobotka 2011：就业稳定是生育决策关键因素）
  // 使用上期失业率（当期尚未计算），以5%为中性参考点
  const prevUnemployment = prevResult ? prevResult.unemploymentRate : 0.05
  const employmentSecurityBonus = 1.5 * Math.max(0, 0.05 - prevUnemployment)
  const unemploymentBirthPenalty = 1.0 * Math.max(0, prevUnemployment - 0.05)
  const employmentBirthEffect = employmentSecurityBonus - unemploymentBirthPenalty
  // 基准出生率校准：零加班 + 零经济压力条件下的理论值
  // 中国2025年实际出生率 6.4‰ 已包含基准加班（7h/57%）的抑制效应
  // 校准使 baseBirthRate × (1 - workLifeEffect_china) = 6.4‰
  //   workLifeEffect_china = 0.57×7/40×0.4 ≈ 0.04
  //   baseBirthRate = 6.4‰ / 0.96 ≈ 6.67‰
  const baseBirthRate = 0.00667
  const birthRate = Math.max(0.002, baseBirthRate * (1 - workLifeEffect) * (1 - economicStressFactor) * (1 + employmentBirthEffect))

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
  // 减时专注度提升增强（Pencavel 2014：减少过度工时可显著提升时均产出）
  const hourlyConcentrationBonus = reducedHours / params.normalHours * 0.35
  const efficiencyFactor = excessHours > 0
    ? Math.max(0.3, 1 - fatigueFactor)
    : Math.min(1.3, 1 + hourlyConcentrationBonus)  // 上限 1.2→1.3

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

  // === 9a. 消费倾向预计算（需求侧信号，先于 GDP 确定）===
  // 消费倾向动态调整（5 个通道）：
  const recessionEffect = -0.3 * Math.max(0, -(prevResult ? prevResult.gdpGrowthRate : 0))
  const employmentDistributionEffect = -0.5 * (unemploymentRate - naturalUnemploymentRate)
  // 温和通胀（2-4%）不抑制消费；仅超过基准+2pp时产生不确定性效应
  const harmfulInflationThreshold = params.baseInflation + 0.02
  const inflationUncertaintyEffect = -0.5 * Math.max(0, inflationRate - harmfulInflationThreshold)
  const birthRateRef = 0.0064
  const age65plusRef = 0.153
  const birthConsumptionEffect = 20 * (birthRate - birthRateRef)
  const agingConsumptionEffect = 0.15 * (age65plus - age65plusRef)
  const demographicConsumptionEffect = birthConsumptionEffect + agingConsumptionEffect
  // 通道6：闲暇消费效应 — 减时 → 更多消费时间（餐饮、旅游、娱乐）
  const leisureConsumptionEffect = Math.max(0, -workHoursDeviation) * 0.15
  const adjustedConsumptionPropensity = Math.max(0.4, Math.min(0.75,
    params.consumptionPropensity + recessionEffect + employmentDistributionEffect
    + inflationUncertaintyEffect + demographicConsumptionEffect + leisureConsumptionEffect))

  // === 9b. 潜在 GDP（供给侧：柯布-道格拉斯生产函数）===
  const potentialGdp = tfpBase
    * Math.pow(capitalStock, params.capitalElasticity)
    * Math.pow(effectiveLabor, 1 - params.capitalElasticity)

  // === 9c. 产能利用率（需求侧反馈：三驾马车拉动 GDP）===
  // 当总需求强于供给潜力 → 产能利用率 > 1 → 实际 GDP > 潜在 GDP
  // 当总需求弱于供给潜力 → 产能利用率 < 1 → 产出缺口（经济衰退）
  //
  // 三驾马车的需求信号（均为当期或上期可观测量，无循环依赖）：
  //
  // 1. 消费需求：消费倾向偏离基准 → 消费意愿变化
  //    高消费倾向 → 居民愿意花更多钱 → 需求拉动 GDP↑
  const consumptionDemand = adjustedConsumptionPropensity - params.consumptionPropensity

  // 2. 投资需求：自主投资函数（前瞻性，非残差）
  //    加速器效应：GDP增长 → 预期需求持续 → 扩大投资
  //    产能利用率效应：高CU → 接近产能上限 → 需要扩产
  const baseInvestmentShare = 0.37
  const prevGdpGrowthForInv = prevResult ? prevResult.gdpGrowthRate : params.tfpGrowthRate
  const prevCU = prevResult ? prevResult.capacityUtilization : 1.0
  const acceleratorEffect = 0.5 * prevGdpGrowthForInv       // 加速器
  const cuInvestmentEffect = 0.3 * (prevCU - 1.0)            // 产能缺口
  const desiredInvestmentShare = Math.max(0.20, Math.min(0.55,
    baseInvestmentShare + acceleratorEffect + cuInvestmentEffect))
  const investmentDemand = desiredInvestmentShare - baseInvestmentShare

  // 3. 出口需求：出口增速 → 外部需求变化
  //    出口高增长 → 海外订单充足 → 需求拉动 GDP↑
  const exportGrowthSignal = calcExportGrowth(params, prevResult, currentTechLevel, inflationRate)

  // 综合产能利用率 = 1 + 三驾马车加权贡献
  // 系数含义：消费需求每偏离 1pp → GDP 调整 0.3%
  //          投资需求每偏离 1pp → GDP 调整 0.3%
  //          出口增速每变化 1% → GDP 调整 0.15%
  // 范围 [0.85, 1.05]：最大产出缺口 15%，最大过热 5%
  // 放宽产能利用率范围：允许更深衰退（0.75）和更强过热（1.12）
  // 增强需求侧系数，让消费和投资变化对GDP有更显著的传导
  const capacityUtilization = Math.max(0.75, Math.min(1.12,
    1.0
    + 0.4 * consumptionDemand      // 消费拉动（0.3→0.4）
    + 0.4 * investmentDemand       // 投资拉动（0.3→0.4）
    + 0.2 * exportGrowthSignal     // 出口拉动（0.15→0.2）
  ))

  // === 9d. 实际 GDP = 产能利用率 × 潜在 GDP ===
  const gdp = capacityUtilization * potentialGdp

  // === 10. 政府部门（税收 → 反周期财政支出）===
  const govRevenue = params.taxRate * gdp
  // 反周期财政：经济低于趋势 → 增支刺激，高于趋势 → 减支降温
  // 系数3.0：增速每低于趋势1pp，政府多支出3%（中国积极财政风格）
  // 上限+30%（深度衰退时赤字扩张），下限-15%（过热时财政盈余）
  const prevGrowthForFiscal = prevResult ? prevResult.gdpGrowthRate : params.tfpGrowthRate
  const fiscalGap = params.tfpGrowthRate - prevGrowthForFiscal  // 正值=低于趋势
  const fiscalIntensity = 3.0
  const fiscalAdjustment = Math.max(-0.15, Math.min(0.3, fiscalIntensity * fiscalGap))
  const effectiveGovSpending = govRevenue * (1 + fiscalAdjustment)
  const govConsumptionSpending = (1 - params.govInvestmentShare) * effectiveGovSpending
  const govInvestmentSpending = params.govInvestmentShare * effectiveGovSpending

  // === 11. 收入分配（Cobb-Douglas 要素份额 + 税后可支配收入）===
  const laborShare = 1 - params.capitalElasticity
  const totalLaborIncome = laborShare * gdp
  const capitalIncome = params.capitalElasticity * gdp
  const avgWage = employment > 0 ? totalLaborIncome / employment : 0
  const disposableLaborIncome = (1 - params.taxRate) * totalLaborIncome
  const disposableCapitalIncome = (1 - params.taxRate) * capitalIncome

  // === 12. 消费与储蓄（消费金额基于实际 GDP 的收入）===
  const laborConsumption = adjustedConsumptionPropensity * disposableLaborIncome
  const laborSavings = disposableLaborIncome - laborConsumption
  // 投资拖累同样仅在通胀超过有害阈值（基准+2pp）时生效
  const inflationInvestmentDrag = Math.max(0.5, 1 - 2 * Math.max(0, inflationRate - harmfulInflationThreshold))
  const adjustedReinvestmentRate = params.capitalReinvestmentRate * inflationInvestmentDrag
  const capitalReinvestment = adjustedReinvestmentRate * disposableCapitalIncome
  const capitalConsumption = disposableCapitalIncome - capitalReinvestment
  const consumption = laborConsumption + capitalConsumption + govConsumptionSpending

  // === 13. 外贸 ===
  const rawExport = calcExport(params, prevResult, currentTechLevel, inflationRate)
  const maxExportShare = 0.35
  const exportVal = Math.min(rawExport, gdp * maxExportShare)
  const importVal = calcImport(params, consumption, gdp, prevResult)
  const netExport = exportVal - importVal

  // === 14. 投资（S - I = NX 恒等式）===
  // 国民储蓄 = 私人储蓄 + 政府储蓄（赤字时为负），C + I + NX = Y 严格成立
  const privateSavings = laborSavings + capitalReinvestment
  const govSavings = govRevenue - govConsumptionSpending  // 负值 = 财政赤字（反周期增支超过税收）
  const nationalSavings = privateSavings + govSavings
  const totalInvestment = nationalSavings - netExport

  // === 15. 最终 GDP ===
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
    capacityUtilization,
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
