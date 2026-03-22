import type { Params, PeriodResult } from './types'

export function calcExportGrowth(
  params: Params,
  prevResult: PeriodResult | null,
  currentTechLevel: number,
  inflationRate: number
): number {
  if (!prevResult) return 0

  // 出口增长 = 产能效应 + 竞争力效应 + 通胀拖累
  // 产能效应：产出增长/萎缩 → 出口供给能力变化
  // 不设人为下限：GDP暴跌时出口必须同步萎缩
  const capacityEffect = params.capacityExportElasticity * prevResult.gdpGrowthRate

  // 竞争力效应：相对于基准技术水平的提升（techLevel > 1 表示高于基准）
  const competitivenessEffect = params.techExportElasticity * Math.log(currentTechLevel)

  // 通胀拖累：国内通胀高于世界平均（≈2%）→ 出口商品相对变贵 → 竞争力下降
  const worldInflation = 0.02
  const inflationDrag = -0.5 * Math.max(0, inflationRate - worldInflation)

  // 基础增长率为 2%
  const baseGrowth = 0.02

  return baseGrowth + capacityEffect + competitivenessEffect + inflationDrag
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

  // 进口倾向 = 基础倾向 + 收入效应（收入变化 → 进口需求变化）
  const incomeEffect = params.incomeImportSensitivity * prevResult.gdpGrowthRate
  return Math.max(0, Math.min(0.8, params.baseImportPropensity + incomeEffect))
}

export function calcImport(
  params: Params,
  consumption: number,
  prevResult: PeriodResult | null
): number {
  const propensity = calcImportPropensity(params, prevResult)
  return Math.max(0, propensity * consumption)
}
