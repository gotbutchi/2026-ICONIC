# Stage 2: Advanced SQL Intelligence - Detailed Report

**Goal:** Use complex logic to find "hidden" stories.

> Every figure below is reproducible: `scripts/verify_insights.py` recomputes the full
> pipeline from `raw/bia_data.csv` in DuckDB and prints each one. The DuckDB output and the
> BigQuery marts were cross-checked and agree exactly (169 spikes, 10 drops, 12.88 peak
> sigma) -- two independent engines, one answer.

**A note on how these are modelled.** All three answers ship as dbt models rather than
one-off queries, and all three are **event logs at the original grain**: no `GROUP BY`, no
`LIMIT`, no ranking baked in. The brief asks for "the" store, and the model returns every
qualifying event so the BI layer can rank it, filter it by date, and -- crucially -- show the
losers next to the winners. Hardcoding `LIMIT 1` in the transformation layer answers the
question once and blocks every follow-up question.

---

## 1. The "Comeback King"

*Identify the store that achieved the highest cumulative sales growth in the 4 weeks immediately following a week of negative or zero growth.*

### The answer

**Store 14, week ending 2019-02-08: +4,366,039 VND over the following 4 weeks (+100.9%).**

### The SQL (`mart_comeback_king.sql`)

```sql
WITH weekly_growth AS (
    SELECT
        store_id, partition_date, weekly_sales_amount_vnd,
        LAG(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id ORDER BY partition_date
        ) AS prev_week_sales
    FROM fct_weekly_sales
    WHERE is_invalid_sales = FALSE
),

flag_negative_growth AS (
    SELECT *,
        CASE WHEN (weekly_sales_amount_vnd - prev_week_sales) <= 0
             THEN TRUE ELSE FALSE END AS is_negative_growth
    FROM weekly_growth
),

next_4_weeks_calc AS (
    SELECT *,
        SUM(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id ORDER BY partition_date
            ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING
        ) AS cumulative_sales_next_4_weeks,
        SUM(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id ORDER BY partition_date
            ROWS BETWEEN 3 PRECEDING AND CURRENT ROW
        ) AS cumulative_sales_past_4_weeks,
        -- guard: without this, stores near the end of the feed return NULL sums
        COUNT(weekly_sales_amount_vnd) OVER (
            PARTITION BY store_id ORDER BY partition_date
            ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING
        ) AS future_weeks_count
    FROM flag_negative_growth
)

SELECT
    store_id,
    partition_date AS comeback_start_date,
    (cumulative_sales_next_4_weeks - cumulative_sales_past_4_weeks) AS absolute_comeback_growth,
    SAFE_DIVIDE(
        cumulative_sales_next_4_weeks - cumulative_sales_past_4_weeks,
        cumulative_sales_past_4_weeks
    ) AS pct_comeback_growth
FROM next_4_weeks_calc
WHERE is_negative_growth = TRUE
  AND future_weeks_count = 4
```

### Why two measures, not one

Ranking a turnaround by absolute VND mostly ranks store size. Quantified: the top 10 events
by absolute growth have an **average store-size rank of 7.4 out of 45**; the top 10 by
percentage average **27.4**. The absolute leaderboard is largely a list of the biggest stores.

Store 14's result survives both tests -- it is #1 by VND and #3 by percentage (behind Store
25 at +108.7% and Store 45 at +102.0%) -- so the headline is robust rather than an artifact.
Publishing both columns is what makes that verifiable instead of assumed.

### The insight: Store 14 is both king and casualty

Because the model keeps every event rather than filtering to positive ones, the same table
answers the inverse question:

| Role | Store | Week | Change over next 4 weeks |
| --- | --- | --- | --- |
| Comeback King | 14 | 2019-02-08 | **+4.37M (+100.9%)** |
| Fail King | 14 | 2019-12-27 | **-3.89M (-36.0%)** |
| Fail King (repeat) | 14 | 2020-12-25 | **-3.41M (-32.9%)** |

The December collapse **repeats in both years**, and the entire top-5 Fail King list is
composed of post-Christmas weeks. That reframes the finding: this is not an operational
failure to investigate but a predictable post-holiday unwind to plan inventory around. A
one-year observation would have been ambiguous; the recurrence is what makes it actionable.

---

## 2. Statistical Anomaly Detection

*Flag every "Flash Sale" week -- any week where a store's sales were > 3 standard deviations above its own 52-week rolling average.*

### The SQL (`mart_anomaly_detection.sql`)

