# 经济模拟引擎：完整计算逻辑文档

## 概述

本引擎是一个**供需双侧联动**的宏观经济模拟器，核心研究**工时政策**（加班/减时）对经济系统的全链路影响。引擎以中国 2025 年经济数据为基准，逐期（年）迭代求解，输出 GDP、就业、人口、贸易等全部宏观指标。

**模型性质**：新古典供给侧（Cobb-Douglas 生产函数）+ 凯恩斯需求侧（产能利用率）的混合模型。GDP 由供给潜力和需求强度共同决定。

---

## 一、参数体系

### 1.1 固定参数（中国 2025 年基准）

| 参数 | 符号 | 值 | 说明 |
|------|------|------|------|
| 初始人口 | P₀ | 140,000 万 | 14 亿 |
| 初始资本 | K₀ | 5,000,000 亿 | 资本产出比 ≈ 3.5 |
| 技术水平 | A₀ | 1.0 | 基准（TFP 校准吸收绝对水平） |
| 资本弹性 | α | 0.35 | Cobb-Douglas 资本份额 |
| 正常工时 | h₀ | 40 h/周 | 法定标准工时 |
| 疲劳系数 | β | 0.5 | 二次方疲劳公式系数 |
| 劳动力流失系数 | γ | 0.03 | 累积疲劳→离职率 |
| 劳动参与率 | LPR | 0.56 | 校准匹配 2025 就业 75,000 万 |
| TFP 年增长率 | g_A | 2% | 全要素生产率增长 |
| 资本再投资率 | s_k | 0.45 | 资本收入中再投资比例 |
| 消费倾向 | c₀ | 0.58 | 可支配劳动收入的消费比例 |
| 折旧率 | δ | 8% | 年度资本折旧 |
| 基础通胀 | π₀ | 2% | 央行隐含目标 |
| 菲利普斯系数 | φ | 0.3 | 失业缺口→通胀影响 |
| 税率 | τ | 18% | 综合宏观税负 |
| 政府投资占比 | g_inv | 35% | 财政支出中投资性支出比例 |
| 初始出口 | EX₀ | 170,000 亿 | 2025 年出口 |
| 基础进口倾向 | m₀ | 0.23 | 校准：实际进口/模型总消费 ≈ 0.234 |
| 技术出口弹性 | λ₁ | 0.3 | 技术→出口竞争力 |
| 产能出口弹性 | λ₂ | 0.2 | GDP 增长→出口供给 |
| 收入进口敏感度 | θ | 0.1 | GDP 增长→进口需求 |

### 1.2 用户可调参数

| 参数 | 符号 | 范围 | 说明 |
|------|------|------|------|
| 工时偏移 | Δh | -20 ~ +40 h/周 | 正=加班，负=减时 |
| 覆盖率 | r | 0 ~ 100% | 受工时政策影响的劳动者比例 |

### 1.3 中国 2025 基准加班

```
Δh = +7 h/周, r = 57%
加权平均周工时 = (1-0.57)×40 + 0.57×47 ≈ 44 h
（与国家统计局实际周均工时一致）
```

---

## 二、每期计算流程

每个模拟周期依次执行以下 15 个步骤。步骤间存在大量反馈：当期输出作为下期输入。

### 步骤 0：工时偏离（全局共享量）

```
rawAvgWeeklyHours = h₀ + r × Δh
workHoursDeviation = (rawAvgWeeklyHours - h₀) / h₀
```

- 正值 = 加班（人均工时高于标准）
- 负值 = 减时（人均工时低于标准）
- 此变量被人口、TFP、劳动参与率等多个模块引用

---

### 步骤 1：人口动力学

#### 1a. 年龄结构

```
age65plus(t) = min(0.35, age65plus(t-1) + 0.005)
```
65+ 占比每年 +0.5pp（历史队列效应驱动），上限 35%。

```
birthDrivenAge0_14 = min(0.25, prevBirthRate × 14)
age0_14(t) = max(0.05, 0.9 × age0_14(t-1) + 0.1 × birthDrivenAge0_14)
age15_64 = 1 - age65plus - age0_14
```
0-14 岁占比向出生率均衡值平滑收敛（10%/年调整速度）。

