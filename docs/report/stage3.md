# Stage 3: Dashboard Asset & Insight Delivery - Detailed Report

**Goal:** Build a functional tool and extract commercial value.

## 1. The Build (Looker Studio)
*Create an interactive dashboard that allows a user to explore these trends.*

The Looker Studio dashboard is designed as a top-down **Executive Dashboard**, preventing information overload through a structured layout:

1. **1-Click Executive Scorecards:** The header elevates highly complex calculations into instant top-line metrics (e.g., "Net Sales Growth During Fuel Spikes: +0.69%"). This provides C-level executives with immediate, un-biased answers without requiring them to drill down.
2. **Section 1: Overall Performance:** General Scorecards (Total Sales, Active Stores) + Weekly Sales Trend (Line) + Top 10 Stores by Sales Volume (Bar).
3. **Section 2: Advanced Macro-Economic Insights:** A 2x2 Grid utilizing high-contrast visual paradigms:
    * **Visual Benchmarking:** Scatter Plots (Fuel Price Elasticity Matrix & Unemployment Sensitivity) map macro-variables against standardized metrics ($Z\text{-score}$, Resilience Index) to visually isolate "vulnerable" vs "resilient" clusters.
    * **Granular Actionability:** Data Bars and Heatmap Tables (Comeback Kings, High-Unemployment Champions) provide ranked, filterable targets for Operations teams to deploy localized interventions.

*(Link to Live Looker Studio Dashboard provided in the root README)*

---

## 2. The AI Twist
*Use Gen-AI to build this asset in a language you do not usually work in.*

To fulfill the "AI Twist" requirement, I utilized Generative AI to build a standalone, interactive web dashboard using **React.js, Tailwind CSS, and Recharts**. As a Data Analyst whose primary stack relies heavily on SQL and dbt, frontend web development is entirely outside my traditional scope.

The application was built as a Monorepo (`the-ai-twist/`) and deployed continuously via **Vercel**. 

*(Link to Live Vercel Dashboard provided in the root README)*

---

## 3. The Methodology
*Describe how you "prompted" your way to this build. What were the hurdles? How did you debug the AI's output?*

To manage this "Zero-to-One" frontend build efficiently without disrupting the core data engineering repository, the workflow was strictly divided into independent modules:
1. **Insight Mapping & Data Provisioning:** Mapped SQL metrics to UI components, then exported the 4 core datasets as static CSVs using an automated Python script (`scripts/export_data.py`) to bypass risky live backend API configurations.
2. **Frontend Scaffolding:** Initialized the Vite/React environment, configured Tailwind CSS v4, and resolved local NPM permission issues (`EACCES`) via local cache overrides.
3. **Component Engineering:** Directed the LLM to map the CSVs to Recharts UI components, enforcing a strict "High-Contrast Editorial" design system (Stark white, Emerald Green, Coral Red).
4. **Deployment:** Generated a static production bundle for Vercel hosting.

### The Prompting Strategy (Zero-to-One)
To build the React application securely without granting the LLM direct access to the corporate BigQuery database, I adopted a **"Schema-Driven, Disconnected"** prompting methodology:

1. **Context Injection:** I uploaded the compiled dbt SQL model (`mart_unemployment_sales_impact.sql`) to the LLM. This provided the AI with the exact semantic layer, column names, and business logic without exposing sensitive raw data.
2. **Mock Data Provision:** Instead of asking the AI to write complex API fetching logic to a live database, I executed the query locally and exported a highly aggregated JSON array (Top 20 rows). I provided this static JSON to the LLM.
3. **The Mega-Prompt:** I structured the initial prompt using persona assignment: *"Act as a Senior Frontend React Developer. I have a static JSON array representing macroeconomic retail data. Write a functional React component using Tailwind CSS for layout and Recharts for data visualization."*

### Hurdles & Debugging the AI's Output
While the AI successfully generated the boilerplate React code and CSS classes, it struggled with data modeling biases and frontend data-binding quirks. I encountered and debugged five main hurdles:

