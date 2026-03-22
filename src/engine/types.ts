export interface Params {
  // 基础参数（固定为中国2025年实际数据）
  initialPopulation: number      // 初始人口（万）14亿人
  initialCapital: number         // 初始资本（亿）约500万亿
  techLevel: number             // 技术水平 A（基准=1）
  capitalElasticity: number      // 资本弹性 α
  normalHours: number            // 正常工时（小时/周）
  overtimeHours: number         // 工时偏移（小时/周）：正=加班，负=缩短工时 ← 用户可调
  overtimeRate: number          // 工时调整覆盖率（0-1）：受该政策影响的劳动者比例 ← 用户可调
  fatigueCoeff: number          // 疲劳系数 β（二次方公式：β×(excess/normal)²）
  attritionCoeff: number         // 劳动力流失系数 γ
  laborParticipation: number    // 劳动参与率
  populationGrowthRate: number  // 净迁移率（人口自然增长已内生，此参数仅表示净迁入/出）
  tfpGrowthRate: number         // 全要素生产率年增长率
  capitalReinvestmentRate: number // 资本收入再投资率
  initialExport: number          // 初始出口额（亿）
  baseImportPropensity: number  // 基础进口倾向
  techExportElasticity: number  // 技术出口弹性 λ₁
  capacityExportElasticity: number // 产能出口弹性 λ₂
  incomeImportSensitivity: number // 收入进口敏感度 θ
  consumptionPropensity: number  // 消费倾向
  depreciationRate: number      // 折旧率
  baseInflation: number         // 基础通胀率（央行锚定目标，约2%）
  phillipsCoeff: number         // 菲利普斯曲线斜率（失业缺口对通胀的影响）
  // 政府部门
  taxRate: number               // 综合宏观税率（税收+社保/GDP）
  govInvestmentShare: number    // 政府支出中投资占比（基建、教育等资本性支出）
}

export interface PeriodResult {
  period: number
  // 人口与就业
  population: number
  birthPopulation: number          // 新生儿人口（万人）
  age0_14: number                  // 0-14岁人口占比
  age15_64: number                 // 15-64岁人口占比
  age65plus: number                // 65岁及以上人口占比
  laborForce: number
  employment: number
  unemploymentRate: number
  laborRetention: number
  // 产出
  gdp: number
  gdpPerCapita: number
  gdpGrowthRate: number
  // 劳动
  totalLaborHours: number         // 年总工时（万人·小时/年）
  laborProductivity: number       // 劳动生产率（元/工时）
  effectiveHours: number          // 有效工时（小时/周，含疲劳折减）
  fatigueFactor: number           // 当期疲劳因子
  effectiveLaborInput: number     // 有效劳动投入 L（年化）
  // 技术
  currentTechLevel: number        // 当期技术水平（含 TFP 增长）
  // 收入
  wage: number                    // 人均年工资（万元）
  totalLaborIncome: number        // 总劳动收入（亿）
  capitalIncome: number           // 资本收入（亿）
  cumulativeFatigue: number
  consumption: number
  savings: number
  // 外贸
  export: number
  import: number
  netExport: number
  exportGrowthRate: number
  importPropensity: number
  // 价格
  inflationRate: number           // 当期通胀率
  priceLevel: number              // 累积价格水平（基期=1.0）
  nominalGdp: number              // 名义GDP = 实际GDP × 价格水平
  // 资本
  capitalStock: number
  investment: number
  // 政府部门
  govRevenue: number             // 政府财政收入（亿）
  govConsumption: number         // 政府消费支出（亿）
  govInvestment: number          // 政府投资支出（亿）
}

export interface SimState {
  params: Params
  results: PeriodResult[]
  currentPeriod: number
  isRunning: boolean
}

// 2025年中国实际经济数据（固定参数）
export const CHINA_2025_PARAMS: Omit<Params, 'overtimeHours' | 'overtimeRate'> = {
  initialPopulation: 140000,    // 14亿人口
  initialCapital: 5000000,     // 500万亿资本存量（资本产出比约3.5）
  techLevel: 1.0,             // 技术水平（基准=1）
  capitalElasticity: 0.35,     // 资本产出弹性（经验值0.3-0.4）

  normalHours: 40,             // 标准工时（小时/周）
  fatigueCoeff: 0.5,           // 疲劳系数（二次方公式，40h加班时效率降50%，有效工时=正常工时）
  attritionCoeff: 0.03,        // 劳动力流失系数（极端加班稳态下年流失率~15%）
  laborParticipation: 0.56,    // 劳动参与率（校准：使 laborForce×(1-unemployment) ≈ 实际就业75000万）
  populationGrowthRate: 0,      // 净迁移率（人口自然增长已内生化，此参数仅表示净迁移）
  tfpGrowthRate: 0.02,         // TFP年增长率（约2%）
  capitalReinvestmentRate: 0.45, // 资本收入再投资率（中国企业储蓄率高）

  initialExport: 170000,      // 2025年出口约17万亿
  baseImportPropensity: 0.23, // 基础进口倾向（校准：2025实际进口/模型总消费≈0.234）
  techExportElasticity: 0.3,  // 技术对出口弹性
  capacityExportElasticity: 0.2, // 产能对出口弹性
  incomeImportSensitivity: 0.1, // 收入对进口敏感度

  consumptionPropensity: 0.58, // 居民消费倾向（2024年约58%）
  depreciationRate: 0.08,      // 折旧率（约8%）
  baseInflation: 0.02,         // 基础通胀率（2%，央行隐含目标）
  phillipsCoeff: 0.3,          // 菲利普斯曲线斜率（校准：中国u=5%时通胀≈0.5%）
  taxRate: 0.18,               // 综合宏观税率（中国广义宏观税负约18%）
  govInvestmentShare: 0.35,    // 政府支出中投资占比（中国约35%为基建/教育等资本性支出）
}

export const DEFAULT_PARAMS: Params = {
  ...CHINA_2025_PARAMS,
  overtimeHours: 0,           // 默认无加班
  overtimeRate: 0,             // 默认无加班
}

// 2025年中国实际加班基准参数（校准使加权平均工时 ≈ 44h/周）
// (1-0.57)×40 + 0.57×47 ≈ 44h，与国家统计局实际周均工时一致
export const CHINA_BASELINE_OVERTIME = {
  overtimeHours: 7,
  overtimeRate: 0.57,
}