#### 1b. 死亡率（内生）

```
deathRate = max(0.005,
    0.007                                  // 基础死亡率 7‰
  + age65plus × 0.005                      // 老龄化效应
  + cumulativeFatigue(t-1) × 0.001         // 过劳致死
  - max(0, -workHoursDeviation) × 0.001    // 减时健康红利
)
```

| 通道 | 方向 | 机制 |
|------|------|------|
| 老龄化 | ↑ | 65+占比越高，死亡率越高 |
| 过劳 | ↑ | 累积疲劳（长期效应）增加死亡率 |
| 减时 | ↓ | 减时→低压力→健康改善 |

#### 1c. 出生率（内生，双因子）

**因子 1：工时-生活平衡效应**

```
workLifeEffect = clamp(-0.3, 0.7, workHoursDeviation × 0.4)
```

- 加班→ workHoursDeviation > 0 → workLifeEffect > 0 → 出生率**下降**（挤压家庭时间）
- 减时→ workHoursDeviation < 0 → workLifeEffect < 0 → 出生率**上升**（增加家庭时间）
- 上限：加班最多压低 70%，减时最多提升 30%

**因子 2：经济压力效应（双通道）**

```
adaptiveTrend = 0.5 × max(0, prevGdpGrowthRate) + 0.5 × tfpGrowthRate

通道A（预期落空）: expectationStress = max(0, adaptiveTrend - prevGdpGrowthRate) × 2
通道B（经济衰退）: recessionStress = max(0, -prevGdpGrowthRate) × 5
economicStressFactor = min(0.5, max(expectationStress, recessionStress))
```

| 通道 | 触发条件 | 系数 | 场景 |
|------|---------|------|------|
| 预期落空 | GDP 增长 < 自适应趋势 | ×2（温和） | 政策过渡期增速放缓 |
| 经济衰退 | GDP 绝对负增长 | ×5（强烈） | 真正的经济危机 |

自适应趋势 = 50% 实际增长 + 50% TFP 趋势。避免人口老龄化导致的增速自然放缓被误判为危机。

**出生率最终计算**

```
baseBirthRate = 0.00667   // 校准：零加班零压力下的理论值
                           // 6.67‰ × (1 - 0.04) = 6.4‰（匹配中国2025实际）
birthRate = max(0.002, baseBirthRate × (1 - workLifeEffect) × (1 - economicStressFactor))
```

#### 1d. 人口更新

```
naturalGrowthRate = birthRate - deathRate
population(t) = population(t-1) × (1 + naturalGrowthRate + netMigrationRate)
birthPopulation = population × birthRate
```

#### 1e. 劳动参与率

```
participationBonus = max(0, -workHoursDeviation) × 0.1
adjustedParticipation = min(0.75, LPR × (1 + participationBonus) × (age15_64 / 0.682))
laborForce = population × adjustedParticipation
```

- 减时→工时灵活→家长/老人/学生可参与→参与率↑
- 老龄化→劳动年龄人口占比↓→参与率↓

---

### 步骤 2：资本存量

```
K(t) = max(K₀ × 0.1, K(t-1) × (1 - δ) + I(t-1))
```

资本 = 上期资本 × (1 - 折旧率) + 上期投资。下限为初始值的 10%（防止极端情况资本归零）。

---

### 步骤 3：技术水平（TFP）

```
overworkTfpPenalty = cumulativeFatigue(t-1) × 0.05
leisureTfpBonus = max(0, -workHoursDeviation) × 0.15
adjustedTfpGrowth = g_A × max(0, 1 - overworkTfpPenalty + leisureTfpBonus)
A(t) = A(t-1) × (1 + adjustedTfpGrowth)
```

| 通道 | 方向 | 机制 |
|------|------|------|
| 累积疲劳 | 减缓 TFP | 长期过劳→R&D 时间减少→创新损失（有记忆效应） |
| 减时红利 | 加速 TFP | 更多认知余量/教育时间→创新加速 |

系数说明：累积疲劳使用 0.05（而非单期疲劳的 0.5），因为累积疲劳 ≈ 单期疲劳 / 恢复率(0.1)，保持稳态等效。

---

### 步骤 4：疲劳效应

#### 单期疲劳（二次方模型）

