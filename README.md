# THE ICONIC: BI & Data Insights Challenge - Submission Report

**[Live Vercel Dashboard Demo (The AI Twist)](https://the-ai-twist.vercel.app/)** | **[View Looker Studio Dashboard](https://datastudio.google.com/reporting/b850b2ee-afb6-48fe-b1db-7ad584955e15)**

> **Note on Live Demo:** The Vercel link hosts the final "AI Twist" Executive Analytics Dashboard built in React. The Looker Studio link hosts the initial BI version.

[![The AI Twist Demo](images/Chatbot-feature.png)](https://the-ai-twist.vercel.app/)

---

## TL;DR: Project Completion Master Checklist

This repository represents a complete submission for **THE ICONIC: BI & Data Insights Challenge**, executing all 4 Stages.

Below is the detailed alignment between THE ICONIC's requirements and the delivered solutions:

### Stage 1: Engineering & Refactoring

| Requirement | Delivered Solution | Status |
| --- | --- | --- |
| **1. Data Quality Audit** | Identified and resolved 3 critical source issues in `stg_weekly_sales.sql`:<br><br>1. Corrected invalid dates (e.g., `14/13/2019` -> `12/2019`).<br><br>2. Flagged zero/negative sales outliers (`is_invalid_sales`).<br><br>3. Enforced safe type casting & Null handling (`COALESCE`). | **DONE** |
| **2. Schema Refactoring & DDL** | Designed a standard Kimball **Star Schema** (`fct_weekly_sales`, `dim_store`, `dim_date`).<br><br>• `dim_store` implements **SCD Type 2** (`valid_from`, `valid_to`, `is_current`, `store_sk`).<br><br>• Provided **BigQuery DDL** featuring `PARTITION BY partition_date` and `CLUSTER BY store_id`.<br><br>• Explained the benefits of preventing fan-out and optimizing scan costs for BI tools. | **DONE** |
| **3. Proposed Data Ecosystem** | Proposed 3 theoretical external tables with explicit Join Keys:<br><br>1. `dim_marketing_spend` (Key: `partition_date` + `region_id`).<br><br>2. `dim_weather_indices` (Key: `store_id` + `partition_date`).<br><br>3. `dim_competitor_pricing` (Key: `partition_date` + `region_id`). | **DONE** |

### Stage 2: Advanced SQL Intelligence

| Requirement | Delivered Solution | Status |
| --- | --- | --- |
| **1. The "Comeback King"** | Authored `mart_comeback_king.sql` using `LAG()` to detect negative growth weeks, combined with a `SUM(...) OVER (PARTITION BY store_id ORDER BY partition_date ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING)` window to measure the subsequent 4-week recovery. | **DONE** |
| **2. Statistical Anomaly Detection** | Authored `mart_anomaly_detection.sql` to calculate a **52-week Rolling Z-Score** (`AVG` and `STDDEV_SAMP` over a 51-week preceding window). Classified anomalies bi-directionally: Spikes (Z > 3) and Drops (Z < -3). | **DONE** |
| **3. Counter-Cyclical Trends** | Authored `mart_counter_cyclical.sql` as an **Event-Log**, comparing `sales_growth_pct` vs `fuel_growth_pct` (>5%) to categorize stores as Resilient vs Vulnerable. | **DONE** |

### Stage 3: Dashboard Asset & Insight Delivery

| Requirement | Delivered Solution | Status |
| --- | --- | --- |
| **1. The Build** | Constructed the official **Looker Studio Executive Dashboard** featuring a top-down, 2-section layout with MTD/YTD Scorecards. | **DONE** |
| **2. The AI Twist** | Built a standalone Web App using **React.js + Tailwind CSS + Recharts**, integrating global interactive filters (**Highlight Store 14** functionality) and a **Product Tour Guide** (`react-joyride`). Deployed live to Vercel: **[https://the-ai-twist.vercel.app/](https://the-ai-twist.vercel.app/)**. | **DONE** |
| **3. The Methodology** | Detailed 3 methodological pillars (*Modular & Disconnected Prompting*, *Human-in-the-Loop AI Debugging*, *Monorepo Deployment*) in `README.md`, and authored an in-depth report on debugging 5 AI hurdles (Selection Bias, Recharts shape, Vite CSV bug, % formatting) in `docs/report/stage3.md`. | **DONE** |
| **4. Commercial Insights** | Extracted 5 high-value, data-backed commercial insights:<br><br>• The dominance of Black Friday (80% of mega events).<br><br>• The macroeconomic collapse threshold at 10% Fuel Growth.<br><br>• The "Lipstick Effect" demonstrated by Store 35.<br><br>• The Store 14 plot twist (functioning as both Comeback King and Fail King due to extreme seasonality). | **DONE** |

### Stage 4: Agentic Analytics & AI Strategy

| Requirement | Delivered Solution | Status |
| --- | --- | --- |
| **1. The Analyst Agent** | Designed the architecture for a **Campaign Simulation Agent ("DataBot")** powered by **Digital Customer Twins**, equipped with 5 specialized tools (e.g., `query_simulation_result`, `what_if_calculator`) to test marketing scenarios in a Zero-PII sandbox. | **DONE** |
| **2. Team Integration** | Detailed a **Human-Designed, AI-Generated** workflow utilizing AI as a Pair-Programmer to automate tedious BI tasks (dbt scaffolding, `schema.yml` generation, data quality test audits), while acting as a Senior Code Reviewer to solve 4 technical hurdles. | **DONE** |

## Final Submission Assets

The complete project payload is now consolidated on the `main` branch of this GitHub Repository:

1. **Production Web App (Vercel Live URL):** [https://the-ai-twist.vercel.app/](https://the-ai-twist.vercel.app/)
2. **Standard BI Dashboard:** [Looker Studio Link](https://datastudio.google.com/reporting/b850b2ee-afb6-48fe-b1db-7ad584955e15)
4. **Detailed Stage Reports:** Located in `docs/report/`.

---

## The Assignment (Original Context)

## Executive Summary

This project delivers an end-to-end analytics foundation for THE ICONIC Weekly Sales dataset. Built on **dbt-fusion (v2)** and **BigQuery**, the architecture transforms flat transaction records into a standard **Star Schema**, enforces strict data quality tests, and feeds an interactive **Looker Studio Executive Dashboard** for high-impact decision-making.

---

## Stage 1: Engineering & Refactoring

**Thinking Process & Strategy:** 
The foundational goal was to transform the raw, flat, error-prone CSV data into a robust, scalable structure. Instead of building messy intermediate (`int_`) layers, the strategy was to leap straight into a Kimball **Star Schema**. I designed a strictly typed Staging layer that uses `SAFE.PARSE_DATE` and `COALESCE` to handle bad data gracefully without dropping records, ensuring perfect data lineage.

**Execution Output:**
- **Star Schema:** Built `fct_weekly_sales` and `dim_store` (implementing SCD Type 2).
- **Optimization:** Applied BigQuery `PARTITION BY` and `CLUSTER BY` to drastically reduce downstream BI scanning costs.

> 📚 **Deep Dive:** For the exact SQL DDL code, the Mermaid Entity-Relationship diagram, and the 3 proposed external tables (Ecosystem Integration), read the **[Stage 1 Detailed Report](docs/report/stage1.md)**.

---

## Stage 2: Advanced SQL Intelligence

**Thinking Process & Strategy:** 
The goal was to move beyond basic aggregations and extract true "hidden" stories. The strategy was to rely heavily on advanced **dbt Window Functions** (`LAG`, `AVG() OVER`, `STDDEV_SAMP`) directly at the Data Mart layer, creating **Event-Log Fact Tables**. By avoiding premature `GROUP BY` roll-ups in dbt, the BI tool retains 100% interactive filtering capabilities at the most granular level.

**Execution Output:**
- **Comeback King (`mart_comeback_king`):** Captures 4-week recovery windows following a sales drop.
- **Anomaly Detection (`mart_anomaly_detection`):** Employs a 52-week rolling Z-Score to isolate $>3\sigma$ Flash Sales and $<-3\sigma$ Critical Drops.
- **Counter-Cyclical Trends (`mart_counter_cyclical`):** Ranks stores by Resilience Index when fuel prices spike $>5\%$.

> 📚 **Deep Dive:** To see the SQL implementation logic and the rich commercial insights derived from these models (e.g., The "Iron Wall" Stores, The Lipstick Effect), read the **[Stage 2 Detailed Report](docs/report/stage2.md)**.

---

## Stage 3: Dashboard Asset & Insight Delivery

**Thinking Process & Strategy:** 
To deliver maximum commercial value, the presentation layer was split in two. First, a top-down Looker Studio Dashboard built for C-level executives (focusing on 1-click scorecards and high-contrast 2x2 grids). Second, the "AI Twist" requirement was executed by building a fully interactive React.js web application. The core strategy here was **Schema-Driven, Disconnected Prompting**—providing the AI with safe, aggregated data structures to build a production frontend without risking BigQuery exposure.

**Execution Output:**
- **Looker Studio:** [Standard BI Dashboard](https://datastudio.google.com/reporting/b850b2ee-afb6-48fe-b1db-7ad584955e15)
- **Vercel React App:** [The AI Twist](https://the-ai-twist.vercel.app/)

> 📚 **Deep Dive:** For a full breakdown of the Dashboard UX, the 5 core Commercial Insights extracted, and how I acted as a Senior Reviewer to debug the AI's selection bias and Recharts formatting, read the **[Stage 3 Detailed Report](docs/report/stage3.md)**.

---

## Stage 4: Agentic Analytics & AI Strategy

### 4.1 The Analyst Agent Architecture (Campaign Simulation & Digital Twins)

To scale analytical impact across THE ICONIC beyond passive reporting, I propose deploying **The Analyst Agent ("DataBot")** as a **Campaign Simulation Platform** powered by **Digital Customer Twins**:

```text
[ Feature Mart (BigQuery) ] ──(No PII Vectorization)──► [ Vector Store (Pinecone/Weaviate) ]
                                                                 │
                                                                 ▼
[ Business No-Code UI ] ──(Campaign Spec)──► [ Simulation Engine ] ◄── [ Digital Twin Generator ]
                                                    │
                                                    ▼
                                       [ Simulation Result Store ]
                                                    │
                                                    ▼
                                     [ The Analyst Agent (Slack Bot) ] ◄──► [ Business User ]
```

* **Zero-PII Sandbox:** Converts historical features into dense vector embeddings stored in a Vector DB (Pinecone/Weaviate). Strips all PII by design, enabling business teams to simulate campaigns without touching live production databases.
* **Digital Twin Generator:** Spawns synthetic user cohorts ($n = 1,000 \rightarrow 10,000$) that simulate customer decision journeys (Impression $\rightarrow$ Click $\rightarrow$ Cart $\rightarrow$ Purchase).
* **The Analyst Agent (DataBot) Tools:**
1. `query_simulation_result`: Retrieves projected CTR, CVR, AOV, and margin impact.
2. `what_if_calculator`: Re-runs simulations instantly when parameters (e.g., discount %, freeship thresholds) are altered.
3. `segment_comparator`: Evaluates elasticity across different demographic/behavioral cohorts.
4. `root_cause_analyzer`: Synthesizes simulated twin reasoning to explain cart abandonment.
5. `knowledge_lookup`: Retrieves internal margin rules and marketing guidelines.


* **4-Layer Validation Framework:** Evaluates simulation accuracy via *Statistical Fidelity* (KS-tests), *Behavioral Fidelity* (Historical Replays with Relative Error $< 15\%$), *Predictive Validity* (Live Pilots), and *Decision Utility*.
* **Executive Guardrail:** Mandates that simulation serves as a **Hypothesis Generator, Not an Oracle**—every major launch requires endorsement from at least 1 non-synthetic data source.

> 📚 **Detailed Campaign Simulation Proposal:** For the complete enterprise proposal—including fashion e-commerce dynamics, a 5-tool functional specification, multi-turn Slack conversation transcripts, governance frameworks, and a 90-day implementation roadmap, see the dedicated report: **[`docs/report/stage4.md`](docs/report/stage4.md)**.

---

### 4.2 Team Integration: Automating "Boring" BI Tasks in Stages 1 & 2

To maximize focus on high-value data architecture, dimensional modeling, and commercial insights (Stages 1 & 2), I integrated AI into my workflow as an **Autonomous Pair-Programmer**. By establishing repository-level behavioral rules (`.agents/AGENTS.md`) and a specialized engineering skill (`.agents/skills/dbt-analytics-engineering/SKILL.md`), I automated the repetitive, boilerplate BI tasks:

#### 1. Automated Repetitive BI Tasks (AI Execution):
* **dbt Project Scaffolding:** AI generated the initial dbt directory structures, `profiles.yml`, and `dbt_project.yml` configurations.
* **Boilerplate `schema.yml` Generation:** AI automatically drafted data dictionaries, column descriptions, and repetitive dbt constraint tests (`not_null`, `unique`, `relationships`) across staging and mart layers.
* **SQL Staging & DDL Scaffolding:** AI wrote standard type-casting boilerplate (`CAST`, `COALESCE`), cleansed malformed dates (`SAFE.PARSE_DATE`), and scaffolded BigQuery DDL syntax with `PARTITION BY` and `CLUSTER BY` clauses.
* **Window Function Boilerplate:** AI generated complex CTE skeletons and rolling window frames (`AVG() OVER`, `STDDEV_SAMP() OVER 51 PRECEDING`).

#### 2. Human Strategic Leadership (Senior Reviewer Interventions):
While AI handled syntax and boilerplate in seconds, I maintained strict architectural control to overcome 4 critical LLM logic anti-patterns during Stages 1 & 2:
* **Overcoming Pre-Aggregation (Event-Log Grain):** The AI originally attempted to apply `GROUP BY store_id` in dbt marts. I intervened to force an **Event-Log Fact Table** structure (`partition_date` grain), ensuring C-level executives retain full interactive date-filtering in Looker Studio.
* **Eliminating Positive Anomaly Bias:** The AI added hardcoded `WHERE growth > 0` filters when building the *Comeback King* model. I forced the retention of two-sided anomalies to discover critical operational drops (*Fail Kings*).
* **Relative Metric Engineering:** The AI mistakenly ranked store resilience using absolute sales volume. I directed it to engineer a standardized **`Resilience Index (% vs Baseline)`** using window functions to evaluate true market share retention during economic downturns.
* **BigQuery State Management:** Guided the AI to resolve BigQuery materialization caching conflicts using `dbt run --full-refresh`.

---

### 4.3 Executive Summary & Defense Notes

*Defense Script for Executive Q&A on Stage 4:*

> "Instead of building a passive SQL/Python bot that merely queries past transactions, I designed **The Analyst Agent ("DataBot")** as a **Campaign Simulation Platform** powered by **Digital Customer Twins**.
> This platform addresses THE ICONIC's core marketing challenge: **How to test campaign scenarios and inventory risks in 3 minutes without spending real budget, annoying live customers, or exposing PII**—a capability particularly vital for fashion e-commerce due to high seasonality, short product lifecycles, and massive inventory risk. We encode customer attributes into vector embeddings within a Feature Mart to spawn synthetic virtual cohorts. When a Marketer wants to test a Flash Sale or a new Collection launch, they input parameters into a No-Code UI. In 3 minutes, Digital Twins simulate the journey, projecting CTR, CVR, AOV, margin cannibalization, and root causes for cart abandonment.
> To ensure business trust, the system relies on a **4-Layer Validation Framework**:
> 1. *Statistical Fidelity:* KS-tests ensuring twin distributions match real cohorts.
> 2. *Behavioral Fidelity:* Historical campaign replays targeting Relative Error $< 15\%$ and Pearson Correlation $r \ge 0.7$.
> 3. *Predictive Validity:* Validating predicted lift against small live pilots.
> 4. *Decision Utility:* Reducing time-to-insight from 3 weeks to 3–5 minutes.
> 
> 
> In our 90-day roadmap, we prove ROI in Month 1 on a single narrow use-case: Gen Z Sneaker Flash Sales. Crucially, I establish an unyielding governance rule: **AI Simulation is a Hypothesis Generator, Not an Oracle**. Every major capital allocation must be backed by at least one non-synthetic data source before launch."

---

## Setup & Execution

1. Create a virtual environment and install dependencies:
```bash
python3 -m venv dbt-env
source dbt-env/bin/activate
pip install -r requirements.txt
```

2. Make sure `~/.dbt/profiles.yml` has a profile called `the_iconic_bi` pointing at your BigQuery project/dataset.

3. Run everything:
```bash
dbt deps
dbt seed       # loads seeds/store_region.csv
dbt build      # runs models + tests
```

## Testing & Validation

The project includes 15 tests covering:
- Primary key uniqueness and not-null checks on fact and dimension tables.
- Foreign key validation (`fct_weekly_sales.store_id` -> `dim_store`, `fct_weekly_sales.partition_date` -> `dim_date`).
- Not-null checks on staging layer columns.

Run `dbt test` to verify all constraints.

## Dashboard Logic Reproduction

To reproduce the top-level KPI scorecards seen in the dashboard (e.g., for October 2021), run the following query against the fact table:

```sql
SELECT 
    -- TOTAL SALES IN 10/2021
    SUM(weekly_sales_amount_vnd) AS total_sales_oct,
    
    -- WEEK IN OCT
    COUNT(DISTINCT partition_date) AS total_weeks_count,
    
    -- ACTIVE STORE IN OCT
    COUNT(DISTINCT store_id) AS active_stores_count,
    
    -- RECORDS = WEEK X STORE
    COUNT(*) AS total_rows_count,
    
    -- AVG FUNC (Total Sales / Total Rows) = SUM(weekly_sales_amount_vnd) / COUNT(*)
    AVG(weekly_sales_amount_vnd) AS avg_weekly_sales_per_store_method1
FROM `the-iconic-bi.dbt_marts.fct_weekly_sales`
WHERE partition_date >= '2021-10-01' 
  AND partition_date <= '2021-10-31'
  AND is_invalid_sales = FALSE;
```