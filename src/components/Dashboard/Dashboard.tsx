import { useEffect, useRef, useState } from 'react'
import { useSimulator } from '../../store/useSimulator'
import { ControlPanel } from '../ControlPanel/ControlPanel'
import { ChartPanel } from '../Charts/ChartPanel'
import { IndicatorCards } from '../IndicatorCards/IndicatorCards'
import { DataTable } from '../DataTable/DataTable'

export function Dashboard() {
  const {
    isRunning, currentPeriod,
    setIsRunning, runSingleStep, resetParams,
  } = useSimulator()
  const timerRef = useRef<number | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

  const handleReset = () => {
    setIsRunning(false)
    resetParams()
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-left">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="切换菜单"
          >
            ☰
          </button>
          <h1>📊 经济模拟器</h1>
        </div>
        <div className="header-actions">
          <button onClick={handleReset}>重置</button>
          {!isRunning ? (
            <button onClick={handlePlay}>▶ 开始</button>
          ) : (
            <button onClick={handlePause}>⏸ 暂停</button>
          )}
        </div>
      </header>
      <div className="dashboard-content">
        {/* 移动端遮罩层 */}
        {sidebarOpen && (
          <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
        )}
        <aside className={`control-panel ${sidebarOpen ? 'open' : ''}`}>
          <div className="control-panel-header">
            <span>参数设置</span>
            <button className="close-btn" onClick={() => setSidebarOpen(false)}>✕</button>
          </div>
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
