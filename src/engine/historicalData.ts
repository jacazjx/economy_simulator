// 中国国家统计局历史数据 (2000-2025)
// 数据来源: 国家统计局年度统计公报
// 单位与PeriodResult保持一致

import type { Params, PeriodResult } from './types'
import { CHINA_BASELINE_OVERTIME } from './types'

export interface HistoricalDataPoint {
  year: number
  period: number  // 1-26, 2000=1
  // 人口与就业
  population: number      // 万人
  employment: number      // 万人
  unemploymentRate: number // 小数，如0.038表示3.8%
  // 产出
  gdp: number             // 亿元
  gdpGrowthRate: number   // 小数，如0.076表示7.6%
  // 收入
  wage: number            // 元/年（城镇单位就业人员平均工资）
  // 外贸
  export: number          // 亿元（人民币计价）
  import: number          // 亿元（人民币计价）
  netExport: number       // 亿元
}

// 2000-2025年中国实际经济数据
// 注：部分数据经过简化处理，以匹配模型单位
export const CHINA_HISTORICAL_DATA: HistoricalDataPoint[] = [
  // 2000年 - 第1期
  { year: 2000, period: 1, population: 126743, employment: 72085, unemploymentRate: 0.034, gdp: 100280, gdpGrowthRate: 0.085, wage: 9333, export: 20634, import: 18639, netExport: 1995 },
  // 2001年 - 第2期
  { year: 2001, period: 2, population: 127627, employment: 73025, unemploymentRate: 0.036, gdp: 110863, gdpGrowthRate: 0.083, wage: 10834, export: 22024, import: 20159, netExport: 1865 },
  // 2002年 - 第3期
  { year: 2002, period: 3, population: 128453, employment: 73740, unemploymentRate: 0.040, gdp: 121717, gdpGrowthRate: 0.091, wage: 12373, export: 26948, import: 24430, netExport: 2518 },
  // 2003年 - 第4期
  { year: 2003, period: 4, population: 129227, employment: 74432, unemploymentRate: 0.043, gdp: 137422, gdpGrowthRate: 0.100, wage: 13969, export: 36288, import: 34160, netExport: 2128 },
  // 2004年 - 第5期
  { year: 2004, period: 5, population: 129988, employment: 75200, unemploymentRate: 0.042, gdp: 161840, gdpGrowthRate: 0.103, wage: 15920, export: 49103, import: 46436, netExport: 2667 },
  // 2005年 - 第6期
  { year: 2005, period: 6, population: 130756, employment: 75825, unemploymentRate: 0.042, gdp: 187319, gdpGrowthRate: 0.114, wage: 18200, export: 62648, import: 54273, netExport: 8375 },
  // 2006年 - 第7期
  { year: 2006, period: 7, population: 131448, employment: 76400, unemploymentRate: 0.043, gdp: 219439, gdpGrowthRate: 0.127, wage: 20856, export: 77597, import: 63377, netExport: 14220 },
  // 2007年 - 第8期
  { year: 2007, period: 8, population: 132129, employment: 76990, unemploymentRate: 0.040, gdp: 270232, gdpGrowthRate: 0.142, wage: 24721, export: 93564, import: 73284, netExport: 20280 },
  // 2008年 - 第9期
  { year: 2008, period: 9, population: 132802, employment: 77480, unemploymentRate: 0.042, gdp: 319516, gdpGrowthRate: 0.096, wage: 28898, export: 100395, import: 79527, netExport: 20868 },
  // 2009年 - 第10期
  { year: 2009, period: 10, population: 133450, employment: 77995, unemploymentRate: 0.043, gdp: 349081, gdpGrowthRate: 0.092, wage: 32244, export: 82030, import: 68618, netExport: 13412 },
  // 2010年 - 第11期
  { year: 2010, period: 11, population: 134091, employment: 76105, unemploymentRate: 0.041, gdp: 412119, gdpGrowthRate: 0.106, wage: 37147, export: 107023, import: 94700, netExport: 12323 },
  // 2011年 - 第12期
  { year: 2011, period: 12, population: 134735, employment: 76420, unemploymentRate: 0.041, gdp: 487940, gdpGrowthRate: 0.095, wage: 41799, export: 123241, import: 113161, netExport: 10080 },
  // 2012年 - 第13期
  { year: 2012, period: 13, population: 135404, employment: 76704, unemploymentRate: 0.041, gdp: 538580, gdpGrowthRate: 0.079, wage: 46769, export: 129359, import: 114801, netExport: 14558 },
  // 2013年 - 第14期
  { year: 2013, period: 14, population: 136072, employment: 76977, unemploymentRate: 0.038, gdp: 592963, gdpGrowthRate: 0.078, wage: 51474, export: 137131, import: 121037, netExport: 16094 },
  // 2014年 - 第15期
  { year: 2014, period: 15, population: 136782, employment: 77253, unemploymentRate: 0.040, gdp: 643563, gdpGrowthRate: 0.074, wage: 56360, export: 143912, import: 120423, netExport: 23489 },
  // 2015年 - 第16期
  { year: 2015, period: 16, population: 137462, employment: 77451, unemploymentRate: 0.040, gdp: 688858, gdpGrowthRate: 0.069, wage: 62029, export: 141255, import: 104336, netExport: 36919 },
  // 2016年 - 第17期
  { year: 2016, period: 17, population: 138271, employment: 77603, unemploymentRate: 0.040, gdp: 746395, gdpGrowthRate: 0.067, wage: 67569, export: 138419, import: 104967, netExport: 33452 },
  // 2017年 - 第18期
  { year: 2017, period: 18, population: 139008, employment: 77640, unemploymentRate: 0.039, gdp: 832036, gdpGrowthRate: 0.069, wage: 74318, export: 153309, import: 124602, netExport: 28707 },
  // 2018年 - 第19期
  { year: 2018, period: 19, population: 139538, employment: 77586, unemploymentRate: 0.038, gdp: 919281, gdpGrowthRate: 0.067, wage: 82413, export: 164177, import: 140882, netExport: 23295 },
  // 2019年 - 第20期
  { year: 2019, period: 20, population: 140005, employment: 77471, unemploymentRate: 0.038, gdp: 986515, gdpGrowthRate: 0.060, wage: 90501, export: 172374, import: 143254, netExport: 29120 },
  // 2020年 - 第21期
  { year: 2020, period: 21, population: 141212, employment: 75064, unemploymentRate: 0.056, gdp: 1015986, gdpGrowthRate: 0.023, wage: 97379, export: 179326, import: 142231, netExport: 37095 },
  // 2021年 - 第22期
  { year: 2021, period: 22, population: 141260, employment: 74652, unemploymentRate: 0.051, gdp: 1149237, gdpGrowthRate: 0.081, wage: 106837, export: 217348, import: 173661, netExport: 43687 },
  // 2022年 - 第23期
  { year: 2022, period: 23, population: 141175, employment: 73351, unemploymentRate: 0.056, gdp: 1210207, gdpGrowthRate: 0.030, wage: 114029, export: 239654, import: 181024, netExport: 58630 },
  // 2023年 - 第24期
  { year: 2023, period: 24, population: 140967, employment: 74041, unemploymentRate: 0.052, gdp: 1260582, gdpGrowthRate: 0.052, wage: 120698, export: 237726, import: 179842, netExport: 57884 },
  // 2024年 - 第25期
  { year: 2024, period: 25, population: 140828, employment: 73439, unemploymentRate: 0.051, gdp: 1349084, gdpGrowthRate: 0.050, wage: 124110, export: 254545, import: 183923, netExport: 70622 },
  // 2025年 - 第26期（基于2024年数据和5%增长率估算）
  { year: 2025, period: 26, population: 140600, employment: 75000, unemploymentRate: 0.050, gdp: 1416537, gdpGrowthRate: 0.050, wage: 130000, export: 267000, import: 193000, netExport: 74000 },
]