```sql
WITH rolling_stats AS (
    SELECT
        store_id, partition_date, is_holiday_week, weekly_sales_amount_vnd,
        AVG(weekly_sales_amount_vnd)         OVER w_trailing AS rolling_52w_avg,
        STDDEV_SAMP(weekly_sales_amount_vnd) OVER w_trailing AS rolling_52w_stddev,
        COUNT(weekly_sales_amount_vnd)       OVER w_trailing AS baseline_weeks
    FROM fct_weekly_sales
    WHERE is_invalid_sales = FALSE
    WINDOW w_trailing AS (
        PARTITION BY store_id ORDER BY partition_date
        ROWS BETWEEN 52 PRECEDING AND 1 PRECEDING   -- excludes the week under test
    )
),

anomaly_scoring AS (
    SELECT *,
        SAFE_DIVIDE(weekly_sales_amount_vnd - rolling_52w_avg, rolling_52w_stddev) AS z_score
    FROM rolling_stats
    WHERE baseline_weeks > 10
)

SELECT *,
    CASE
        WHEN z_score >  3 THEN 'Positive Anomaly (Spike)'
        WHEN z_score < -3 THEN 'Negative Anomaly (Drop)'
        ELSE 'Normal'
    END AS anomaly_type,
    (z_score < -3) OR (z_score > 3 AND NOT is_holiday_week) AS requires_investigation
FROM anomaly_scoring
```

### The window frame is the whole finding

The original implementation used `ROWS BETWEEN 51 PRECEDING AND CURRENT ROW` -- it put the
observation **inside its own baseline**. That drags the mean toward the outlier and inflates
sigma, systematically shrinking every z-score. Correcting the frame to
`52 PRECEDING AND 1 PRECEDING` changed the results materially:

| | Observation inside baseline | Baseline excludes observation |
| --- | --- | --- |
| Positive anomalies detected | 151 | **169** |
| Negative anomalies detected | **2** | **10** |
| Peak z-score | 5.72 | **12.88** |

The negative side is the commercially important half: the original frame was **masking 8 of
10 genuine operational drops**, because a store's own bad week partially defined what "normal"
meant for it. A monitoring system that detects 2 incidents in three years looks healthy and
is in fact blind.

`baseline_weeks` and `has_full_52w_baseline` are published for honesty: the feed begins
2019-02-01, so a *full* 52-week baseline does not exist until **2020-01-31**. Everything
before that is an expanding window of up to 52 weeks, and the headline spikes below fall in
that period. The claim is therefore "up to 52 weeks", not "52 weeks".

### Key findings

**1. Black Friday is the most intense week; pre-Christmas is the broadest.** These are
different claims and both matter:

| Week ending | Stores > 3 sigma | Avg z | Max z | Source flag says holiday? |
| --- | --- | --- | --- | --- |
| 2019-12-20 | **40 of 45** | 6.52 | 8.89 | No (DQ-4) |
| 2020-12-18 | **38 of 45** | 4.30 | 5.40 | No (DQ-4) |
| 2019-11-22 | 35 | **7.47** | **12.88** | Yes |
| 2019-12-13 | 24 | 3.86 | 4.75 | No |
| 2020-11-20 | 14 | 3.55 | 4.90 | Yes |

All ten of the single largest spikes are Black Friday week -- that is where promotional
intensity peaks. But the *pre-Christmas* week moves nearly the entire estate, in both years.
For inventory planning, breadth and recurrence beat peak intensity: 40 stores repeating at 38
is a plannable pattern, and it is the one the source holiday flag omits entirely (DQ-4).

**2. Tier-2 stores have the highest promotional elasticity.** Flagship Store 4 posted the
largest absolute Black Friday revenue (2.79M VND) but only 9.45 sigma. Store 29 -- roughly a
fifth of the size -- hit **12.88 sigma**, nearly doubling its own baseline (528K to 975K).
Relative elasticity, not absolute volume, is what should drive promotional inventory
allocation.

**3. Ten drops now visible, not two.** The strongest: Store 16 on 2019-04-19 (**-3.63**),
Store 35 on 2019-09-20 (**-3.51**), Store 36 on 2019-11-29 (**-3.43**). Store 36's is the most
striking in context -- it dropped hard in the week *after* Black Friday while its peers were
still elevated. Store 35 shows three consecutive negative weeks in Aug-Sep 2019, a sustained
pattern rather than a one-week blip. Neither was detectable under the original window frame.

---

## 3. Counter-Cyclical Trends

*Identify stores where Fuel_Price rose by >5% while Weekly_Sales also increased (contrary to traditional economic theory).*

### The SQL (`mart_counter_cyclical.sql`)

