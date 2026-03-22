# 经济学模拟器实现计划

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个中等复杂度的经济学模拟网站，通过调整加班参数观察经济演化

**Architecture:** 纯前端 React + TypeScript 应用，经济模型在浏览器端运行，使用 Recharts 绑定，Zustand 管理状态，LocalStorage 持久化

**Tech Stack:** React 18 + TypeScript + Recharts + Zustand + Vite

---

## Chunk 1: 项目初始化

### Task 1: 创建项目结构

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "economy-simulator",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "deploy": "npm run build && gh-pages -d dist"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.10.0",
    "zustand": "^4.4.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "gh-pages": "^6.1.0",
    "typescript": "^5.3.0",
    "vite": "^5.0.0"
  }
}
```

- [ ] **Step 2: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './'
})
```

- [ ] **Step 3: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: 创建 index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>经济模拟器</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: 创建 src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step 6: 创建 src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 7: 创建 src/App.tsx（临时占位）**

```typescript
function App() {
  return <div>经济模拟器</div>
}

export default App
```

- [ ] **Step 8: 安装依赖并验证构建**

Run: `cd /home/jacazjx/workspaces/economy_simulator && npm install`
Run: `npm run build`
Expected: 构建成功，生成 dist 目录

- [ ] **Step 9: 提交**

```bash
git init
git add package.json vite.config.ts tsconfig.json index.html src/
git commit -m "chore: initial project setup with Vite + React + TypeScript"
```

---

## Chunk 2: 经济模型引擎

### Task 2: 类型定义

**Files:**
- Create: `src/engine/types.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
export interface Params {
  // 基础参数
  initialPopulation: number      // 初始人口（万）
  initialCapital: number         // 初始资本（亿）
  techLevel: number             // 技术水平 A
  capitalElasticity: number     // 资本弹性 α

  // 劳动与加班
  normalHours: number          // 正常工时（小时/周）
  overtimeHours: number        // 加班时长（小时/周）
  overtimeRate: number         // 加班率（0-1）
  overtimePremium: number      // 加班费率（倍数）
  fatigueCoeff: number          // 疲劳系数 β
  attritionCoeff: number        // 劳动力流失系数 γ
  laborParticipation: number   // 劳动参与率

  // 外贸
  initialExport: number        // 初始出口额
  baseImportPropensity: number // 基础进口倾向
  techExportElasticity: number // 技术出口弹性 λ₁
  capacityExportElasticity: number // 产能出口弹性 λ₂
  incomeImportSensitivity: number // 收入进口敏感度 θ

  // 其他
  consumptionPropensity: number // 消费倾向
  depreciationRate: number      // 折旧率
  govExpenditureRatio: number  // 政府支出比例
}

export interface PeriodResult {
  period: number
  // 人口与就业
  population: number
  laborForce: number
  employment: number
  unemploymentRate: number
  laborRetention: number
  // 产出
  gdp: number
  gdpPerCapita: number
  gdpGrowthRate: number
  // 劳动
  totalLaborHours: number
  laborProductivity: number
  effectiveHours: number
  fatigueFactor: number
  // 收入
  wage: number
  totalLaborIncome: number
  consumption: number
  savings: number
  // 外贸
  export: number
  import: number
  netExport: number
  exportGrowthRate: number
  importPropensity: number
  // 资本
  capitalStock: number
  investment: number
}

export interface SimState {
  params: Params
  results: PeriodResult[]
  currentPeriod: number
  isRunning: boolean
}

export const DEFAULT_PARAMS: Params = {
  initialPopulation: 80000,
  initialCapital: 500,
  techLevel: 1.0,
  capitalElasticity: 0.35,

  normalHours: 40,
  overtimeHours: 0,
  overtimeRate: 0,
  overtimePremium: 1.5,
  fatigueCoeff: 0.1,
  attritionCoeff: 0.01,
  laborParticipation: 0.7,

  initialExport: 20,
  baseImportPropensity: 0.2,
  techExportElasticity: 0.3,
  capacityExportElasticity: 0.2,
  incomeImportSensitivity: 0.1,

  consumptionPropensity: 0.6,
  depreciationRate: 0.05,
  govExpenditureRatio: 0.15,
}
```