```
totalHoursPerWeek = max(10, h₀ + Δh)
excessHours = max(0, totalHoursPerWeek - h₀)
fatigueFactor = β × (excessHours / h₀)²
```

| 加班时长 | excessHours | fatigueFactor | 说明 |
|---------|-------------|---------------|------|
| 0h | 0 | 0 | 无疲劳 |
| 7h | 7 | 0.015 | 效率损失 1.5% |
| 20h | 20 | 0.125 | 效率损失 12.5% |
| 40h | 40 | 0.5 | 效率损失 50% |

#### 对称效率因子

```
若 excessHours > 0（加班）:
  efficiencyFactor = max(0.3, 1 - fatigueFactor)

若 excessHours = 0（减时）:
  reducedHours = h₀ - totalHoursPerWeek
  concentrationBonus = (reducedHours / h₀) × 0.2
  efficiencyFactor = min(1.2, 1 + concentrationBonus)
```

- 加班→疲劳→每小时效率下降（下限 30%）
- 减时→专注度提升→每小时效率上升（上限 120%）

---

### 步骤 5：累积疲劳与劳动力留存

```
cumulativeFatigue(t) = cumulativeFatigue(t-1) × 0.9 + fatigueFactor
attrition = 0.001 + γ × cumulativeFatigue
laborRetention = max(0.7, 1 - attrition)
```

- 累积疲劳：90% 保留上期 + 当期新增（恢复率 10%/年）
- 稳态：cumulativeFatigue* = fatigueFactor / 0.1
- 高累积疲劳→劳动力流失加速→留存率下降（下限 70%）

---

### 步骤 6：就业（三因子 + 惯性）

#### 6a. 结构性失业（加班替代效应）

```
extraEffectiveHours = Δh × efficiencyFactor × r
avgEffectiveHours = h₀ + extraEffectiveHours
displacementFraction = extraEffectiveHours / avgEffectiveHours
structuralUnemployment = displacementFraction × 0.36
```

加班→每人产出更多→企业需要更少人→失业↑。
减时→每人产出更少→企业需要更多人→失业↓（工作分享）。

#### 6b. 周期性失业（奥肯定律）

```
cyclicalUnemployment = -0.4 × (prevGdpGrowthRate - tfpGrowthRate)
```

GDP 增长 > 趋势 → 企业扩招 → 失业↓。反之↑。

#### 6c. 目标失业率与惯性调整

```
targetU = 0.03 + structuralU + cyclicalU
u(t) = clamp(0.02, 0.25,
    u(t-1) + 0.3 × (targetU - u(t-1)))
employment = laborForce × (1 - u) × laborRetention
```

- 自然失业率 3%（摩擦性）
- 劳动力市场惯性：每期向目标调整 30%
- 最终就业 = 劳动力 × (1 - 失业率) × 留存率

---

### 步骤 7：有效劳动投入

```
normalAnnualHours = h₀ × 52
overtimeAnnualHours = totalHoursPerWeek × 52

avgAnnualHoursPerWorker =
    (1 - r) × normalAnnualHours                          // 正常工时工人
  + r × overtimeAnnualHours × efficiencyFactor            // 加班/减时工人（含效率调整）

effectiveLabor = employment × avgAnnualHoursPerWorker × A(t)
```

有效劳动 = 就业人数 × 人均有效年工时 × 技术水平。

---

### 步骤 8：通胀（Phillips 曲线 + 惯性预期）

```
rawInflation = (1 - 0.6) × π₀ + 0.6 × π(t-1) + φ × (0.03 - u)
inflationRate = clamp(-0.05, 0.15, rawInflation)
priceLevel(t) = priceLevel(t-1) × (1 + inflationRate)
```

- 失业 < 自然率 → 劳动力市场紧张 → 通胀↑
- 失业 > 自然率 → 劳动力市场宽松 → 通胀↓
- 60% 惯性权重（通胀预期黏性）

---

### 步骤 9a：消费倾向预计算（需求信号）

消费倾向在 GDP 计算**之前**确定，作为需求侧信号。