```sql
WITH weekly_lag AS (
    SELECT
        f.store_id, f.partition_date, f.weekly_sales_amount_vnd, s.fuel_price_amount_vnd,
        LAG(f.weekly_sales_amount_vnd) OVER (
            PARTITION BY f.store_id ORDER BY f.partition_date) AS prev_sales,
        LAG(s.fuel_price_amount_vnd) OVER (
            PARTITION BY f.store_id ORDER BY f.partition_date) AS prev_fuel
    FROM fct_weekly_sales f
    JOIN dim_store s ON f.store_sk = s.store_sk   -- point-in-time, no fan-out
    WHERE f.is_invalid_sales = FALSE
),

growth_calculation AS (
    SELECT store_id, partition_date, weekly_sales_amount_vnd, fuel_price_amount_vnd,
        SAFE_DIVIDE(weekly_sales_amount_vnd - prev_sales, prev_sales) AS sales_growth_pct,
        SAFE_DIVIDE(fuel_price_amount_vnd - prev_fuel, prev_fuel)     AS fuel_growth_pct
    FROM weekly_lag
    WHERE prev_sales IS NOT NULL AND prev_fuel IS NOT NULL
      AND prev_sales > 0 AND prev_fuel > 0
)

SELECT *,
    CASE
        WHEN fuel_growth_pct > 0.10 THEN '>10% (n=3 store-weeks)'
        WHEN fuel_growth_pct > 0.05 THEN '5-10% (n=108 store-weeks)'
        ELSE '<=5%'
    END AS fuel_spike_bucket,
    CASE
        WHEN fuel_growth_pct > 0.05 AND sales_growth_pct >  0 THEN 'Counter-Cyclical (Resilient)'
        WHEN fuel_growth_pct > 0.05 AND sales_growth_pct <= 0 THEN 'Pro-Cyclical (Vulnerable)'
        ELSE 'Normal / Neutral'
    END AS economic_trend_type
FROM growth_calculation
```

### Size the evidence before telling the story

| | Count |
| --- | --- |
| Total store-weeks in scope | 6,387 |
| Fuel growth > 5% | **111** (27 of 45 stores, 24 distinct weeks) |
| Fuel growth > 10% | **3** (3 stores, **1 week**: 2021-10-08) |

That second row governs how strongly anything about a "10% threshold" can be phrased, which
is why `fuel_spike_bucket` ships as a column: the sample size travels with the number into
the dashboard.

### Findings

**1. The network absorbs moderate fuel inflation.** Across all 111 fuel-spike weeks, mean
sales growth was **+0.69%**, with a near-even split of 50.5% resilient to 49.5% vulnerable.
This is the "Net Sales Growth During Fuel Spikes" executive scorecard, and it reproduces
exactly (+0.6855%).

**2. The most fuel-exposed stores that still hold up -- measured honestly.** This is where a
first pass overstated the result, and the correction is worth showing:

| Store | Fuel-spike weeks | Mean growth, **all** weeks | Mean growth, **positive weeks only** |
| --- | --- | --- | --- |
| 38 | 9 | **+2.18%** | +5.15% |
| 33 | 15 | **+1.35%** | +9.39% |
| 42 | 14 | **+0.56%** | +9.21% |
| 10 | 15 | **-0.97%** | +7.67% |

The right-hand column averages only the weeks where sales happened to rise -- it conditions
on the outcome, and reports roughly **7x** the true effect. Store 33 is not a store that grows
9.4% under fuel stress; it is a store that grows 1.4% on average while being among the most
fuel-exposed in the network (15 spike weeks). Still a genuine finding, and a defensible one.
Store 38 is the honest leader.

**3. The 10% threshold is a hypothesis, not a finding.** All 3 observed store-weeks above +10%
fuel growth (2021-10-08, +12.7% fuel) were pro-cyclical, at -4.6%, -4.6% and -17.6% sales.
Directionally consistent with a breaking point -- but **n = 3, in a single week, across 3
stores**. That is enough to justify instrumenting an alert and watching it; it is not enough to
justify committing subsidy budget. Stating the sample size is the difference between an
insight and a costly guess.

---

## What the modelling choices bought

| Choice | Consequence when tested against the data |
| --- | --- |
| Event-log grain, no `LIMIT` in dbt | Same model yields Comeback Kings *and* Fail Kings; date filters keep working |
| Publish absolute **and** relative measures | Exposed that absolute ranking selects large stores (size rank 7 vs 27) |
| Baseline excludes the week under test | Negative anomalies detected rose from 2 to 10 |
| Retain both anomaly tails | Store 36's post-Black-Friday collapse became visible |
| Retain all fuel-spike weeks | Prevented a 7x overstatement of store resilience |
| Publish sample-size buckets | Turned a funding recommendation back into a hypothesis |
