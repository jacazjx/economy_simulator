// 中国国家统计局历史数据 (2000-2025)
// 数据来源: 国家统计局年度统计公报
// 单位与PeriodResult保持一致

import type { Params } from './types'

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
  { year: 2000, period: 1, population: 126743, employment: 72085, unemploymentRate: 0.034, gdp: 100280, gdpGrowthRate: 0.084, wage: 9333, export: 20634, import: 18639, netExport: 1995 },
  // 2001年 - 第2期
  { year: 2001, period: 2, population: 127627, employment: 73025, unemploymentRate: 0.036, gdp: 110863, gdpGrowthRate: 0.085, wage: 10834, export: 22024, import: 20159, netExport: 1865 },
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
  { year: 2010, period: 11, population: 134091, employment: 76105, unemploymentRate: 0.041, gdp: 412119, gdpGrowthRate: 0.106, wage: 36539, export: 107023, import: 94700, netExport: 12323 },
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
  { year: 2020, period: 21, population: 141212, employment: 75064, unemploymentRate: 0.054, gdp: 1015986, gdpGrowthRate: 0.022, wage: 97379, export: 179326, import: 142936, netExport: 36390 },
  // 2021年 - 第22期
  { year: 2021, period: 22, population: 141260, employment: 74652, unemploymentRate: 0.052, gdp: 1149237, gdpGrowthRate: 0.081, wage: 106837, export: 217348, import: 173661, netExport: 43687 },
  // 2022年 - 第23期
  { year: 2022, period: 23, population: 141175, employment: 73351, unemploymentRate: 0.056, gdp: 1210207, gdpGrowthRate: 0.030, wage: 114029, export: 239654, import: 181024, netExport: 58630 },
  // 2023年 - 第24期
  { year: 2023, period: 24, population: 140967, employment: 74041, unemploymentRate: 0.052, gdp: 1260582, gdpGrowthRate: 0.052, wage: 120698, export: 237726, import: 179842, netExport: 57884 },
  // 2024年 - 第25期
  { year: 2024, period: 25, population: 140828, employment: 73439, unemploymentRate: 0.051, gdp: 1349084, gdpGrowthRate: 0.050, wage: 124110, export: 254545, import: 183911, netExport: 70634 },
  // 2025年 - 第26期（基于2024年数据和5%增长率估算）
  { year: 2025, period: 26, population: 140600, employment: 75000, unemploymentRate: 0.050, gdp: 1416537, gdpGrowthRate: 0.050, wage: 130000, export: 267000, import: 193000, netExport: 74000 },
]

/**
 * 转换历史数据为 PeriodResult 格式
 * 使用实际统计数据和合理的宏观经济比例估算缺失字段
 */
export function convertToPeriodResult(
  data: HistoricalDataPoint,
  params: Params
): import('./types').PeriodResult {
  // 劳动力 = 人口 × 劳动参与率
  const laborForce = data.population * params.laborParticipation
  // 资本产出比：中国约 3.5（2020 年代）
  const capitalOutputRatio = 3.5
  const capitalStock = data.gdp * capitalOutputRatio
  // 年工时：假设历史期间包含一定的加班
  const weeklyHours = 44 // 中国实际平均约44小时/周
  const annualHoursPerWorker = weeklyHours * 52
  // 劳动收入份额：与前瞻模拟一致，使用 Cobb-Douglas 要素份额
  const laborShareEstimate = 1 - params.capitalElasticity
  const totalLaborIncome = data.gdp * laborShareEstimate
  const capitalIncome = data.gdp * (1 - laborShareEstimate)
  // 消费率：中国约38-40%（最终消费/GDP）
  const consumptionRate = 0.40
  const consumption = data.gdp * consumptionRate
  // 投资率：中国约42-43%
  const investmentRate = 0.43
  const investment = data.gdp * investmentRate

  // 人口结构估算（根据国家统计局历史趋势插值）
  // 2000年：0-14 22.9%, 15-64 70.1%, 65+ 7.0%
  // 2025年：0-14 16.5%, 15-64 68.2%, 65+ 15.3%
  const yearFraction = (data.year - 2000) / 25
  const age0_14 = 0.229 - yearFraction * (0.229 - 0.165)
  const age65plus = 0.070 + yearFraction * (0.153 - 0.070)
  const age15_64 = 1 - age0_14 - age65plus
  const birthRate = 0.014 - yearFraction * (0.014 - 0.0064) // 14‰(2000) → 6.4‰(2025)
  const birthPopulation = data.population * birthRate

  return {
    period: data.period,
    population: data.population,
    birthPopulation,
    age0_14,
    age15_64,
    age65plus,
    laborForce,
    employment: data.employment,
    unemploymentRate: data.unemploymentRate,
    laborRetention: 0.999,
    gdp: data.gdp,
    gdpPerCapita: data.gdp / data.population,
    gdpGrowthRate: data.gdpGrowthRate,
    totalLaborHours: data.employment * annualHoursPerWorker,
    laborProductivity: data.gdp / (data.employment * annualHoursPerWorker) * 10000, // 元/小时
    effectiveHours: weeklyHours * 0.97,  // 轻微疲劳
    fatigueFactor: 0.03,
    effectiveLaborInput: data.employment * annualHoursPerWorker * 0.97,
    currentTechLevel: 1.0,  // 历史期统一基准
    wage: data.wage / 10000,  // 元→万元
    totalLaborIncome,
    capitalIncome,
    cumulativeFatigue: 0.05,
    consumption,
    savings: totalLaborIncome - consumption,
    export: data.export,
    import: data.import,
    netExport: data.netExport,
    exportGrowthRate: 0.05,
    importPropensity: data.import / data.gdp,
    // 通胀：从菲利普斯曲线估算（与前瞻模型公式一致）
    // π ≈ 2% + 0.3 × (3% - u) / (1 - 0.6)
    inflationRate: 0.02 + 0.3 * (0.03 - data.unemploymentRate) / 0.4,
    priceLevel: 1.0,  // 占位，由 loadHistoricalResults 后处理累积
    nominalGdp: data.gdp, // 历史 GDP 本身就是名义值
    capitalStock,
    investment,
  }
}