```
adjustedConsumptionPropensity = clamp(0.4, 0.75,
    c₀                                               // 基础 58%
  + recessionEffect                                   // 衰退→预防性储蓄
  + employmentDistributionEffect                      // 就业分配效应
  + inflationUncertaintyEffect                        // 通胀不确定性
  + demographicConsumptionEffect                      // 人口结构效应
)
```

#### 5 个调节通道

| # | 通道 | 公式 | 机制 |
|---|------|------|------|
| 1 | 衰退效应 | `-0.3 × max(0, -prevGdpGrowth)` | GDP 负增长→预防性储蓄↑→消费↓ |
| 2 | 就业分配效应 | `-0.5 × (u - u*)` | 低失业→更多人有收入→边际消费倾向↑ |
| 3 | 通胀不确定性 | `-0.5 × max(0, π - π₀)` | 高通胀→不确定性↑→消费↓ |
| 4 | 出生率效应 | `20 × (birthRate - 0.0064)` | 高出生率→育儿刚需→消费↑ |
| 5 | 老龄化效应 | `0.15 × (age65+ - 0.153)` | 高老龄→医疗养老刚需→消费↑ |

通道 2 的关键设计：**对称**（去掉 `max(0,...)`），低失业率也能正向提升消费。凯恩斯原理：收入分配到更多人时，边际消费倾向更高。

---

### 步骤 9b：潜在 GDP（供给侧）

```
potentialGdp = TFP_base × K^α × L^(1-α)
```

Cobb-Douglas 生产函数。TFP_base 在初始化时校准，使 2025 年条件下恰好匹配实际 GDP。

---

### 步骤 9c：产能利用率（需求侧反馈 — 三驾马车）

```
capacityUtilization = clamp(0.85, 1.05,
    1.0
  + 0.3  × consumptionDemand        // 消费拉动
  + 0.3  × investmentDemand         // 投资拉动
  + 0.15 × exportGrowthSignal       // 出口拉动
)
```

三个需求信号（均无循环依赖）：

| 信号 | 公式 | 说明 |
|------|------|------|
| 消费需求 | `adjustedPropensity - c₀` | 消费倾向偏离基准（当期可观测） |
| 投资需求 | `prev(I/Y) - 0.37` | 上期投资率偏离基准（滞后一期） |
| 出口需求 | `calcExportGrowth(...)` | 出口增速（基于上期数据计算） |

**范围**：[0.85, 1.05]。最大产出缺口 15%（严重需求不足），最大过热 5%。

**经济含义**：
- 德国减时→低失业→消费强→CU ≈ 100.5%→GDP 比纯供给侧多 0.5%
- 极端加班→高失业→消费弱→CU ≈ 98.9%→GDP 比潜在水平低 1.1%（产能过剩）

---

### 步骤 9d：实际 GDP

```
GDP = capacityUtilization × potentialGdp
```

实际 GDP 由供给（生产函数）和需求（产能利用率）共同决定。

---

### 步骤 10：政府部门

```
govRevenue = τ × GDP
govConsumption = (1 - g_inv) × govRevenue     // 政府消费（65%）
govInvestment = g_inv × govRevenue              // 政府投资（35%）
```

---

### 步骤 11：收入分配

```
totalLaborIncome = (1 - α) × GDP       // 劳动收入 = 65% × GDP
capitalIncome = α × GDP                 // 资本收入 = 35% × GDP
wage = totalLaborIncome / employment    // 人均工资（万元/年）

disposableLaborIncome = (1 - τ) × totalLaborIncome
disposableCapitalIncome = (1 - τ) × capitalIncome
```

严格遵循 Cobb-Douglas 要素份额定理。工资为税前。

---

### 步骤 12：消费与储蓄

```
laborConsumption = adjustedPropensity × disposableLaborIncome
laborSavings = disposableLaborIncome - laborConsumption

// 通胀→资本成本↑→再投资意愿↓
inflationInvestmentDrag = max(0.5, 1 - 2 × max(0, π - π₀))
adjustedReinvestRate = s_k × inflationInvestmentDrag
capitalReinvestment = adjustedReinvestRate × disposableCapitalIncome
capitalConsumption = disposableCapitalIncome - capitalReinvestment

consumption = laborConsumption + capitalConsumption + govConsumption
```

---

### 步骤 13：外贸

#### 出口

