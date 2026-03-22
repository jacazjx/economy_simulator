import { useEffect, useRef } from 'react'
import { useSimulator } from '../../store/useSimulator'
import { ControlPanel } from '../ControlPanel/ControlPanel'
import { ChartPanel } from '../Charts/ChartPanel'
import { IndicatorCards } from '../IndicatorCards/IndicatorCards'
import { DataTable } from '../DataTable/DataTable'
import { exportToCSV } from '../../utils/export'
import { saveParams } from '../../utils/storage'

export function Dashboard() {
  const {
    collapseAll, expandAll, params, results, isRunning, currentPeriod,
    setIsRunning, runSingleStep, resetParams,
  } = useSimulator()
  const timerRef = useRef<number | null>(null)

  // 无限模拟：isRunning 时每个 tick 追加一个 period
  useEffect(() => {
    if (isRunning) {
      timerRef.current = window.setTimeout(() => {
        runSingleStep()
      }, 300)
    }
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [isRunning, currentPeriod, runSingleStep])

  const handlePlay = () => setIsRunning(true)

  const handlePause = () => setIsRunning(false)

  const handleSave = () => saveParams(params)

  const handleExport = () => exportToCSV(results)

  const handleReset = () => {
    setIsRunning(false)  // 先停止模拟
    resetParams()        // 重置参数和数据（包含正确的 currentPeriod: 26）
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>📊 经济模拟器 · 加班对中国经济的影响</h1>
        <div className="header-actions">
          <button onClick={collapseAll}>全部收起</button>
          <button onClick={expandAll}>全部展开</button>
          <button onClick={handleReset}>重置</button>
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