1. **Hurdle 1 - AI Data Selection Bias (The "Top N" Trap):** When initially prompted to generate SQL for the mock data extraction, the AI Agent heavily suffered from Selection Bias. For example, it generated `ORDER BY resilience_rank ASC LIMIT 30` and `WHERE anomaly_type = 'Positive Anomaly (Spike)'`. 
* *Debugging:* I realized that exporting only the "top positive" outliers would completely destroy the visual baselines on the Scatter Plots and eliminate the "Critical Drops" and "Fail Kings" insights established in Stage 2. I intervened and manually corrected the AI's SQL queries by implementing `UNION ALL` to capture both extremes and using `ABS(z_score) > 3` to capture two-sided anomalies.

2. **Hurdle 2 - Recharts Data Shape Requirements:** The LLM initially passed the raw JSON directly into the Recharts `<Scatter/>` component. However, the chart rendered completely blank.
* *Debugging:* I copied the exact React console warning and the Recharts documentation snippet into the prompt. The AI realized it needed to map the JSON array into the specific `{ x, y, z }` object format required by Recharts.

3. **Hurdle 3 - UI/UX Responsiveness:** The AI hardcoded the chart dimensions (e.g., `width={800} height={400}`), which caused the dashboard to break on smaller laptop screens.
* *Debugging:* I prompted the AI to refactor the chart wrapper. I instructed it to use Recharts' `<ResponsiveContainer>` component and apply Tailwind's flexible grid classes (`grid-cols-1 md:grid-cols-2`), instantly transforming the rigid layout into a modern, responsive dashboard.

4. **Hurdle 4 - CSV Async Import Bug in Vite:** The AI initially attempted to load the static CSVs via an asynchronous `fetch()` API call, which caused rendering delays and console warnings.
* *Debugging:* During code review, I intervened and explicitly instructed the AI to use Vite's `?raw` string import suffix. This allowed PapaParse to synchronously parse the static text immediately on mount, vastly improving performance and avoiding async React state bugs.

5. **Hurdle 5 - Formatting Artifacts in Recharts (The "850%" Bug):** On the Unemployment Scatter Plot, the X-Axis unexpectedly displayed values like `850%` instead of `8.5%`. The AI incorrectly assumed the raw CSV data was stored as decimals (e.g., `0.085`) and mathematically multiplied the value by 100 before passing it to Recharts.
* *Debugging:* I reviewed the raw data extract and confirmed the values were already stored as whole numbers (`8.5`). I prompted the AI to remove the `* 100` data transformation and directly append the `%` symbol via the `<XAxis tickFormatter/>` prop.

### Cross-Validation via Looker Studio (Data Integrity)
To ensure the LLM-generated React dashboard was not hallucinating numbers or misrepresenting trends, I strictly validated its visual outputs against my established **Looker Studio Dashboard**. By cross-referencing the React charts against the Looker Studio scorecards, I could confidently verify that the AI's data transformations were statistically accurate.

---

## 4. The Insights
*Deliver 4-5 high-value insights found within the data.*

The deployment of advanced Window Functions across our `dbt` mart layer surfaced the following actionable commercial insights (visualized in both dashboards):

1. **Stable Store Network Organic Growth:** Throughout the analyzed period, the store network scale remained completely stable at exactly 45 locations (with no new store openings or closures). Therefore, the 2.1% revenue growth was driven entirely by the organic growth of existing stores, rather than through network expansion.
2. **Dual-Sided Anomaly Detection (Critical Drops):** The dashboard doesn't just celebrate "Flash Sales"; it proactively alerts Operations to "Critical Drops" (e.g., POS failures or severe local disruptions) against a clearly visible baseline. Using 52-week rolling z-scores effectively isolates true anomalies from predictable Q4 holiday spikes (e.g., Christmas), preventing false alarms.
3. **Dominance of Black Friday:** 80% of the top 10 Flash Sale events occurred simultaneously on November 22, 2019. This proves that company-wide seasonal campaigns like Black Friday drive extraordinary multi-sigma bumps ($> 5\sigma$) across nearly all retail branches.
4. **The Macroeconomic Collapse Threshold:** When fuel prices suffer a "thermal shock" exceeding $+12\%$, retail resilience completely collapses. Every single store plunges into "Pro-Cyclical" vulnerability, defining **$10\%$** as the absolute critical threshold where Executive Management must immediately deploy system-wide price subsidies or emergency promotional campaigns to prevent massive volume loss.
5. **The Lipstick Effect (Store 35):** Over 21 distinct weeks of high unemployment, Store 35's sales surged, proving it benefits from consumer down-trading (attracting shoppers who abandoned more expensive competitors during economic downturns).