```
exportGrowth = baseGrowth + capacityEffect + competitivenessEffect
             + inflationDrag + tradeBalanceDrag

EX(t) = min(EX(t-1) × (1 + exportGrowth), 0.35 × GDP)
```

| 分项 | 公式 | 说明 |
|------|------|------|
| 基础增长 | `0.02` | 世界贸易增速中枢 |
| 产能效应 | `λ₂ × prevGdpGrowthRate` | GDP 增长→出口供给能力 |
| 竞争力效应 | `λ₁ × ln(A)` | 技术进步→产品竞争力 |
| 通胀拖累 | `-0.5 × max(0, π - 0.02)` | 国内通胀高于世界→出口变贵 |
| 贸易平衡 | `-2.0 × max(0, NX/Y - 0.03)` | 顺差过大→汇率升值→出口受限 |

出口上限 = GDP 的 35%（中国历史峰值）。

#### 进口

```
importPropensity = clamp(0, 0.8,
    m₀ + θ × prevGdpGrowthRate + 0.5 × max(0, NX/Y - 0.03))
IM = importPropensity × consumption
```

| 分项 | 系数 | 说明 |
|------|------|------|
| 基础倾向 | 0.23 | 校准匹配 2025 实际进口 |
| 收入效应 | θ=0.1 | GDP 增长→消费升级→进口↑ |
| 贸易再平衡 | 0.5 | 顺差过大→汇率升值→进口变便宜 |

#### 贸易平衡自纠正机制

出口端系数 -2.0 + 进口端系数 +0.5 双向纠正，使 NX/GDP 收敛至 3-4%：

```
稳态推导（exportGrowth = importGrowth = g 时）：
NX*/GDP = 0.03 + (baseGrowth + techBonus - g) / 2.0 ≈ 3.5-4%
```

---

### 步骤 14：投资（S - I = NX 恒等式）

```
privateSavings = laborSavings + capitalReinvestment
nationalSavings = privateSavings + govInvestment
investment = nationalSavings - netExport
```

投资允许负值（资本净流出），但资本存量有下限保护。

#### GDP 恒等式证明

```
C + I + NX
= (laborC + capitalC + govC) + (privateSavings + govInvestment - NX) + NX
= (laborC + capitalC + govC) + (privateSavings + govInvestment)
= disposableLaborIncome + disposableCapitalIncome + govRevenue
= (1-τ)(1-α)Y + (1-τ)αY + τY
= (1-τ)Y + τY = Y  ✓
```

---

### 步骤 15：输出

所有计算结果写入 `PeriodResult`，作为下一期的 `prevResult` 输入，形成完整反馈循环。

---

## 三、反馈链路全景图

### 3.1 投资链路（闭环 ✓）

```
投资(t-1) → 资本K(t) → 潜在GDP → 实际GDP → 收入 → 储蓄 → 投资(t)
     ↑                                              ↓
     └──────────── 通胀→再投资率↓ ←──── 通胀 ←─── 失业
```

### 3.2 消费链路（闭环 ✓，含需求侧反馈）

```
消费倾向 → 产能利用率 → 实际GDP → 收入 → 消费金额
   ↑                                        ↓
   ├─ 就业分配效应（失业↓→消费倾向↑）         ├→ 进口 → 净出口 → 投资
   ├─ 人口结构（出生率↑/老龄化→消费倾向↑）    └→ 储蓄 → 投资
   ├─ 衰退效应（GDP负增长→消费倾向↓）
   └─ 通胀不确定性（高通胀→消费倾向↓）
```

关键：消费倾向在 GDP **之前**计算，通过产能利用率**正向拉动 GDP**。不再是纯粹的 GDP 分配去向。

### 3.3 出口链路（闭环 ✓，含自纠正）

```
出口增速 → 产能利用率 → 实际GDP → GDP增长 → 产能效应 → 出口增速
                                    ↓
                              技术水平 → 竞争力效应 → 出口增速
                                    ↓
                              通胀 → 通胀拖累 → 出口增速
                                    ↓
                          NX/GDP → 贸易平衡拖累 → 出口增速（自纠正）
                                         ↓
                                   进口倾向↑（双向纠正）
```

### 3.4 人口-经济反馈环