/**
 * 转换历史数据为 PeriodResult 格式
 *
 * 设计原则：所有派生变量（消费、储蓄、投资、疲劳、通胀等）
 * 使用与 model.ts runSinglePeriod 完全一致的公式计算，
 * 确保历史→模拟过渡零跳变。
 *
 * 锚定变量（来自实际统计数据，不由模型公式覆盖）：
 *   population, employment, unemploymentRate, gdp, gdpGrowthRate,
 *   export, import, netExport
 *
 * @param prevResult 上一期结果，用于链式累积（累积疲劳、出口增长率等）
 */
export function convertToPeriodResult(
  data: HistoricalDataPoint,
  params: Params,
  prevResult?: PeriodResult
): PeriodResult {
  // === 锚定变量（实际统计数据）===
  const population = data.population
  const employment = data.employment
  const unemploymentRate = data.unemploymentRate
  const gdp = data.gdp
  const gdpGrowthRate = data.gdpGrowthRate

  // === 人口结构（线性插值）===
  const yearFraction = (data.year - 2000) / 25
  const age0_14 = 0.229 - yearFraction * (0.229 - 0.165)
  const age65plus = 0.070 + yearFraction * (0.153 - 0.070)
  const age15_64 = 1 - age0_14 - age65plus
  const birthRate = 0.014 - yearFraction * (0.014 - 0.0064)
  const birthPopulation = population * birthRate

  // === 劳动力 ===
  const laborForce = population * params.laborParticipation

  // === 资本存量（资本产出比 3.5，与 TFP 校准一致）===
  const capitalStock = gdp * 3.5

  // === 技术水平（相对于2025年基准，TFP校准已吸收绝对水平）===
  const currentTechLevel = 1.0

  // === 工时与疲劳（与 model.ts 公式完全一致）===
  const { overtimeHours: baseOT, overtimeRate: baseOTRate } = CHINA_BASELINE_OVERTIME
  const totalHoursPerWeek = params.normalHours + baseOT  // 47h
  const excessHours = Math.max(0, totalHoursPerWeek - params.normalHours)
  const fatigueFactor = params.fatigueCoeff * Math.pow(excessHours / params.normalHours, 2)
  const efficiencyFactor = Math.max(0.3, 1 - fatigueFactor)

  // 累积疲劳：链式累积（第一期用稳态近似）
  const fatigueRecoveryRate = 0.1
  const cumulativeFatigue = prevResult
    ? prevResult.cumulativeFatigue * (1 - fatigueRecoveryRate) + fatigueFactor
    : fatigueFactor / fatigueRecoveryRate  // 稳态 = f / recovery

  // 劳动力留存（与 model.ts 一致）
  const attrition = 0.001 + params.attritionCoeff * cumulativeFatigue
  const laborRetention = Math.max(0.7, 1 - attrition)

  // === 有效工时（与 model.ts 分层加权公式一致）===
  const normalAnnualHours = params.normalHours * 52
  const overtimeAnnualHours = totalHoursPerWeek * 52
  const avgAnnualHoursPerWorker =
    (1 - baseOTRate) * normalAnnualHours
    + baseOTRate * overtimeAnnualHours * efficiencyFactor
  const totalLaborHours = employment * (
    (1 - baseOTRate) * normalAnnualHours + baseOTRate * overtimeAnnualHours)
  const effectiveHours = (1 - baseOTRate) * params.normalHours
    + baseOTRate * totalHoursPerWeek * efficiencyFactor
  const effectiveLaborInput = employment * avgAnnualHoursPerWorker * currentTechLevel

  // === 劳动生产率 ===
  const laborProductivity = totalLaborHours > 0 ? gdp / totalLaborHours * 10000 : 0

  // === 通胀（稳态 Phillips 曲线）===
  // 前瞻模型：π = (1-λ)×π_base + λ×π_{t-1} + φ×(u*-u)
  // 稳态解（π = π_{t-1}）：π = π_base + φ/(1-λ) × (u*-u)
  const naturalUnemploymentRate = 0.03
  const inflationInertia = 0.6
  const inflationRate = params.baseInflation
    + params.phillipsCoeff / (1 - inflationInertia)
    * (naturalUnemploymentRate - unemploymentRate)

  // === 政府部门（与 model.ts 一致）===
  const govRevenue = params.taxRate * gdp
  const govConsumption = (1 - params.govInvestmentShare) * govRevenue
  const govInvestment = params.govInvestmentShare * govRevenue

  // === 收入分配（Cobb-Douglas 要素份额 + 税后，与 model.ts 一致）===
  const laborShare = 1 - params.capitalElasticity
  const totalLaborIncome = laborShare * gdp
  const capitalIncome = params.capitalElasticity * gdp
  const avgWage = employment > 0 ? totalLaborIncome / employment : 0

  const disposableLaborIncome = (1 - params.taxRate) * totalLaborIncome
  const disposableCapitalIncome = (1 - params.taxRate) * capitalIncome

  // === 消费与储蓄（与 model.ts 动态调整公式完全一致）===
  const recessionEffect = -0.3 * Math.max(0, -gdpGrowthRate)
  const employmentDistributionEffect = -0.5 * (unemploymentRate - naturalUnemploymentRate)
  const inflationUncertaintyEffect = -0.5 * Math.max(0, inflationRate - params.baseInflation)
  const birthRateRef = 0.0064
  const age65plusRef = 0.153
  const birthConsumptionEffect = 20 * (birthRate - birthRateRef)
  const agingConsumptionEffect = 0.15 * (age65plus - age65plusRef)
  const demographicConsumptionEffect = birthConsumptionEffect + agingConsumptionEffect
  const adjustedConsumptionPropensity = Math.max(0.4, Math.min(0.75,
    params.consumptionPropensity + recessionEffect + employmentDistributionEffect
    + inflationUncertaintyEffect + demographicConsumptionEffect))

  const laborConsumption = adjustedConsumptionPropensity * disposableLaborIncome
  const laborSavings = disposableLaborIncome - laborConsumption

  const inflationInvestmentDrag = Math.max(0.5, 1 - 2 * Math.max(0, inflationRate - params.baseInflation))
  const adjustedReinvestmentRate = params.capitalReinvestmentRate * inflationInvestmentDrag
  const capitalReinvestment = adjustedReinvestmentRate * disposableCapitalIncome
  const capitalConsumption = disposableCapitalIncome - capitalReinvestment

  const consumption = laborConsumption + capitalConsumption + govConsumption

  // === 储蓄与投资（S-I=NX 恒等式，使用实际净出口）===
  const privateSavings = laborSavings + capitalReinvestment
  const nationalSavings = privateSavings + govInvestment
  const investment = nationalSavings - data.netExport

  // === 出口增长率（从实际数据链式计算）===
  const exportGrowthRate = prevResult && prevResult.export > 0
    ? (data.export - prevResult.export) / prevResult.export
    : 0

  // === 进口倾向（基于模型消费口径）===
  const importPropensity = consumption > 0
    ? data.import / consumption
    : params.baseImportPropensity

  return {
    period: data.period,
    population,
    birthPopulation,
    age0_14,
    age15_64,
    age65plus,
    laborForce,
    employment,
    unemploymentRate,
    laborRetention,
    gdp,
    gdpPerCapita: gdp / population,
    gdpGrowthRate,
    totalLaborHours,
    laborProductivity,
    effectiveHours,
    fatigueFactor,
    effectiveLaborInput,
    currentTechLevel,
    wage: avgWage,  // 与 model.ts 一致: totalLaborIncome / employment
    totalLaborIncome,
    capitalIncome,
    cumulativeFatigue,
    consumption,
    savings: nationalSavings,
    export: data.export,
    import: data.import,
    netExport: data.netExport,
    exportGrowthRate,
    importPropensity,
    inflationRate,
    priceLevel: 1.0,  // 占位，由 loadHistoricalResults 后处理累积
    nominalGdp: gdp,  // 历史 GDP 本身为名义值
    capitalStock,
    investment,
    capacityUtilization: 1.0,  // 历史期：实际GDP即为观测值，隐含产能利用率=1
    govRevenue,
    govConsumption,
    govInvestment,
  }
}
