# The AI Twist: Methodology & Strategy Detailed Report

This document details the precise methodology, prompting strategies, and debugging hurdles encountered while building "The AI Twist" React dashboard. 

## Modular Execution Strategy
To manage this "Zero-to-One" frontend build efficiently without disrupting the core data engineering repository, the workflow was strictly divided into independent modules (documented in `/docs/plan/The AI Twist/`). To ensure rigorous project tracking, each phase generates explicit task lists and walkthroughs stored in `/docs/plan/The AI Twist/artifacts/` (e.g., `M00-task.md`, `M00-walkthrough.md`):
1. **M00 & M01 (Insight Mapping & Data Provisioning):** Mapped SQL metrics to UI components, then exported the 4 core datasets as static CSVs using an automated Python script (`scripts/export_data.py`) to bypass risky live backend API configurations.
2. **M02 (Frontend Scaffolding):** Initialized the Vite/React environment, configured Tailwind CSS v4, and resolved local NPM permission issues (`EACCES`) via local cache overrides.
3. **M03 (Component Engineering):** Directed the LLM to map the CSVs to Recharts UI components, enforcing a strict "High-Contrast Editorial" design system (Stark white, Emerald Green, Coral Red).
4. **M04 (Deployment):** Generated a static production bundle for Vercel/Netlify hosting.

## The Prompting Strategy (Zero-to-One)
To build the React application securely without granting the LLM direct access to the corporate BigQuery database, I adopted a **"Schema-Driven, Disconnected"** prompting methodology:

1. **Context Injection:** I uploaded the compiled dbt SQL model (`mart_unemployment_sales_impact.sql`) to the LLM. This provided the AI with the exact semantic layer, column names, and business logic without exposing sensitive raw data.
2. **Mock Data Provision:** Instead of asking the AI to write complex API fetching logic to a live database, I executed the query locally and exported a highly aggregated JSON array (Top 20 rows). I provided this static JSON to the LLM.
3. **The Mega-Prompt:** I structured the initial prompt using persona assignment: *"Act as a Senior Frontend React Developer. I have a static JSON array representing macroeconomic retail data. Write a functional React component using Tailwind CSS for layout and Recharts for data visualization. I need a Data Grid for 'The Comeback King' and a Scatter Plot mapping `unemployment_rate` (X-axis) against `weekly_resilience_index` (Y-axis)."*

## Hurdles & Debugging the AI's Output
While the AI successfully generated the boilerplate React code and CSS classes, it struggled with data modeling biases and frontend data-binding quirks. I encountered and debugged three main hurdles:

1. **Hurdle 1 - AI Data Selection Bias (The "Top N" Trap):** When initially prompted to generate SQL for the mock data extraction, the AI Agent heavily suffered from Selection Bias. For example, it generated `ORDER BY resilience_rank ASC LIMIT 30` and `WHERE anomaly_type = 'Positive Anomaly (Spike)'`. 
* *Debugging:* I realized that exporting only the "top positive" outliers would completely destroy the visual baselines on the Scatter Plots and eliminate the "Critical Drops" and "Fail Kings" insights established in Stage 2. I intervened and manually corrected the AI's SQL queries (documented in `M01-data-provisioning.md`) by implementing `UNION ALL` to capture both extremes (Comeback vs. Fail Kings) and using `ABS(z_score) > 3` to capture two-sided anomalies. This human-in-the-loop intervention ensured the React UI accurately reflected the full statistical reality.

2. **Hurdle 2 - Recharts Data Shape Requirements:** The LLM initially passed the raw JSON directly into the Recharts `<Scatter/>` component. However, the chart rendered completely blank.
* *Debugging:* I copied the exact React console warning and the Recharts documentation snippet into the prompt. The AI realized it needed to map the JSON array into the specific `{ x, y, z }` object format required by Recharts. It then successfully generated the data transformation function.

3. **Hurdle 3 - UI/UX Responsiveness:** The AI hardcoded the chart dimensions (e.g., `width={800} height={400}`), which caused the dashboard to break on smaller laptop screens.
* *Debugging:* I prompted the AI to refactor the chart wrapper. I instructed it to use Recharts' `<ResponsiveContainer>` component and apply Tailwind's flexible grid classes (`grid-cols-1 md:grid-cols-2`), instantly transforming the rigid layout into a modern, responsive dashboard.

4. **Hurdle 4 - CSV Async Import Bug in Vite:** The AI initially attempted to load the static CSVs via an asynchronous `fetch()` API call, which caused rendering delays and console warnings.
* *Debugging:* During code review, I intervened and explicitly instructed the AI to use Vite's `?raw` string import suffix (e.g., `import rawData from '../../data/file.csv?raw'`). This allowed PapaParse to synchronously parse the static text immediately on mount, vastly improving performance and avoiding async React state bugs.

5. **Hurdle 5 - Formatting Artifacts in Recharts (The "850%" Bug):** On the Unemployment Scatter Plot, the X-Axis unexpectedly displayed values like `850%` instead of `8.5%`. The AI incorrectly assumed the raw CSV data was stored as decimals (e.g., `0.085`) and mathematically multiplied the value by 100 before passing it to Recharts.
* *Debugging:* I reviewed the raw data extract and confirmed the values were already stored as whole numbers (`8.5`). I prompted the AI to remove the `* 100` data transformation and directly append the `%` symbol via the `<XAxis tickFormatter/>` prop. This highlights the risk of LLMs hallucinating data types without consulting the underlying raw data schema.

## Cross-Validation via Looker Studio (Data Integrity)
To ensure the LLM-generated React dashboard was not hallucinating numbers or misrepresenting trends, I strictly validated its visual outputs against my established **Looker Studio Dashboard**. Since I had already built the Looker dashboard to analyze the core metrics for Stage 2, it served as my absolute "source of truth". By cross-referencing the React charts against the Looker Studio scorecards, I could confidently verify that the AI's data transformations were statistically accurate and that the injected Business Insights perfectly matched my manual analysis.