- [ ] **Step 2: 提交**

```bash
git add src/engine/types.ts
git commit -m "feat: add economic model type definitions"
```

---

### Task 3: 劳动市场模块

**Files:**
- Create: `src/engine/labor.ts`

- [ ] **Step 1: 创建劳动市场模块**

```typescript
import type { Params, PeriodResult } from './types'

export function calcFatigueFactor(params: Params, hours: number): number {
  const excess = Math.max(0, hours - params.normalHours)
  return params.fatigueCoeff * (excess / params.normalHours)
}

export function calcEffectiveHours(params: Params): number {
  const totalHours = params.normalHours + params.overtimeHours
  const fatigue = calcFatigueFactor(params, totalHours)
  return totalHours * (1 - fatigue)
}

export function calcEmployment(
  gdp: number,
  effectiveHours: number,
  laborProductivity: number,
  laborForce: number
): number {
  // 就业需求 = GDP / (有效工时 × 生产率)
  const demand = gdp / (effectiveHours * laborProductivity)
  // 就业人数 = min(需求, 劳动力人口)
  return Math.min(demand, laborForce)
}

export function calcUnemploymentRate(employment: number, laborForce: number): number {
  if (laborForce === 0) return 0
  return 1 - employment / laborForce
}

export function calcWage(params: Params): number {
  // 基本工资 + 加班费
  const baseWage = 1.0
  const overtimePremium = params.overtimeHours * params.overtimePremium * params.overtimeRate
  return baseWage * (1 + overtimePremium)
}

export function calcAttrition(params: Params, cumulativeStress: number): number {
  return 0.001 + params.attritionCoeff * cumulativeStress // base attrition +加班压力
}
```

- [ ] **Step 2: 提交**

```bash
git add src/engine/labor.ts
git commit -m "feat: add labor market module with overtime effects"
```

---

### Task 4: 外贸模块

**Files:**
- Create: `src/engine/trade.ts`

- [ ] **Step 1: 创建外贸模块**

```typescript
import type { Params, PeriodResult } from './types'

export function calcExportGrowth(
  params: Params,
  prevResult: PeriodResult | null
): number {
  if (!prevResult) return 0

  // 出口增长 = 技术效应 + 产能效应
  const techEffect = params.techExportElasticity * (params.techLevel - 1) // 假设技术变化
  const capacityEffect = params.capacityExportElasticity * prevResult.gdpGrowthRate

  return techEffect + capacityEffect
}

export function calcExport(params: Params, prevResult: PeriodResult | null): number {
  const growthRate = calcExportGrowth(params, prevResult)
  const prevExport = prevResult?.export ?? params.initialExport
  return prevExport * (1 + growthRate)
}

export function calcImportPropensity(
  params: Params,
  prevResult: PeriodResult | null
): number {
  if (!prevResult) return params.baseImportPropensity

  // 进口倾向 = 基础倾向 + 收入效应
  const incomeEffect = params.incomeImportSensitivity * prevResult.gdpGrowthRate
  return params.baseImportPropensity + incomeEffect
}

export function calcImport(
  params: Params,
  consumption: number,
  prevResult: PeriodResult | null
): number {
  const propensity = calcImportPropensity(params, prevResult)
  return propensity * consumption
}
```

- [ ] **Step 2: 提交**

```bash
git add src/engine/trade.ts
git commit -m "feat: add trade module with endogenous export/import"
```

---

### Task 5: 核心经济模型

**Files:**
- Create: `src/engine/model.ts`

- [ ] **Step 1: 创建核心经济模型**

