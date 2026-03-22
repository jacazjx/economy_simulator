// 劳动市场辅助函数
// 核心计算已整合到 model.ts 中
// 此模块保留用于外部工具或测试使用

import type { Params } from './types'

/** 计算疲劳因子（二次方模型） */
export function calcFatigueFactor(params: Params, hours: number): number {
  const excess = Math.max(0, hours - params.normalHours)
  return params.fatigueCoeff * Math.pow(excess / params.normalHours, 2)
}

/** 计算有效工时（含疲劳折减，周单位）
 *  注意：此为简化版本，不按 overtimeRate 分层加权。
 *  model.ts 中的实际计算按 overtimeRate 分别处理加班/非加班工人。
 */
export function calcEffectiveHours(params: Params): number {
  const totalHours = params.normalHours + params.overtimeHours
  const fatigue = calcFatigueFactor(params, totalHours)
  return totalHours * Math.max(0.3, 1 - fatigue)
}
