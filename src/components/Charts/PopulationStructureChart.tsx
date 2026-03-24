import { useSimulator } from '../../store/useSimulator'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { getPeriodLabel } from './ChartPanel'

// 人口结构面积图（堆叠）
export function PopulationStructureChart() {
  const { chartCollapsed, toggleChartCollapsed, results } = useSimulator()
  const collapsed = chartCollapsed['populationStructure'] ?? false

  const data = results.map((r) => ({
    period: getPeriodLabel(r.period),
    '0-14岁': r.age0_14 * 100,
    '15-64岁': r.age15_64 * 100,
    '65岁及以上': r.age65plus * 100,
  }))

  return (
    <div className={`chart-item ${collapsed ? 'collapsed' : ''}`}>
      <div className="chart-header" onClick={() => toggleChartCollapsed('populationStructure')}>
        <span className="chart-title">📊 人口结构变化</span>
        <button>{collapsed ? '▶' : '▼'}</button>
      </div>
      {!collapsed && (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={data}>
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
            <YAxis
              tickFormatter={(v) => `${v.toFixed(0)}%`}
              tick={{ fill: '#a0a0a0' }}
              stroke="#444"
              domain={[0, 100]}
            />
            <Tooltip
              formatter={(v: number) => `${v.toFixed(1)}%`}
              labelFormatter={(label: string) => label}
              contentStyle={{
                backgroundColor: '#1e1e1e',
                border: '1px solid #333',
                borderRadius: '4px',
                color: '#e8e8e8'
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px' }}
              formatter={(value) => <span style={{ color: '#a0a0a0' }}>{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="65岁及以上"
              stackId="1"
              stroke="#ff6b9d"
              fill="#ff6b9d"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="15-64岁"
              stackId="1"
              stroke="#6b9fff"
              fill="#6b9fff"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="0-14岁"
              stackId="1"
              stroke="#6bcb77"
              fill="#6bcb77"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}