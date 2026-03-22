import { useSimulator } from '../../store/useSimulator'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PopulationStructureChart } from './PopulationStructureChart'

// 将期数转换为年份
// 第1期 = 2000年, 第26期 = 2025年（历史数据结束）, 第27期 = 2026年（模拟开始）
export function periodToYear(period: number): number {
  return 1999 + period
}

// 获取期数的显示标签
export function getPeriodLabel(period: number): string {
  const year = periodToYear(period)
  if (period <= 26) {
    return `${year}年`  // 历史数据（2000-2025年）
  } else {
    return `${year}年(模拟)`  // 模拟数据（2026年及以后）
  }
}

interface ChartItemProps {
  title: string
  dataKey: string
  color: string
  format?: (v: number) => string
}

function ChartItem({ title, dataKey, color, format }: ChartItemProps) {
  const { chartCollapsed, toggleChartCollapsed, results } = useSimulator()
  const collapsed = chartCollapsed[dataKey] ?? false

  const data = results.map((r) => {
    const rawValue = r[dataKey as keyof typeof r] as number
    // 过滤无效值
    const value = (typeof rawValue === 'number' && isFinite(rawValue)) ? rawValue : 0
    return {
      period: getPeriodLabel(r.period),
      periodNum: r.period,
      [dataKey]: value,
    }
  })

  return (
    <div className={`chart-item ${collapsed ? 'collapsed' : ''}`}>
      <div className="chart-header" onClick={() => toggleChartCollapsed(dataKey)}>
        <span className="chart-title">{title}</span>
        <button>{collapsed ? '▶' : '▼'}</button>
      </div>
      {!collapsed && (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 10, fill: '#a0a0a0' }}
              interval={4}
              angle={-45}
              textAnchor="end"
              height={60}
              stroke="#444"
            />
            <YAxis tickFormatter={format} tick={{ fill: '#a0a0a0' }} stroke="#444" />
            <Tooltip
              formatter={(v: number) => format ? format(v) : String(v)}
              labelFormatter={(label: string) => label}
              contentStyle={{
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#e8e8e8'
              }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}

export function ChartPanel() {
  return (
    <div className="chart-panel">
      <ChartItem title="📈 GDP趋势" dataKey="gdp" color="#6b9fff" format={(v) => `${(v / 10000).toFixed(1)}万亿`} />
      <ChartItem title="📉 失业率" dataKey="unemploymentRate" color="#ff9f43" format={(v) => `${(v * 100).toFixed(1)}%`} />
      <ChartItem title="💰 平均工资" dataKey="wage" color="#ffd93d" format={(v) => `${v.toFixed(1)}万`} />
      <ChartItem title="👶 新生儿人口" dataKey="birthPopulation" color="#6bcb77" format={(v) => `${v.toFixed(0)}万`} />
      <ChartItem title="👥 总人口" dataKey="population" color="#ff6b9d" format={(v) => `${(v / 10000).toFixed(1)}亿`} />
      <PopulationStructureChart />
    </div>
  )
}
