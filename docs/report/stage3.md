# Stage 3: Dashboard Asset & Insight Delivery - Detailed Report

**Goal:** Build a functional tool and extract commercial value.

---

## 1. The Build (Looker Studio)

*Create an interactive dashboard that allows a user to explore these trends.*

The Looker Studio dashboard is a top-down **Executive Dashboard**, structured to avoid
information overload:

1. **1-click executive scorecards.** The header turns multi-CTE window-function logic into
   single top-line numbers -- e.g. "Net Sales Growth During Fuel Spikes: +0.69%" -- so a C-level
   reader gets the answer without drilling. Each scorecard now carries its sample size, because
   "+0.69%" means something different across 111 store-weeks than across 3.
2. **Section 1 -- Overall performance.** Total sales, active stores, like-for-like growth,
   weekly sales trend, top 10 stores by volume.
3. **Section 2 -- Macro-economic insights (2x2 grid).**
   * **Visual benchmarking:** scatter plots (fuel-price elasticity, unemployment sensitivity)
     plot macro variables against *standardised* measures (z-score, resilience index) so
     resilient and vulnerable clusters separate visually regardless of store size.
   * **Granular actionability:** ranked, filterable tables (Comeback Kings, resilience
     leaders) that an Operations team can act on store by store.

A static export lives at
[`DATA_STUDIO-THE_ICONIC_-_EXECUTIVE_SALES_&_INSIGHTS_DASHBOARD.pdf`](./DATA_STUDIO-THE_ICONIC_-_EXECUTIVE_SALES_&_INSIGHTS_DASHBOARD.pdf)
so the submission stands on its own even if the live link's sharing permissions lapse.

---

## 2. The AI Twist

*Use Gen-AI to build this asset in a language you do not usually work in.*

My working stack is SQL and dbt; frontend development is outside it. So the second dashboard
is a standalone **React 19 + Tailwind CSS 4 + Recharts 3** application, built with Generative
AI, in a Vite monorepo (`the-ai-twist/`) and continuously deployed to Vercel.

**Scope disclosure:** the app includes a floating "ICONIC Data Agent" chat panel. It is
labelled **UI Prototype** in the interface and returns a scripted response -- it is not
connected to an LLM or to BigQuery. It exists to visualise the interface for the Stage 4
Analyst Agent, whose real architecture is specified in [`stage4.md`](./stage4.md). Everything
else in the app is driven by real exported mart data.

---

## 3. The Methodology

*Describe how you "prompted" your way to this build. What were the hurdles? How did you debug the AI's output?*

### Workflow: modular and disconnected

1. **Insight mapping and data provisioning.** Mapped each SQL measure to a UI component, then
   exported the datasets as static CSVs via `scripts/export_data.py`, avoiding a live backend
   credential path entirely.
2. **Frontend scaffolding.** Vite + React, Tailwind v4 configuration, and a local NPM cache
   override to work around `EACCES` permission errors.
3. **Component engineering.** Directed the LLM to bind the CSVs to Recharts components under a
   strict "high-contrast editorial" design system (stark white, emerald green, coral red).
4. **Deployment.** Static production bundle on Vercel.

### The prompting strategy: "schema-driven, disconnected"

The LLM never received database credentials. It received:

1. **Context injection** -- the compiled dbt model SQL (e.g. `mart_unemployment_sales_impact.sql`),
   which conveys the exact semantic layer, column names and business logic without exposing a
   single row of data.
2. **Aggregated mock data** -- I ran the query myself and handed over a small aggregated
   extract, rather than asking the AI to write live API fetching logic.
3. **A persona-assigned mega-prompt** -- *"Act as a Senior Frontend React Developer. I have a
   static JSON array representing macroeconomic retail data. Write a functional React component
   using Tailwind CSS for layout and Recharts for data visualization."*

The security property is structural: **the model could not have leaked production data,
because it was never connected to any.**

### Hurdles and debugging

**Hurdle 1 -- AI data selection bias (the "Top N" trap).** Asked to generate the extraction
SQL, the AI wrote `ORDER BY resilience_rank ASC LIMIT 30` and
`WHERE anomaly_type = 'Positive Anomaly (Spike)'`.

*Debug:* exporting only the favourable tail destroys the baseline a scatter plot needs and
deletes the Critical Drops and Fail Kings that Stage 2 was built to surface. I rewrote the
queries with `UNION ALL` across both extremes and `ABS(z_score) > 3` for two-sided anomalies.
This is now a documented rule at the top of `export_data.py`, so the mistake cannot recur
silently.

**Hurdle 2 -- Recharts data shape.** The AI passed raw JSON into `<Scatter/>` and the chart
rendered blank. *Debug:* pasted the exact console warning plus the relevant docs snippet into
the prompt; the AI then mapped the array into the required `{ x, y, z }` shape. Feeding the
error text verbatim was far more effective than describing the symptom.

**Hurdle 3 -- Hardcoded chart dimensions.** `width={800} height={400}` broke the layout on
smaller laptops. *Debug:* directed a refactor onto `<ResponsiveContainer>` plus Tailwind's
`grid-cols-1 md:grid-cols-2`.

**Hurdle 4 -- CSV async import bug in Vite.** The AI loaded CSVs via `fetch()`, producing
render delays and state warnings. *Debug:* switched to Vite's `?raw` suffix so PapaParse
parses synchronously on mount.

