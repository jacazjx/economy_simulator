import { useSimulator } from '../../store/useSimulator'
import { getPeriodLabel } from '../Charts/ChartPanel'

export function DataTable() {
  const { results } = useSimulator()

  if (results.length === 0) return null

  return (
    <div className="data-table">
      <div className="data-table-wrapper">
        <table>
          <thead>
            <tr>
              <th>年份</th>
              <th>GDP</th>
              <th>人口</th>
              <th>失业率</th>
              <th>就业</th>
              <th>人均年收入</th>
              <th>劳动生产率</th>
              <th>出口</th>
              <th>进口</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.period}>
                <td>{getPeriodLabel(r.period)}</td>
                <td>{(r.gdp / 10000).toFixed(2)}万亿</td>
                <td>{(r.population / 10000).toFixed(1)}亿</td>
                <td>{(r.unemploymentRate * 100).toFixed(1)}%</td>
                <td>{(r.employment / 10000).toFixed(0)}万</td>
                <td>{r.wage.toFixed(2)}万</td>
                <td>{r.laborProductivity.toFixed(1)}元/h</td>
                <td>{(r.export / 10000).toFixed(2)}万亿</td>
                <td>{(r.import / 10000).toFixed(2)}万亿</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
