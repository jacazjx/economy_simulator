import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Params, PeriodResult } from '../engine/types'
import { DEFAULT_PARAMS, CHINA_BASELINE_OVERTIME } from '../engine/types'
import { runSinglePeriod, calibrateTFP } from '../engine/model'
import { CHINA_HISTORICAL_DATA, convertToPeriodResult } from '../engine/historicalData'

interface UIState {
  chartCollapsed: Record<string, boolean>
  setChartCollapsed: (key: string, collapsed: boolean) => void
  toggleChartCollapsed: (key: string) => void
  collapseAll: () => void
  expandAll: () => void
}

interface SimState {
  params: Params
  results: PeriodResult[]
  currentPeriod: number
  isRunning: boolean
  timeStep: 'year' | 'quarter'
  historicalPeriods: number
  simulationStartPeriod: number
  tfpBase: number
  maxYear: number  // 最大模拟年份

  // actions
  setParams: (params: Partial<Params>) => void
  resetParams: () => void
  runSingleStep: () => void
  setCurrentPeriod: (period: number) => void
  setIsRunning: (running: boolean) => void
  setTimeStep: (step: 'year' | 'quarter') => void
  setMaxYear: (year: number) => void
  saveToStorage: () => void
  loadFromStorage: () => void
  resetWithHistoricalData: () => void
}

const CHART_KEYS = ['gdp', 'unemployment', 'wage', 'birthPopulation', 'population', 'populationStructure']

// 转换历史数据为PeriodResult数组，并累积价格水平
const loadHistoricalResults = (params: Params): PeriodResult[] => {
  const results = CHINA_HISTORICAL_DATA.map(data => convertToPeriodResult(data, params))
  // 后处理：从基期（2000年=1.0）累积价格水平
  let priceLevel = 1.0
  for (const r of results) {
    priceLevel *= (1 + r.inflationRate)
    r.priceLevel = priceLevel
  }
  return results
}

// 从最后一期历史数据校准 TFP
// 使用与前瞻模拟一致的有效工时公式，确保历史→模拟过渡无断裂
function computeTFPBase(historicalResults: PeriodResult[], params: Params): number {
  const lastHistorical = historicalResults[historicalResults.length - 1]
  if (!lastHistorical) return 1

  // 用基准加班参数计算有效周工时（与 runSinglePeriod 公式一致）
  const { overtimeHours, overtimeRate } = CHINA_BASELINE_OVERTIME
  const totalHours = params.normalHours + overtimeHours
  const excessHours = overtimeHours
  const fatigueFactor = params.fatigueCoeff * Math.pow(excessHours / params.normalHours, 2)
  const efficiencyFactor = Math.max(0.5, 1 - fatigueFactor)
  const effectiveWeeklyHours =
    (1 - overtimeRate) * params.normalHours
    + overtimeRate * totalHours * efficiencyFactor

  return calibrateTFP(
    lastHistorical.gdp,
    lastHistorical.capitalStock,
    lastHistorical.employment,
    effectiveWeeklyHours,
    params.techLevel,
    params.capitalElasticity
  )
}

// 初始化
const initialHistorical = loadHistoricalResults(DEFAULT_PARAMS)
const initialTFP = computeTFPBase(initialHistorical, DEFAULT_PARAMS)

export const useSimulator = create<SimState & UIState>()(
  persist(
    (set, get) => ({
      params: DEFAULT_PARAMS,
      results: initialHistorical,  // 只加载历史数据（2000-2025年）
      currentPeriod: initialHistorical.length,  // 26期（2025年）
      isRunning: false,
      timeStep: 'year',
      historicalPeriods: 26,
      simulationStartPeriod: 27,
      tfpBase: initialTFP,
      maxYear: 2050,  // 默认最大模拟到2050年

      // UI state
      chartCollapsed: {},

      // 核心：参数变化时只更新参数，不自动模拟
      setParams: (newParams) => {
        const state = get()
        const params = { ...state.params, ...newParams }
        const historicalResults = loadHistoricalResults(params)
        const tfpBase = computeTFPBase(historicalResults, params)
        set({
          params,
          results: historicalResults,  // 只加载历史数据
          currentPeriod: historicalResults.length,  // 26期（2025年）
          tfpBase,
        })
      },

      resetParams: () => {
        const historicalResults = loadHistoricalResults(DEFAULT_PARAMS)
        const tfpBase = computeTFPBase(historicalResults, DEFAULT_PARAMS)
        set({
          params: DEFAULT_PARAMS,
          results: historicalResults,  // 只加载历史数据，不预模拟
          currentPeriod: historicalResults.length,  // 26期（2025年）
          tfpBase,
        })
      },

      resetWithHistoricalData: () => {
        const { params } = get()
        const historicalResults = loadHistoricalResults(params)
        const tfpBase = computeTFPBase(historicalResults, params)
        set({
          results: historicalResults,  // 只加载历史数据
          currentPeriod: historicalResults.length,  // 26期（2025年）
          tfpBase,
        })
      },

      // 追加一个周期（用于动画播放时额外延伸）
      runSingleStep: () => {
        const { params, results, tfpBase, maxYear } = get()
        // 计算下一期年份，检查是否超过最大年份
        const nextPeriod = results.length + 1
        const nextYear = 1999 + nextPeriod  // period 1 = 2000, period 26 = 2025
        if (nextYear > maxYear) {
          set({ isRunning: false })  // 达到最大年份，停止模拟
          return
        }
        const prev = results.length > 0 ? results[results.length - 1] : null
        const newResult = runSinglePeriod(params, prev, nextPeriod, tfpBase)
        set((state) => ({
          results: [...state.results, newResult],
          currentPeriod: state.currentPeriod + 1,
        }))
      },

      setCurrentPeriod: (period) => set({ currentPeriod: period }),
      setIsRunning: (running) => set({ isRunning: running }),
      setTimeStep: (step) => set({ timeStep: step }),
      setMaxYear: (year) => set({ maxYear: Math.max(2026, Math.min(2100, year)) }),  // 限制范围 2026-2100

      saveToStorage: () => {
        const { params } = get()
        localStorage.setItem('economy-sim-params', JSON.stringify(params))
      },

      loadFromStorage: () => {
        const saved = localStorage.getItem('economy-sim-params')
        if (saved) {
          set({ params: JSON.parse(saved) })
        }
      },

      // UI actions
      setChartCollapsed: (key, collapsed) =>
        set((state) => ({
          chartCollapsed: { ...state.chartCollapsed, [key]: collapsed },
        })),

      toggleChartCollapsed: (key) =>
        set((state) => ({
          chartCollapsed: { ...state.chartCollapsed, [key]: !state.chartCollapsed[key] },
        })),

      collapseAll: () =>
        set(() => {
          const collapsed: Record<string, boolean> = {}
          CHART_KEYS.forEach((k) => (collapsed[k] = true))
          return { chartCollapsed: collapsed }
        }),

      expandAll: () =>
        set(() => {
          const collapsed: Record<string, boolean> = {}
          CHART_KEYS.forEach((k) => (collapsed[k] = false))
          return { chartCollapsed: collapsed }
        }),
    }),
    {
      name: 'economy-simulator-storage',
      partialize: (state) => ({
        params: state.params,
        chartCollapsed: state.chartCollapsed,
        maxYear: state.maxYear,
      }),
    }
  )
)