```typescript
import type { Params, PeriodResult } from './types'
import { calcEffectiveHours, calcAttrition } from './labor'
import { calcExport, calcImport } from './trade'

export function runSinglePeriod(
  params: Params,
  prevResult: PeriodResult | null,
  period: number
): PeriodResult {
  // 1. 基础数据
  const population = prevResult
    ? prevResult.population * 1.002 // 人口自然增长 0.2%
    : params.initialPopulation

  const laborForce = population * params.laborParticipation

  // 2. 资本
  const capitalStock = prevResult
    ? prevResult.capitalStock * (1 - params.depreciationRate) + prevResult.investment
    : params.initialCapital

  // 3. 劳动与生产率
  const effectiveHours = calcEffectiveHours(params)
  const laborProductivity = params.techLevel // 简化为技术等于生产率
  const fatigueFactor = 1 - effectiveHours / (params.normalHours + params.overtimeHours)

  // 4. 产出（柯布-道格拉斯）
  const effectiveLabor = laborForce * effectiveHours * laborProductivity
  const gdp =
    params.techLevel *
    Math.pow(capitalStock, params.capitalElasticity) *
    Math.pow(effectiveLabor, 1 - params.capitalElasticity)

  // 5. 就业与失业
  const employment = Math.min(gdp / (effectiveHours * laborProductivity), laborForce)
  const unemploymentRate = 1 - employment / laborForce

  // 6. 收入分配
  const wage = 1 + params.overtimeHours * params.overtimePremium * params.overtimeRate
  const totalLaborIncome = wage * employment
  const consumption = params.consumptionPropensity * totalLaborIncome
  const savings = totalLaborIncome - consumption
  const investment = params.consumptionPropensity * gdp * 0.3 // 简化的投资

  // 7. 外贸
  const exportVal = calcExport(params, prevResult)
  const importVal = calcImport(params, consumption, prevResult)
  const netExport = exportVal - importVal

  // 8. 政府支出
  const govExpenditure = params.govExpenditureRatio * gdp

  // 9. 最终 GDP
  const finalGdp = consumption + investment + govExpenditure + netExport

  // 10. 劳动力留存
  const attrition = prevResult
    ? calcAttrition(params, prevResult.fatigueFactor * period)
    : 0.001
  const laborRetention = 1 - attrition

  return {
    period,
    population,
    laborForce,
    employment,
    unemploymentRate,
    laborRetention,
    gdp: finalGdp,
    gdpPerCapita: finalGdp / population,
    gdpGrowthRate: prevResult ? (finalGdp - prevResult.gdp) / prevResult.gdp : 0,
    totalLaborHours: employment * effectiveHours,
    laborProductivity,
    effectiveHours,
    fatigueFactor,
    wage,
    totalLaborIncome,
    consumption,
    savings,
    export: exportVal,
    import: importVal,
    netExport,
    exportGrowthRate: prevResult ? calcExportGrowthRate(exportVal, prevResult.export) : 0,
    importPropensity: params.baseImportPropensity,
    capitalStock,
    investment,
  }
}

function calcExportGrowthRate(current: number, prev: number): number {
  if (prev === 0) return 0
  return (current - prev) / prev
}

export function runSimulation(params: Params, periods: number): PeriodResult[] {
  const results: PeriodResult[] = []

  for (let i = 0; i < periods; i++) {
    const prev = results.length > 0 ? results[results.length - 1] : null
    results.push(runSinglePeriod(params, prev, i + 1))
  }

  return results
}
```

- [ ] **Step 2: 创建 engine index**

```typescript
export * from './types'
export * from './labor'
export * from './trade'
export * from './model'
```

- [ ] **Step 3: 提交**

```bash
git add src/engine/model.ts src/engine/index.ts
git commit -m "feat: add core economic model with Cobb-Douglas production"
```

---

## Chunk 3: 状态管理

### Task 6: Zustand Store

**Files:**
- Create: `src/store/useSimulator.ts`

- [ ] **Step 1: 创建 Zustand Store**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Params, PeriodResult } from '../engine/types'
import { DEFAULT_PARAMS } from '../engine/types'
import { runSimulation } from '../engine/model'

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
  periods: number

  // actions
  setParams: (params: Partial<Params>) => void
  resetParams: () => void
  runSimulation: () => void
  setCurrentPeriod: (period: number) => void
  setIsRunning: (running: boolean) => void
  setTimeStep: (step: 'year' | 'quarter') => void
  setPeriods: (periods: number) => void
  saveToStorage: () => void
  loadFromStorage: () => void
}

