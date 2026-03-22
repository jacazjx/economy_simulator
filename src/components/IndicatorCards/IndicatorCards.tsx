import { useSimulator } from '../../store/useSimulator'
import { getPeriodLabel } from '../Charts/ChartPanel'

export function IndicatorCards() {
  const { results, currentPeriod, historicalPeriods } = useSimulator()
  const latest = currentPeriod > 0 ? results[currentPeriod - 1] : null

  if (!latest) return null

  const isHistorical = latest.period <= historicalPeriods
  const yearLabel = getPeriodLabel(latest.period)

  const cards = [
    { label: '当前年份', value: yearLabel, change: isHistorical ? '历史数据' : '模拟预测', changeClass: isHistorical ? 'historical' : 'simulated' },
    { label: 'GDP', value: `${(latest.gdp / 10000).toFixed(2)}万亿`, change: `${(latest.gdpGrowthRate * 100).toFixed(1)}%` },
    { label: '失业率', value: `${(latest.unemploymentRate * 100).toFixed(1)}%`, change: '' },
    { label: '平均工资', value: `${latest.wage.toFixed(2)}万`, change: '' },
    { label: '劳动生产率', value: `${latest.laborProductivity.toFixed(1)}元/h`, change: '' },
    { label: '总人口', value: `${(latest.population / 10000).toFixed(1)}亿`, change: '' },
    { label: '净出口', value: `${(latest.netExport / 10000).toFixed(2)}万亿`, change: '' },
  ]

  return (
    <div className="indicator-cards">
      {cards.map((card) => (
        <div key={card.label} className={`indicator-card ${card.changeClass || ''}`}>
          <span className="card-label">{card.label}</span>
          <span className="card-value">{card.value}</span>
          {card.change && <span className={`card-change ${card.changeClass || ''}`}>{card.change}</span>}
        </div>
      ))}
    </div>
  )
}
