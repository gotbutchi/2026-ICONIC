# M035 — Improvement Plan & UI Polish

**Priority:** High · **Blocker for:** M04

## Context
A critical data bias was discovered during the code review of the Python data pipeline: the `is_invalid_sales` flag was omitted when manually querying `fct_weekly_sales`, which could skew macro-metrics. Additionally, the dashboard was entirely missing the "Overall Performance" (Top-Down) perspective, plunging users straight into advanced anomalies without a baseline.

## Scope
**In-Scope:** 
1. Resolving the SQL Data Bias (`is_invalid_sales = FALSE`).
2. Splitting the Date Range filtering strategy (Hard filter for Scorecards to establish a precise anchor, Unbounded for Trend Charts).
3. Developing `<ExecutiveSummary>` and `<OverallPerformance>` components to form "Tier 1" of the dashboard.
**Out-of-Scope:** Modifying existing `mart_` tables or Advanced Insight components.

## Execution Steps

### 1. Data Provisioning Overhaul
- Modify `export_data.py` to extract `overall_kpis.csv`, `weekly_trend.csv`, and `top_10_stores.csv`.
- Inject `WHERE is_invalid_sales = FALSE` across all new direct `fct` queries.
- Apply `partition_date` filter exclusively to the KPI query to lock the Total Sales anchor at ~184.3M ₫.

### 2. Component Development
- **`ExecutiveSummary.jsx`**: Create a 2-column grid displaying the bullet points for "Executive Summary" and "Strategic Actions to Take" using Tailwind `bg-slate-50`.
- **`Scorecard.jsx`**: Implement a `formatCurrency` helper. Parse the single row of KPI data to display Total Sales, Active Stores, and Avg Weekly Sales.
- **`OverallPerformance.jsx`**: Wrap the `<Scorecard/>` together with a `<LineChart>` (Weekly Trend) and a `<BarChart>` (Top 10 Stores) into a single cohesive `<section>`.

### 3. Layout Integration
- Insert the new modules at the top of `App.jsx`, right below the Header, structurally dividing the dashboard into **"I. Overall Performance"** and **"II. Advanced Insights"**.

## Acceptance Criteria
- `Total Sales` correctly formats to `184.3M ₫`.
- The Line Chart has no dots (`dot={false}`) and displays the full unbounded historical trend.
- The UI retains its Minimalist Editorial aesthetic without visual clutter.

## Phase 2: UI Polish & Global Interactivity
Refine the React Dashboard's UX/UI based on Executive QA feedback. Fix alignment issues, improve chart readability, completely restructure the Volatility Tables (Comeback/Fail Kings) with Top 1/10 filters, and introduce a "Highlight Store" global interaction.

### 1. Layout & Alignment Fixes
Ensure the text container for Insights is aligned to the top. Change Flexbox classes from `justify-center` to `justify-start flex-col` so the Insight text aligns horizontally with the top of its corresponding chart/table.

### 2. Chart Readability Enhancements
Move ALL `ReferenceLine` labels to the extreme right or left edges. Add explicit X and Y axis labels to all Recharts to explain the metrics. Fix the `tickFormatter` on the X-Axis of `UnemploymentScatter` to display raw percentages correctly.

### 3. Volatility Tables Restructure
Replace the single table component with two distinct blocks (`ComebackBlock.jsx` and `FailBlock.jsx`). Render the "Comeback King" block on top and the "Fail King" block below it. Introduce a local state filter for each block: **"Show Top 1"** and **"Show Top 10"**. Format the `GROWTH (VND)` column to a clean Millions suffix (e.g., `+4.37M ₫`).

### 4. Storytelling Update
Split the Insight text passed to the newly split Comeback and Fail sections in `App.jsx` to explicitly highlight Store 14's dual nature.

### 5. Global Interactivity: The "Highlight" Context Filter
Add a global `<select>` dropdown in the Header for "Highlight Store". Pass the `selectedStoreId` state down to all Scatter charts. Update the `<Scatter>` components to render highlighted points with a prominent color, increased radius, and high opacity, while fading out unselected points (opacity 0.2).
