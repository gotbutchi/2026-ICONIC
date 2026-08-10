# M03 — Component Engineering

**Priority:** High · **Blocker for:** M04

## Context
This is where the "Vibe Coding" happens. We will translate the static CSV data into an interactive, highly aesthetic dashboard using Recharts and Tailwind CSS. The design must adhere strictly to the "Editorial / Minimalist" concept (Stark White, Pitch Black, Emerald Green, Coral Red).

## Scope
**In-Scope:**
- Parsing CSV data via `papaparse`.
- Reusable UI wrapper (`<InsightCard>`).
- 4x Data Visualization components using `Recharts`.
- 1x Mockup Component (`<AgenticChatbot>`) to simulate an AI Data Agent interaction.
- Assembling `App.jsx` layout.

**Out-of-Scope:** Complex State Management (Redux/Zustand), Backend API calls.

## Execution Steps

### 1. Build `App.jsx` Layout & `<InsightCard>`
- Create a reusable `<InsightCard>` component that accepts `title` and `description` props.
- Implement a CSS Grid layout in `App.jsx` (e.g., `grid-cols-1 lg:grid-cols-3` or a Flex column layout).
- **CRUCIAL RULE:** Every chart MUST be rendered side-by-side (or cleanly stacked on mobile) with its respective `<InsightCard>`. Use the exact Business Insight text defined in `M00-insight-mapping.md`.

### 1.5. Agentic Chatbot Mockup (UI/UX Only)
- Create `AgenticChatbot.jsx` as a floating action button.
- Implement simulated AI typing delays and a pre-defined Q&A flow ("Which store is the Comeback King?") to demonstrate how an internal Slack Agent would look on the web, without exposing real API keys.

### 2. Build `ComebackKingTable.jsx`
- Parse `comeback_king_mock_data.csv`.
- Render a minimalist HTML `<table>` using Tailwind classes (`border-slate-200`, `py-4`, `text-sm`).
- **Color Logic:** If `label === 'Comeback King'`, color the growth metric Emerald Green (`text-emerald-600`). If `label === 'Fail King'`, color it Coral Red (`text-rose-500`).

### 3. Build `AnomalyScatter.jsx`
- Parse `anomaly_detection_mock_data.csv`.
- Recharts Setup: `<ScatterChart>` wrapped in `<ResponsiveContainer width="100%" height={400}>`.
- X-Axis: `rolling_52w_avg` | Y-Axis: `z_score`.
- **Color Logic:** `Positive Anomaly (Spike)` = Emerald Green. `Negative Anomaly (Drop)` = Coral Red.
- Add reference lines at Y = 3 and Y = -3.

### 4. Build `FuelElasticityMatrix.jsx`
- Parse `counter_cyclical_mock_data.csv`.
- Recharts Setup: `<ScatterChart>` inside `<ResponsiveContainer>`.
- X-Axis: `fuel_growth_pct` | Y-Axis: `sales_growth_pct`.
- **Color Logic:** `Counter-Cyclical (Resilient)` = Emerald Green. `Pro-Cyclical (Vulnerable)` = Coral Red.

### 5. Build `UnemploymentScatter.jsx`
- Parse `unemployment_mock_data.csv`.
- Recharts Setup: `<ScatterChart>` inside `<ResponsiveContainer>`.
- X-Axis: `unemployment_rate` | Y-Axis: `weekly_resilience_index`.
- Include a reference line at Y = 1 (or 100%).

### Important Technical Note for PapaParse
- Ensure `dynamicTyping: true` is set in the PapaParse config so numeric columns (like `z_score`, `sales_growth_pct`) are parsed as Javascript `Numbers`, not Strings. This prevents Recharts from rendering blank charts.

## Implementation Checklist
- [ ] Create reusable `<InsightCard>` component.
- [ ] Create 4 Data Viz components.
- [ ] Assemble `App.jsx` layout pairing Charts with InsightCards.
- [ ] Verify `Papa.parse` correctly casts numeric types.

## Acceptance Criteria
- Dashboard renders flawlessly on both mobile and desktop views.
- No Recharts blank screen errors (PapaParse types are correct).
- Colors strictly follow the Emerald/Coral thematic rule to highlight business polarities.