**Hurdle 5 -- The "850%" formatting artifact.** The unemployment x-axis rendered `850%`
instead of `8.5%`: the AI assumed decimals and multiplied by 100. *Debug:* checked the raw
extract, confirmed values were already whole numbers, removed the transform and appended the
symbol via `<XAxis tickFormatter/>`. Worth noting the general lesson -- **the AI's error was an
assumption about the data, not about the code.** That class of bug is invisible unless someone
who knows the data reviews the output.

### Cross-validation: three independent checks

Because an LLM will produce confident, well-formatted, wrong numbers, no figure was trusted
until it agreed across independent paths:

1. **React app vs Looker Studio** -- the two dashboards read the same marts through completely
   different toolchains; disagreement means a transformation bug.
2. **BigQuery vs DuckDB** -- `scripts/verify_insights.py` rebuilds the whole pipeline from
   `raw/bia_data.csv` in DuckDB. Both engines return 169 spikes, 10 drops and a 12.88 peak
   sigma. Two engines, one answer.
3. **dbt tests** -- 74 assertions run on every build, including `accepted_values` on the exact
   label strings the dashboard filters on, so a renamed category fails the build instead of
   silently emptying a chart.

### Auditing my own first pass

The most useful review I did was of my own output, not the AI's. A first version of these
insights shipped four numbers that did not survive a check against the source. I found them by
recomputing every claim from the raw CSV rather than re-reading my own dashboard:

| First-pass claim | What the data says | Root cause |
| --- | --- | --- |
| "80% of top-10 spikes are Black Friday" -- framed as *the* pattern | True of the top 10 by z-score, but pre-Christmas week moves **40 of 45 stores** vs Black Friday's 35, and repeats at 38 in 2020 | Ranked by peak intensity, reported as breadth |
| "Stores 33 & 42 grew +9.39% / +9.21% under fuel stress" | **+1.35% / +0.56%** across *all* their fuel-spike weeks | Averaged only the weeks where sales rose -- conditioning on the outcome |
| "10% fuel growth is the critical threshold -- deploy subsidies" | Directionally true, but **n = 3 store-weeks, one week, 3 stores** | Reported a pattern without its sample size |
| "Store 35 holds a 130% Resilience Index" | 126% on an all-period baseline; **99.4%** on a trailing 52-week baseline | Baseline looked ahead and did not detrend -- a growth trend read as downturn resilience |

Two things followed. First, each fix went into the **model**, not just the prose: both
baselines now ship as columns, `fuel_spike_bucket` carries n into the BI layer, and
`pct_comeback_growth` sits beside the absolute measure. The dashboard cannot present the
flattering version without the honest one next to it. Second, the corrected findings are
better than the originals -- a pattern that repeats across two Decembers is more useful than
one that peaked once.

---

## 4. The Insights

*Deliver 4-5 high-value insights found within the data.*

**1. All growth is organic, and it is modest.** The estate held at exactly 45 stores for all
143 weeks -- no openings, no closures -- so no growth came from expansion. On a like-for-like
basis (identical Feb 1 - Oct 22 window, compared per store-week to neutralise unequal week
counts), sales grew **+1.8% from 2019 to 2021**. Total: 6.74bn VND, averaging 1.05M per
store-week.

**2. The calendar runs the business -- and the flag describing it is wrong.** 169 store-weeks
breach +3 sigma, concentrated in five weeks, all in November and December. Black Friday week
is the most *intense* (all top-10 spikes, peaking at 12.88 sigma); the **pre-Christmas week is
the most broad** -- 40 of 45 stores in 2019, repeating with 38 in 2020. Yet the source's
`Is_holiday_week` field flags the week *after* Christmas (0.86x an average week -- below
average) and misses the week before it (1.72x -- the largest trading week on record). Any
seasonality analysis built on the raw flag measures the wrong weeks. `dim_date` now publishes
`is_trading_peak_week` to correct it.

**3. Promotional elasticity is inversely related to store size.** Flagship Store 4 produced
the biggest absolute Black Friday revenue (2.79M) at 9.45 sigma; Store 29, about a fifth of
its size, hit **12.88 sigma** and nearly doubled its own baseline. Allocating campaign
inventory by absolute volume systematically under-serves the stores that respond most.
Actionable: weight Tier-2 branches in the next Black Friday allocation.

**4. Anomaly monitoring was blind in one eye.** Scoring each week against a baseline that
*excluded* it raised detected negative anomalies from **2 to 10**. Store 16 (-3.63) and Store
35's three-week September 2019 slide are now visible and warrant an operational audit. A
system reporting 2 incidents in three years does not look broken, which is precisely why this
class of error survives.

**5. Two headline "macro" stories shrink under scrutiny -- and one holds.** Above +10% fuel
inflation every observed store turned pro-cyclical, but that is **3 store-weeks in one week**:
worth an alert, not a subsidy budget. Store 35's "Lipstick Effect" disappears against a
trailing baseline (126% to 99.4%); the genuine performers are Store 7 (114.9%, 27 weeks) and
Store 16 (107.7%, 48 weeks). What does hold is the aggregate: across all 111 fuel-spike weeks
the network still grew **+0.69%**, splitting 50/50 resilient to vulnerable. The reliable
finding is network-level absorption of moderate inflation -- not individual invincible stores.
