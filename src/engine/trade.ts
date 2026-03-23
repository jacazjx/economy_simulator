import type { Params, PeriodResult } from './types'

export function calcExportGrowth(
  params: Params,
  prevResult: PeriodResult | null,
  currentTechLevel: number,
  inflationRate: number
): number {
  if (!prevResult) return 0

  // 出口增长 = 基础增长 + 产能效应 + 竞争力效应 + 通胀拖累 + 汇率效应

  // 产能效应：产出增长/萎缩 → 出口供给能力变化
  const capacityEffect = params.capacityExportElasticity * prevResult.gdpGrowthRate

  // 竞争力效应：相对于基准技术水平的提升（techLevel > 1 表示高于基准）
  const competitivenessEffect = params.techExportElasticity * Math.log(currentTechLevel)

  // 通胀拖累：国内通胀高于世界平均（≈2%）→ 出口商品相对变贵 → 竞争力下降
  const worldInflation = 0.02
  const inflationDrag = -0.5 * Math.max(0, inflationRate - worldInflation)

  // 汇率/贸易平衡效应（自纠正机制）：
  // 贸易顺差过大 → 实际汇率升值 + 贸易摩擦 → 出口增速放缓
  // 均衡 NX/GDP ≈ 3%，高于此值出口受到抑制
  // 系数 2.0：确保稳态 NX/GDP 收敛至 3-4%
  //   稳态推导：在 exportGrowth = importGrowth = g 时，
  //   NX*/GDP = 0.03 + (baseGrowth + techBonus - g) / 2.0 ≈ 3.5-4%
  const prevNXShare = prevResult.gdp > 0 ? prevResult.netExport / prevResult.gdp : 0
  const tradeBalanceDrag = -2.0 * Math.max(0, prevNXShare - 0.03)

  // 基础增长率为 2%（世界贸易增速的中枢）
  const baseGrowth = 0.02

  return baseGrowth + capacityEffect + competitivenessEffect + inflationDrag + tradeBalanceDrag
}

export function calcExport(params: Params, prevResult: PeriodResult | null, currentTechLevel: number, inflationRate: number): number {
  const growthRate = calcExportGrowth(params, prevResult, currentTechLevel, inflationRate)
  const prevExport = prevResult?.export ?? params.initialExport
  return Math.max(0, prevExport * (1 + growthRate))
}

export function calcImportPropensity(
  params: Params,
  prevResult: PeriodResult | null
): number {
  if (!prevResult) return params.baseImportPropensity

  // 进口倾向 = 基础倾向 + 收入效应 + 贸易再平衡效应

  // 收入效应：收入增长 → 消费升级 → 进口需求增加
  const incomeEffect = params.incomeImportSensitivity * prevResult.gdpGrowthRate

  // 贸易再平衡效应（自纠正机制）：
  // 贸易顺差过大 → 实际汇率升值 → 进口变便宜 → 进口倾向上升
  // 系数 0.5：与出口端的 2.0 配合，双向纠正贸易失衡
  const prevNXShare = prevResult.gdp > 0 ? prevResult.netExport / prevResult.gdp : 0
  const tradeRebalanceEffect = 0.5 * Math.max(0, prevNXShare - 0.03)

  return Math.max(0, Math.min(0.8, params.baseImportPropensity + incomeEffect + tradeRebalanceEffect))
}

export function calcImport(
  params: Params,
  consumption: number,
  gdp: number,
  prevResult: PeriodResult | null
): number {
  const propensity = calcImportPropensity(params, prevResult)
  // 三通道进口：消费品(55%) + 中间品/资本品(45%, 挂钩GDP)
  // 中国进口中约60%为中间品和资本品，纯消费模型低估生产扩张时的进口需求
  // productionWeight = 0.45 × 基线消费/GDP比(≈0.584) ≈ 0.263，确保基线总量不变
  const consumptionWeight = 0.55
  const productionWeight = 0.263
  const importBase = consumptionWeight * consumption + productionWeight * gdp
  return Math.max(0, propensity * importBase)
}
