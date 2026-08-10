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

### 3. Counter-Cyclical Trends (Challenge Stage 2.3)
- **Objective:** Identify stores where fuel price rose >5% while sales also increased.
- **Data Source:** `counter_cyclical_mock_data.csv` (Exported from `mart_counter_cyclical`)
- **UI Component:** `FuelElasticityMatrix.jsx` (Recharts `<ScatterChart>`. X-Axis: Fuel Growth %, Y-Axis: Sales Growth %. Color-coded by Trend Type).
- **Business Insight Text (to inject via `<InsightCard>`):** 
  > *"**The 10% Vulnerability Threshold:** When fuel inflation exceeds +10%, network resilience collapses system-wide. However, 'Iron Wall' locations like Store 33 and 42 remain highly inelastic, successfully maintaining positive sales growth (+9.3%) even during severe fuel price shocks (+6.5%)."*

### 4. Macro-Economic Resilience (Challenge Stage 3 Bonus)
- **Objective:** Evaluate stores that maintain market share during local unemployment spikes.
- **Data Source:** `unemployment_mock_data.csv` (Exported from `mart_unemployment_sales_impact`)
- **UI Component:** `UnemploymentScatter.jsx` (Recharts `<ScatterChart>`. X-Axis: Unemployment Rate, Y-Axis: Resilience Index %. Reference line at Y=100%).
- **Business Insight Text (to inject via `<InsightCard>`):** 
  > *"**The Lipstick Effect:** Store 35 emerged as the Absolute Champion in downturns. Across 21 distinct weeks of high unemployment, it maintained a Resilience Index of 130% vs its normal baseline, successfully capturing down-trading consumers during economic hardship."*

---

## Architecture Directive for M03 (Component Engineering)
When building the UI layout in `App.jsx`, every chart component MUST be paired with an `<InsightCard>` element. 
- **Rule:** Do not just render the chart. Render the chart on the left (or top) and the hardcoded Business Insight text on the right (or bottom) using Tailwind's Flexbox/Grid (`grid-cols-1 lg:grid-cols-3`). This ensures the dashboard explicitly delivers "commercial value" as required by Stage 3.4.