const CHART_KEYS = ['gdp', 'unemployment', 'productivity', 'population']

export const useSimulator = create<SimState & UIState>()(
  persist(
    (set, get) => ({
      // Sim state
      params: DEFAULT_PARAMS,
      results: [],
      currentPeriod: 0,
      isRunning: false,
      timeStep: 'year',
      periods: 20,

      // UI state
      chartCollapsed: {},

      // Sim actions
      setParams: (newParams) =>
        set((state) => ({
          params: { ...state.params, ...newParams },
        })),

      resetParams: () => set({ params: DEFAULT_PARAMS, results: [], currentPeriod: 0 }),

      runSimulation: () => {
        const { params, periods } = get()
        const results = runSimulation(params, periods)
        set({ results, currentPeriod: periods })
      },

      setCurrentPeriod: (period) => set({ currentPeriod: period }),

      setIsRunning: (running) => set({ isRunning: running }),

      setTimeStep: (step) => set({ timeStep: step }),

      setPeriods: (periods) => set({ periods }),

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
      }),
    }
  )
)
```

- [ ] **Step 2: 提交**

```bash
git add src/store/useSimulator.ts
git commit -m "feat: add Zustand store for simulator state"
```

---

## Chunk 4: UI 组件

### Task 7: 基础布局组件

**Files:**
- Create: `src/components/Dashboard/Dashboard.tsx`
- Create: `src/components/ControlPanel/ControlPanel.tsx`
- Create: `src/components/Charts/ChartPanel.tsx`
- Create: `src/components/IndicatorCards/IndicatorCards.tsx`
- Create: `src/components/DataTable/DataTable.tsx`

- [ ] **Step 1: 创建 Dashboard 组件**

```typescript
import { useSimulator } from '../../store/useSimulator'
import { ControlPanel } from '../ControlPanel/ControlPanel'
import { ChartPanel } from '../Charts/ChartPanel'
import { IndicatorCards } from '../IndicatorCards/IndicatorCards'
import { DataTable } from '../DataTable/DataTable'

