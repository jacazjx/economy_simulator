import { useSimulator } from '../../store/useSimulator'
import { CHINA_2025_PARAMS, CHINA_BASELINE_OVERTIME } from '../../engine/types'

// 预设参数（基于OECD/ILO 2024-2025年数据）
const PRESETS = {
  currentChina: CHINA_BASELINE_OVERTIME,
  germany: { overtimeHours: -6, overtimeRate: 0.85 },   // 实际均周~34.9h
  france: { overtimeHours: -5, overtimeRate: 0.80 },    // 法定35h制，均周~36h
  usa: { overtimeHours: 1, overtimeRate: 0.15 },        // 实际均周~40.2h
  japan: { overtimeHours: 2, overtimeRate: 0.15 },
  korea: { overtimeHours: 3, overtimeRate: 0.20 },
  economicOptimal: { overtimeHours: 0, overtimeRate: 0 },
}


export function ControlPanel() {
  const { params, setParams, timeStep, setTimeStep, resetParams, maxYear, setMaxYear } = useSimulator()

  return (
    <div className="control-panel-inner">
      <section>
        <h3>📌 2025年中国基准经济参数（固定）</h3>

        <div className="fixed-params">
          <div className="param-row">
            <span className="param-label">人口</span>
            <span className="param-value">{(CHINA_2025_PARAMS.initialPopulation / 10000).toFixed(1)} 亿</span>
          </div>
          <div className="param-row">
            <span className="param-label">资本存量</span>
            <span className="param-value">{(CHINA_2025_PARAMS.initialCapital / 10000).toFixed(0)} 万亿</span>
          </div>
          <div className="param-row">
            <span className="param-label">劳动参与率</span>
            <span className="param-value">{(CHINA_2025_PARAMS.laborParticipation * 100).toFixed(0)}%</span>
          </div>
          <div className="param-row">
            <span className="param-label">消费倾向</span>
            <span className="param-value">{(CHINA_2025_PARAMS.consumptionPropensity * 100).toFixed(0)}%</span>
          </div>
          <div className="param-row">
            <span className="param-label">资本弹性 α</span>
            <span className="param-value">{CHINA_2025_PARAMS.capitalElasticity}</span>
          </div>
          <div className="param-row">
            <span className="param-label">折旧率</span>
            <span className="param-value">{(CHINA_2025_PARAMS.depreciationRate * 100).toFixed(0)}%</span>
          </div>
          <div className="param-row">
            <span className="param-label">净迁移率</span>
            <span className="param-value">{(CHINA_2025_PARAMS.populationGrowthRate * 100).toFixed(1)}%</span>
          </div>
          <div className="param-row">
            <span className="param-label">TFP年增长率</span>
            <span className="param-value">{(CHINA_2025_PARAMS.tfpGrowthRate * 100).toFixed(0)}%</span>
          </div>
          <div className="param-row">
            <span className="param-label">资本再投资率</span>
            <span className="param-value">{(CHINA_2025_PARAMS.capitalReinvestmentRate * 100).toFixed(0)}%</span>
          </div>
          <div className="param-row">
            <span className="param-label">年出口额</span>
            <span className="param-value">{(CHINA_2025_PARAMS.initialExport / 10000).toFixed(1)} 万亿</span>
          </div>
        </div>
      </section>

      <section>
        <h3>⏰ 加班参数（可调节）</h3>
        <div className="slider-control">
          <label>
            工时调整（小时/周）: <span>{params.overtimeHours >= 0 ? '+' : ''}{params.overtimeHours} h</span>
          </label>
          <input
            type="range"
            min={-20}
            max={40}
            step={1}
            value={params.overtimeHours}
            onChange={(e) => setParams({ overtimeHours: Number(e.target.value) })}
          />
        </div>
        <div className="slider-control">
          <label>
            加班率: <span>{(params.overtimeRate * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={params.overtimeRate}
            onChange={(e) => setParams({ overtimeRate: Number(e.target.value) })}
          />
        </div>
        <p className="param-hint">
          加班率 = 参与加班的劳动者比例
        </p>

        <div className="preset-buttons">
          <div className="preset-group-label">🇨🇳 中国参考</div>
          <button
            className="preset-btn preset-btn--warning"
            onClick={() => setParams(PRESETS.currentChina)}
            title="校准值：(1-57%)×40 + 57%×47 ≈ 44h/周，与国家统计局实际周均工时一致"
          >
            <span>📊 当前中国平均</span>
            <span className="preset-detail">7h · 57%</span>
          </button>

          <div className="preset-group-label">🌍 发达国家对比（OECD/ILO 2024-25）</div>
          <button
            className="preset-btn preset-btn--neutral"
            onClick={() => setParams(PRESETS.germany)}
            title="OECD数据：德国周均工时约35小时"
          >
            <span>🇩🇪 德国</span>
            <span className="preset-detail">-6h · 85%</span>
          </button>
          <button
            className="preset-btn preset-btn--neutral"
            onClick={() => setParams(PRESETS.france)}
            title="OECD数据：法国法定35h制，周均工时约36小时"
          >
            <span>🇫🇷 法国</span>
            <span className="preset-detail">-5h · 80%</span>
          </button>
          <button
            className="preset-btn preset-btn--neutral"
            onClick={() => setParams(PRESETS.usa)}
            title="OECD数据：美国周均工时约40小时"
          >
            <span>🇺🇸 美国</span>
            <span className="preset-detail">+1h · 15%</span>
          </button>
          <button
            className="preset-btn preset-btn--neutral"
            onClick={() => setParams(PRESETS.japan)}
            title="OECD数据：日本周均工时约41小时"
          >
            <span>🇯🇵 日本</span>
            <span className="preset-detail">2h · 15%</span>
          </button>
          <button
            className="preset-btn preset-btn--neutral"
            onClick={() => setParams(PRESETS.korea)}
            title="OECD数据：韩国周均工时约40小时"
          >
            <span>🇰🇷 韩国</span>
            <span className="preset-detail">3h · 20%</span>
          </button>

          <div className="preset-group-label">💡 理论参考</div>
          <button
            className="preset-btn preset-btn--success"
            onClick={() => setParams(PRESETS.economicOptimal)}
            title="疲劳成本 = 边际产出，净效益为零"
          >
            <span>🎯 经济学最优</span>
            <span className="preset-detail">0h · 0%</span>
          </button>
        </div>
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
        <div className="control-row" style={{ marginTop: '8px' }}>
          <label>最大模拟年份:</label>
          <input
            type="number"
            min={2026}
            max={2100}
            value={maxYear}
            onChange={(e) => setMaxYear(Number(e.target.value))}
          />
        </div>
        <div className="control-row" style={{ marginTop: '8px' }}>
          <button onClick={resetParams}>
            重置加班参数
          </button>
        </div>
      </section>
    </div>
  )
}
