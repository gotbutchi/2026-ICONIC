# M00 - Insight & Component Mapping Blueprint
**Priority:** Highest | **Blocker for:** M01, M03

## Context
To strictly satisfy the challenge requirements for **Stage 2 (Advanced SQL Intelligence)** and **Stage 3.4 (Insight Delivery)**, the React Dashboard must directly visualize the answers to the core SQL prompts and explicitly present the commercial value. 

This blueprint maps the dbt Data Marts (exported as static CSVs) to their respective React Recharts components and dictates the hardcoded Business Insights that must be displayed alongside them.

---

## The Mapping Table

### 1. The "Comeback King" (Challenge Stage 2.1)
- **Objective:** Identify the store with the highest cumulative sales growth following a negative growth week.
- **Data Source:** `comeback_king_mock_data.csv` (Exported from `mart_comeback_king`)
- **UI Component:** `ComebackKingTable.jsx` (A sleek, Tailwind-styled Data Grid)
- **Business Insight Text (to inject via `<InsightCard>`):** 
  > *"**The Spring Rebound Phenomenon:** Store 14 is the ultimate Comeback King, achieving a network-high +4.37M VND recovery immediately following a negative growth week in early Feb 2019. The clustering of top comebacks on Feb 8, 2019, indicates a highly successful post-clearance or Spring Collection launch network-wide."*

### 2. Statistical Anomaly Detection (Challenge Stage 2.2)
- **Objective:** Flag "Flash Sale" weeks (> 3 standard deviations above the 52-week rolling average).
- **Data Source:** `anomaly_detection_mock_data.csv` (Exported from `mart_anomaly_detection`)
- **UI Component:** `AnomalyScatter.jsx` (Recharts `<ScatterChart>`. X-Axis: 52w Baseline, Y-Axis: Z-Score. Include reference lines at Y=3 and Y=-3).
- **Business Insight Text (to inject via `<InsightCard>`):** 
  > *"**Black Friday Super-Cluster:** 80% of top Flash Sale events (Z-score > 3) occurred synchronously on Nov 22, 2019. While Flagship stores generated the highest absolute revenue, Tier-2 stores (like Store 29) exhibited the highest promotional elasticity (Z > +5.7), signaling where inventory buffers should be prioritized."*

  > ⚠️ **SUPERSEDED by [M05](M05-statistical-correction.md).** Two errors. (1) The baseline window
  > included the week being scored, suppressing every z-score — Store 29's true figure is **12.88σ**,
  > not 5.7. (2) "80% of the top 10" ranked by *peak intensity* and reported it as *breadth*. Black
  > Friday week is indeed the most intense (all top-10 spikes), but the **pre-Christmas week is the
  > most broad — 40 of 45 stores in 2019, repeating with 38 in 2020**, and that recurrence is the
  > plannable pattern. Corrected text is live in `App.jsx`.

### 3. Counter-Cyclical Trends (Challenge Stage 2.3)
- **Objective:** Identify stores where fuel price rose >5% while sales also increased.
- **Data Source:** `counter_cyclical_mock_data.csv` (Exported from `mart_counter_cyclical`)
- **UI Component:** `FuelElasticityMatrix.jsx` (Recharts `<ScatterChart>`. X-Axis: Fuel Growth %, Y-Axis: Sales Growth %. Color-coded by Trend Type).
- **Business Insight Text (to inject via `<InsightCard>`):** 
  > *"**The 10% Vulnerability Threshold:** When fuel inflation exceeds +10%, network resilience collapses system-wide. However, 'Iron Wall' locations like Store 33 and 42 remain highly inelastic, successfully maintaining positive sales growth (+9.3%) even during severe fuel price shocks (+6.5%)."*

  > ⚠️ **SUPERSEDED by [M05](M05-statistical-correction.md).** Two errors. (1) The +9.3% averaged
  > only the weeks where sales *rose* — conditioning on the outcome. Across **all** their fuel-spike
  > weeks Store 33 is **+1.35%** (15 weeks) and Store 42 **+0.56%** (14 weeks); a ~7x overstatement.
  > Store 38 is the honest leader at +2.18%. (2) "Collapses system-wide" rests on **3 store-weeks,
  > one week (2021-10-08), 3 stores** — a hypothesis to monitor, not a threshold to fund. The
  > network-level figure that *does* hold: **+0.69%** across all 111 fuel-spike weeks.

### 4. Macro-Economic Resilience (Challenge Stage 3 Bonus)
- **Objective:** Evaluate stores that maintain market share during local unemployment spikes.
- **Data Source:** `unemployment_mock_data.csv` (Exported from `mart_unemployment_sales_impact`)
- **UI Component:** `UnemploymentScatter.jsx` (Recharts `<ScatterChart>`. X-Axis: Unemployment Rate, Y-Axis: Resilience Index %. Reference line at Y=100%).
- **Business Insight Text (to inject via `<InsightCard>`):** 
  > *"**The Lipstick Effect:** Store 35 emerged as the Absolute Champion in downturns. Across 21 distinct weeks of high unemployment, it maintained a Resilience Index of 130% vs its normal baseline, successfully capturing down-trading consumers during economic hardship."*

  > ⚠️ **SUPERSEDED by [M05](M05-statistical-correction.md).** The figure was 126%, not 130% — and
  > more importantly the baseline was the store's **all-period average**, which looks ahead and does
  > not detrend, so a store that merely grew over time scores above 100% regardless of unemployment.
  > Against a **trailing 52-week baseline** Store 35 scores **99.4%**: no downturn advantage at all.
  > The genuine performers are **Store 7 (114.9%, 27 weeks)** and **Store 16 (107.7%, 48 weeks —
  > largest sample)**. `UnemploymentScatter.jsx` now exposes the baseline as a dropdown so the
  > difference is visible rather than asserted.

---

## Architecture Directive for M03 (Component Engineering)
When building the UI layout in `App.jsx`, every chart component MUST be paired with an `<InsightCard>` element. 
- **Rule:** Do not just render the chart. Render the chart on the left (or top) and the hardcoded Business Insight text on the right (or bottom) using Tailwind's Flexbox/Grid (`grid-cols-1 lg:grid-cols-3`). This ensures the dashboard explicitly delivers "commercial value" as required by Stage 3.4.
