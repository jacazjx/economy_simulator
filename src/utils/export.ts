import type { PeriodResult } from '../engine/types'

export function exportToCSV(results: PeriodResult[], filename: string = 'simulation.csv') {
  const headers = [
    '期数', 'GDP', 'GDP增长率', '人均GDP',
    '人口', '劳动力', '就业', '失业率',
    '劳动生产率', '总工时', '技术水平', '工资', '劳动收入', '资本收入',
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
    r.currentTechLevel.toFixed(4),
    r.wage.toFixed(4),
    r.totalLaborIncome.toFixed(2),
    r.capitalIncome.toFixed(2),
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