```
工时政策 → 出生率 → 人口 → 劳动力 → 就业 → GDP
   ↓           ↑         ↓                 ↓
   ├→ 工时-生活平衡      ├→ 消费需求（人口驱动）   GDP增长
   └→ 经济压力 ←─────────────────────────────────┘
```

### 3.5 加班-全链路反馈图

```
┌─────────────┐
│  工时政策     │ ←── 用户设定（5年平滑过渡）
│ (Δh, r)     │
└──────┬──────┘
       │
       ├──→ 疲劳 → 效率↓ → 有效劳动↓ → 潜在GDP↓
       ├──→ 累积疲劳 → TFP增长↓ → 长期GDP↓
       ├──→ 累积疲劳 → 劳动力流失 → 就业↓ → GDP↓
       ├──→ 替代效应 → 结构性失业 → 就业↓
       │                              ↓
       │                         失业率变化
       │                         ↙        ↘
       │                   菲利普斯曲线    就业分配效应
       │                        ↓              ↓
       │                      通胀         消费倾向
       │                    ↙    ↘            ↓
       │              出口拖累   投资拖累   产能利用率
       │                 ↓         ↓          ↓
       │              净出口     投资量     实际GDP
       │                 └────┬────┘         ↓
       │                      ↓           收入分配
       │                   投资(t)    →  下期资本(t+1)
       │
       ├──→ 工时-生活平衡 → 出生率 → 人口 → 长期劳动供给
       ├──→ 减时健康红利 → 死亡率↓ → 人口
       └──→ 参与率调整 → 劳动力
```

---

## 四、TFP 校准

```
tfpBase = targetGDP / (K^α × L^(1-α))
```

校准使用 2025 年最后一期历史数据：
- 目标 GDP = 1,416,537 亿
- K = GDP × 3.5（资本产出比）
- L = employment × effectiveWeeklyHours × 52 × techLevel
- effectiveWeeklyHours 使用中国基准加班参数（7h/57%）计算

校准保证：在中国基准条件下，模拟第一期精确还原 2025 年 GDP。

---

## 五、历史→模拟过渡机制

### 5.1 派生值统一

历史期（2000-2025）的消费、储蓄、投资等派生值使用与模拟期**完全相同的公式**计算，消除过渡点跳变。

锚定变量（直接使用实际统计数据）：人口、就业、失业率、GDP、GDP增长率、出口、进口。

### 5.2 参数平滑过渡

用户设定的工时参数在 5 年内从中国基准线性过渡到目标值：

```
blend = min(1, yearsIntoSimulation / 5)
effectiveΔh = 7 + blend × (userΔh - 7)
effectiveR = 0.57 + blend × (userR - 0.57)
```

- 第 1 年：20% 用户 + 80% 基准
- 第 5 年：100% 用户

避免参数突变导致 GDP/就业剧烈跳变。

---

## 六、参数校准依据

| 参数 | 校准方法 |
|------|---------|
| baseBirthRate = 0.00667 | 使中国基准加班下恰好产出 6.4‰ |
| baseImportPropensity = 0.23 | 匹配 2025 实际进口/模型消费 ≈ 0.234 |
| fatigueCoeff = 0.5 | 40h 加班时效率降至 50%（有效工时 = 正常工时） |
| displacementSensitivity = 0.36 | 使中国基准（7h/57%）的结构性失业 ≈ 3.2% |
| phillipsCoeff = 0.3 | 使 u=5% 时稳态通胀 ≈ 0.5% |
| tradeBalanceDrag = 2.0 | 稳态 NX/GDP 收敛至 3-4% |
| capacityUtilization coeffs | 消费/投资偏离 1pp → GDP 调整 0.3% |
| laborParticipation = 0.56 | 使 laborForce × (1-u) ≈ 实际就业 75,000 万 |

---

## 七、单位体系

| 量 | 单位 |
|------|------|
| 人口、就业、劳动力 | 万人 |
| GDP、收入、消费、投资、贸易 | 亿元（人民币） |
| 资本存量 | 亿元 |
| 工资 | 万元/人/年 |
| 工时 | 小时/周 |
| 劳动生产率 | 元/小时 |
| 比率（失业率、通胀率、增长率等） | 小数（如 0.05 = 5%） |