export function Dashboard() {
  const { collapseAll, expandAll } = useSimulator()

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📊 经济模拟器</h1>
        <div className="header-actions">
          <button onClick={collapseAll}>全部收起</button>
          <button onClick={expandAll}>全部展开</button>
          <button onClick={() => useSimulator.getState().resetParams()}>重置</button>
          <button onClick={() => useSimulator.getState().runSimulation()}>运行模拟</button>
        </div>
      </header>
      <div className="dashboard-content">
        <aside className="control-panel">
          <ControlPanel />
        </aside>
        <main className="main-panel">
          <ChartPanel />
          <IndicatorCards />
          <DataTable />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建 ControlPanel 组件**

```typescript
import { useSimulator } from '../../store/useSimulator'
import type { Params } from '../../engine/types'

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  format?: (v: number) => string
}

function Slider({ label, value, min, max, step = 1, onChange, format = (v) => String(v) }: SliderProps) {
  return (
    <div className="slider-control">
      <label>
        {label}: <span>{format(value)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export function ControlPanel() {
  const { params, setParams, timeStep, setTimeStep, periods, setPeriods } = useSimulator()

  const update = <K extends keyof Params>(key: K, value: Params[K]) => {
    setParams({ [key]: value })
  }

  return (
    <div className="control-panel-inner">
      <section>
        <h3>📈 基础参数</h3>
        <Slider label="初始人口（万）" value={params.initialPopulation} min={10000} max={200000} onChange={(v) => update('initialPopulation', v)} />
        <Slider label="初始资本（亿）" value={params.initialCapital} min={100} max={2000} onChange={(v) => update('initialCapital', v)} />
        <Slider label="技术水平" value={params.techLevel} min={0.5} max={2} step={0.1} onChange={(v) => update('techLevel', v)} />
        <Slider label="资本弹性" value={params.capitalElasticity} min={0.2} max={0.5} step={0.05} onChange={(v) => update('capitalElasticity', v)} />
      </section>

      <section>
        <h3>⏰ 劳动与加班</h3>
        <Slider label="正常工时（小时/周）" value={params.normalHours} min={30} max={50} onChange={(v) => update('normalHours', v)} />
        <Slider label="加班时长（小时/周）" value={params.overtimeHours} min={0} max={40} onChange={(v) => update('overtimeHours', v)} />
        <Slider label="加班率" value={params.overtimeRate} min={0} max={1} step={0.05} format={(v) => `${(v * 100).toFixed(0)}%`} onChange={(v) => update('overtimeRate', v)} />
        <Slider label="加班费率（倍）" value={params.overtimePremium} min={1} max={3} step={0.1} onChange={(v) => update('overtimePremium', v)} />
        <Slider label="疲劳系数" value={params.fatigueCoeff} min={0} max={0.5} step={0.01} onChange={(v) => update('fatigueCoeff', v)} />
        <Slider label="劳动力流失系数" value={params.attritionCoeff} min={0} max={0.1} step={0.005} onChange={(v) => update('attritionCoeff', v)} />
        <Slider label="劳动参与率" value={params.laborParticipation} min={0.5} max={0.9} step={0.05} format={(v) => `${(v * 100).toFixed(0)}%`} onChange={(v) => update('laborParticipation', v)} />
      </section>

      <section>
        <h3>🌍 外贸参数</h3>
        <Slider label="初始出口额" value={params.initialExport} min={1} max={100} onChange={(v) => update('initialExport', v)} />
        <Slider label="基础进口倾向" value={params.baseImportPropensity} min={0} max={0.5} step={0.05} onChange={(v) => update('baseImportPropensity', v)} />
        <Slider label="技术出口弹性" value={params.techExportElasticity} min={0} max={1} step={0.1} onChange={(v) => update('techExportElasticity', v)} />
        <Slider label="产能出口弹性" value={params.capacityExportElasticity} min={0} max={1} step={0.1} onChange={(v) => update('capacityExportElasticity', v)} />
        <Slider label="收入进口敏感度" value={params.incomeImportSensitivity} min={0} max={0.5} step={0.05} onChange={(v) => update('incomeImportSensitivity', v)} />
      </section>

      <section>
        <h3>⚙️ 其他参数</h3>
        <Slider label="消费倾向" value={params.consumptionPropensity} min={0.4} max={0.9} step={0.05} onChange={(v) => update('consumptionPropensity', v)} />
        <Slider label="折旧率" value={params.depreciationRate} min={0} max={0.2} step={0.01} onChange={(v) => update('depreciationRate', v)} />
        <Slider label="政府支出比例" value={params.govExpenditureRatio} min={0} max={0.3} step={0.05} onChange={(v) => update('govExpenditureRatio', v)} />
      </section>

      <section>
        <h3>🎮 模拟控制</h3>
        <div className="control-row">
          <label>时间步长:</label>
          <select value={timeStep} onChange={(e) => setTimeStep(e.target.value as 'year' | 'quarter')}>
            <option value="year">年</option>
            <option value="quarter">季度</option>
          </select>
        </div>
        <Slider label="模拟期数" value={periods} min={5} max={50} onChange={setPeriods} />
      </section>
    </div>
  )
}
```

- [ ] **Step 3: 创建 ChartPanel 组件**

```typescript
import { useSimulator } from '../../store/useSimulator'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

interface ChartItemProps {
  title: string
  dataKey: string
  color: string
  format?: (v: number) => string
}

function ChartItem({ title, dataKey, color, format }: ChartItemProps) {
  const { chartCollapsed, toggleChartCollapsed, results, timeStep } = useSimulator()
  const collapsed = chartCollapsed[dataKey] ?? false

  const data = results.map((r) => ({
    period: `${timeStep === 'year' ? '年' : 'Q'}${r.period}`,
    [dataKey]: r[dataKey as keyof typeof r],
  }))

  return (
    <div className={`chart-item ${collapsed ? 'collapsed' : ''}`}>
      <div className="chart-header" onClick={() => toggleChartCollapsed(dataKey)}>
        <span className="chart-title">{title}</span>
        <button>{collapsed ? '▶' : '▼'}</button>
      </div>
      {!collapsed && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis tickFormatter={format} />
            <Tooltip formatter={(v: number) => format ? format(v) : String(v)} />
            <Line type="monotone" dataKey={dataKey} stroke={color} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ChartPanel() {
  return (
    <div className="chart-panel">
      <ChartItem title="📈 GDP趋势" dataKey="gdp" color="#8884d8" format={(v) => `${(v / 10000).toFixed(1)}万亿`} />
      <ChartItem title="📉 失业率" dataKey="unemploymentRate" color="#ff7300" format={(v) => `${(v * 100).toFixed(1)}%`} />
      <ChartItem title="💼 劳动生产率" dataKey="laborProductivity" color="#00C49F" format={(v) => v.toFixed(2)} />
      <ChartItem title="👥 人口变化" dataKey="population" color="#FF6B6B" format={(v) => `${(v / 10000).toFixed(1)}亿`} />
    </div>
  )
}
```

- [ ] **Step 4: 创建 IndicatorCards 组件**

```typescript
import { useSimulator } from '../../store/useSimulator'

export function IndicatorCards() {
  const { results, currentPeriod } = useSimulator()
  const latest = currentPeriod > 0 ? results[currentPeriod - 1] : null

  if (!latest) return null

  const cards = [
    { label: 'GDP', value: `${(latest.gdp / 10000).toFixed(2)}万亿`, change: `${(latest.gdpGrowthRate * 100).toFixed(1)}%` },
    { label: '人均GDP', value: `${(latest.gdpPerCapita).toFixed(0)}`, change: '' },
    { label: '失业率', value: `${(latest.unemploymentRate * 100).toFixed(1)}%`, change: '' },
    { label: '劳动生产率', value: latest.laborProductivity.toFixed(2), change: '' },
    { label: '总人口', value: `${(latest.population / 10000).toFixed(1)}亿`, change: '' },
    { label: '净出口', value: `${(latest.netExport).toFixed(1)}`, change: '' },
  ]

  return (
    <div className="indicator-cards">
      {cards.map((card) => (
        <div key={card.label} className="indicator-card">
          <span className="card-label">{card.label}</span>
          <span className="card-value">{card.value}</span>
          {card.change && <span className="card-change">{card.change}</span>}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 5: 创建 DataTable 组件**

```typescript
import { useSimulator } from '../../store/useSimulator'

export function DataTable() {
  const { results } = useSimulator()

  if (results.length === 0) return null

  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>期数</th>
            <th>GDP</th>
            <th>人口</th>
            <th>失业率</th>
            <th>就业</th>
            <th>劳动生产率</th>
            <th>出口</th>
            <th>进口</th>
          </tr>
        </thead>
        <tbody>
          {results.map((r) => (
            <tr key={r.period}>
              <td>{r.period}</td>
              <td>{(r.gdp / 10000).toFixed(2)}万亿</td>
              <td>{(r.population / 10000).toFixed(1)}亿</td>
              <td>{(r.unemploymentRate * 100).toFixed(1)}%</td>
              <td>{(r.employment / 10000).toFixed(1)}万</td>
              <td>{r.laborProductivity.toFixed(2)}</td>
              <td>{r.export.toFixed(1)}</td>
              <td>{r.import.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 6: 创建 utils/storage.ts**

```typescript
import type { Params } from '../engine/types'

export function saveParams(params: Params): void {
  localStorage.setItem('economy-sim-params', JSON.stringify(params))
}

export function loadParams(): Params | null {
  const saved = localStorage.getItem('economy-sim-params')
  if (saved) {
    try {
      return JSON.parse(saved) as Params
    } catch {
      return null
    }
  }
  return null
}

export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 7: 更新 Dashboard 组件（添加保存/导出按钮 + 动画播放）**

```typescript
import { useEffect, useRef } from 'react'
import { useSimulator } from '../../store/useSimulator'
import { ControlPanel } from '../ControlPanel/ControlPanel'
import { ChartPanel } from '../Charts/ChartPanel'
import { IndicatorCards } from '../IndicatorCards/IndicatorCards'
import { DataTable } from '../DataTable/DataTable'
import { exportToCSV } from '../../utils/export'
import { saveParams } from '../../utils/storage'

export function Dashboard() {
  const { collapseAll, expandAll, params, results, isRunning, currentPeriod, setIsRunning, setCurrentPeriod, runSimulation } = useSimulator()
  const timerRef = useRef<number | null>(null)

  // 动画播放逻辑
  useEffect(() => {
    if (isRunning && currentPeriod < results.length) {
      timerRef.current = window.setTimeout(() => {
        setCurrentPeriod(currentPeriod + 1)
      }, 500)
    } else if (currentPeriod >= results.length) {
      setIsRunning(false)
    }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isRunning, currentPeriod, results.length, setCurrentPeriod, setIsRunning])

  const handlePlay = () => {
    if (currentPeriod === 0 || currentPeriod >= results.length) {
      runSimulation()
      setCurrentPeriod(1)
    }
    setIsRunning(true)
  }

  const handlePause = () => setIsRunning(false)

  const handleSave = () => saveParams(params)

  const handleExport = () => exportToCSV(results)

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📊 经济模拟器</h1>
        <div className="header-actions">
          <button onClick={collapseAll}>全部收起</button>
          <button onClick={expandAll}>全部展开</button>
          <button onClick={() => { useSimulator.getState().resetParams(); setCurrentPeriod(0) }}>重置</button>
          <button onClick={handleSave}>保存</button>
          <button onClick={handleExport}>导出</button>
          {!isRunning ? (
            <button onClick={handlePlay}>▶ 开始</button>
          ) : (
            <button onClick={handlePause}>⏸ 暂停</button>
          )}
        </div>
      </header>
      <div className="dashboard-content">
        <aside className="control-panel">
          <ControlPanel />
        </aside>
        <main className="main-panel">
          <ChartPanel />
          <IndicatorCards />
          <DataTable />
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: 更新 App.tsx**

```typescript
import { Dashboard } from './components/Dashboard/Dashboard'
import './App.css'

function App() {
  return <Dashboard />
}

export default App
```

- [ ] **Step 9: 创建基础样式文件 App.css**

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f5f5;
}

.dashboard {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.dashboard-header h1 {
  font-size: 20px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-actions button {
  padding: 8px 16px;
  border: 1px solid #ddd;
  background: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.dashboard-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.control-panel {
  width: 320px;
  background: #fff;
  border-right: 1px solid #eee;
  overflow-y: auto;
}

.main-panel {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.control-panel-inner {
  padding: 16px;
}

.control-panel-inner section {
  margin-bottom: 24px;
}

.control-panel-inner h3 {
  margin-bottom: 12px;
  font-size: 14px;
  color: #666;
}

.slider-control {
  margin-bottom: 12px;
}

.slider-control label {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 4px;
}

.slider-control input {
  width: 100%;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.control-row select {
  padding: 4px 8px;
}

.chart-panel {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.chart-item {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.chart-item.collapsed {
  padding: 8px 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  cursor: pointer;
}

.chart-header button {
  background: none;
  border: none;
  cursor: pointer;
}

.indicator-cards {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.indicator-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;
}

.card-label {
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.card-value {
  font-size: 18px;
  font-weight: 600;
}

.card-change {
  font-size: 12px;
  color: green;
}

.data-table {
  background: #fff;
  border-radius: 8px;
  overflow: auto;
}

.data-table table {
  width: 100%;
  border-collapse: collapse;
}

.data-table th,
.data-table td {
  padding: 12px;
  text-align: right;
  border-bottom: 1px solid #eee;
}

.data-table th {
  background: #fafafa;
  font-weight: 600;
  font-size: 12px;
}

.data-table td {
  font-size: 13px;
}
```

- [ ] **Step 10: 提交**

```bash
git add src/components/ src/App.tsx src/App.css
git commit -m "feat: add all UI components with animation playback, save and export"
```

---

## Chunk 5: 功能完善

### Task 8: CSV 导出功能

**Files:**
- Create: `src/utils/export.ts`
- Modify: `src/components/Dashboard/Dashboard.tsx`（添加导出按钮）

- [ ] **Step 1: 创建导出工具**

```typescript
import type { PeriodResult } from '../engine/types'

export function exportToCSV(results: PeriodResult[], filename: string = 'simulation.csv') {
  const headers = [
    '期数', 'GDP', 'GDP增长率', '人均GDP',
    '人口', '劳动力', '就业', '失业率',
    '劳动生产率', '总工时', '工资', '劳动收入',
    '消费', '储蓄', '出口', '进口', '净出口',
    '资本存量', '投资'
  ]

  const rows = results.map(r => [
    r.period,
    r.gdp.toFixed(2),
    (r.gdpGrowthRate * 100).toFixed(2) + '%',
    r.gdpPerCapita.toFixed(2),
    r.population.toFixed(0),
    r.laborForce.toFixed(0),
    r.employment.toFixed(0),
    (r.unemploymentRate * 100).toFixed(2) + '%',
    r.laborProductivity.toFixed(4),
    r.totalLaborHours.toFixed(0),
    r.wage.toFixed(4),
    r.totalLaborIncome.toFixed(2),
    r.consumption.toFixed(2),
    r.savings.toFixed(2),
    r.export.toFixed(2),
    r.import.toFixed(2),
    r.netExport.toFixed(2),
    r.capitalStock.toFixed(2),
    r.investment.toFixed(2),
  ])

  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
```

- [ ] **Step 2: Dashboard 导出/保存按钮（已在 Chunk 4 Task 7 Step 7 中实现）**

Dashboard 组件已包含导出和保存按钮，无需额外修改。

- [ ] **Step 3: 提交**

```bash
git add src/utils/export.ts
git commit -m "feat: add CSV export functionality"
```

---

### Task 9: GitHub Pages 部署配置

**Files:**
- Modify: `package.json`（添加 homepage 字段）
- Create: `README.md`

- [ ] **Step 1: 更新 package.json 添加 homepage**

```json
{
  "name": "economy-simulator",
  "homepage": "https://你的用户名.github.io/economy_simulator/",
  ...
}
```

- [ ] **Step 2: 创建 README.md**

```markdown
# 经济模拟器

一个基于 React 的经济学模拟网站，用于模拟加班对经济的影响。

## 功能

- 可调节的加班参数（加班时长、加班率）
- 完整的经济模型（生产函数、劳动市场、外贸）
- 实时图表展示
- CSV 数据导出
- GitHub Pages 免费托管

## 运行

```bash
npm install
npm run dev
```

## 部署

```bash
npm run deploy
```
```

- [ ] **Step 3: 提交**

```bash
git add package.json README.md
git commit -m "docs: add README and configure GitHub Pages deployment"
```

---

## 总结

**Chunk 1:** 项目初始化 + 依赖安装
**Chunk 2:** 经济模型引擎（类型、劳动、外贸、生产函数）
**Chunk 3:** Zustand 状态管理
**Chunk 4:** UI 组件（Dashboard、ControlPanel、Charts、IndicatorCards、DataTable） + 动画播放 + 保存/导出
**Chunk 5:** CSV 导出工具 + GitHub Pages 部署配置

**修复内容:**
- 修复 ChartPanel 中 `timeStep` 冗余解构（仅 ChartItem 内部使用）
- 新增 utils/storage.ts（保存/加载工具函数）
- Dashboard 新增保存按钮、导出按钮
- Dashboard 新增动画播放（开始/暂停）功能，基于 isRunning + setInterval

**Total: 9 Tasks**

Plan complete and saved to `docs/superpowers/plans/2026-03-22-economy-simulator-plan.md`. Ready to execute?