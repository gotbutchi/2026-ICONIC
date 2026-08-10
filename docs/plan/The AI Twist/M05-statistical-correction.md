# M05: Statistical Correction & Evidence Integrity

**Phase Objective:** Re-audit every number the dashboard asserts against the raw source, correct
the statistical logic upstream in dbt, and rebuild the frontend so that the honest reading of a
metric is always visible next to the flattering one.

**Trigger:** a self-review pass recomputed all published insights directly from
`raw/bia_data.csv` rather than re-reading the dashboard. Four headline claims did not survive.
The failures were not frontend bugs — they were **model-layer and interpretation errors that the
frontend faithfully rendered**, which is the harder class to catch.

---

## ⚠️ Constraint added to the plan

This module adds a fifth architectural constraint to those in the
[plan README](README.md), and it is the one that would have prevented all four errors:

### 5. Evidence Integrity (No Unsourced Numbers)
- **Rule:** Do NOT display a figure in the UI that cannot be reproduced from
  `raw/bia_data.csv`. Do NOT quote a threshold, average or ranking without its sample size.
- **Action:** Every published number must be reproducible via
  `scripts/verify_insights.py`, which rebuilds the whole pipeline in DuckDB independently of
  BigQuery. Where a metric depends on a methodological choice (which baseline? absolute or
  relative?), **ship both and let the user toggle** rather than silently picking the favourable
  one.

Note how this extends constraint 4 (Bias Prevention). Constraint 4 stopped the *extraction*
from hiding outliers. It did not stop the *interpretation* from conditioning on the outcome —
which is what happened.

---

## 1. What was wrong, and why the UI could not have caught it

| Published claim | Verified reality | Root cause |
| --- | --- | --- |
| "80% of top-10 spikes are Black Friday" — framed as *the* seasonal pattern | True of the top 10 by z-score, but the **pre-Christmas week moves 40 of 45 stores** vs Black Friday's 35, and repeats at 38 stores in 2020 | Ranked by peak intensity, then reported as if it were breadth |
| "Stores 33 & 42 grew +9.39% / +9.21% under fuel stress" | **+1.35% / +0.56%** across *all* their fuel-spike weeks | Averaged only the weeks where sales rose — conditioning on the outcome, ~7x overstatement |
| "10% fuel growth is the critical threshold — deploy subsidies" | Directionally consistent, but **n = 3 store-weeks, 1 week, 3 stores** | A pattern reported without its sample size |
| "Store 35 holds a 130% Resilience Index" | 126% on an all-period baseline; **99.4%** on a trailing 52-week baseline | Baseline looked ahead and did not detrend — a growth trend read as downturn resilience |

Additionally, the upstream anomaly model scored each week against a baseline that **included
that week**, inflating sigma and suppressing detection: negative anomalies detected rose from
**2 to 10**, and peak sigma from 5.72 to **12.88**, once the frame was corrected to
`ROWS BETWEEN 52 PRECEDING AND 1 PRECEDING`.

---

## 2. Fixes shipped upstream (dbt), so the frontend cannot re-tell the wrong story

| Model | Change |
| --- | --- |
| `mart_anomaly_detection` | Baseline window excludes the week under test. Publishes `baseline_weeks`, `has_full_52w_baseline` (a full 52-week baseline only exists from 2020-01-31) and a single `requires_investigation` triage boolean |
| `mart_comeback_king` | Publishes `pct_comeback_growth` alongside the absolute measure |
| `mart_unemployment_sales_impact` | Publishes **both** `resilience_index_alltime` and `resilience_index_trailing` |
| `mart_counter_cyclical` | Publishes `fuel_spike_bucket`, carrying n into the BI layer |
| `dim_date` | Publishes `is_pre_christmas_week` / `is_trading_peak_week`, correcting the source flag that marks the week *after* Christmas and misses the peak week *before* it |
| `stg_weekly_sales` | Corrected date recovery (`2019-06-14`, not `2019-12-14`), `SAFE_CAST` throughout, `sales_quality_code` reason codes |

---

## 3. Frontend changes (`the-ai-twist/`)

| Component | Change | Why it matters for the story |
| --- | --- | --- |
| `UnemploymentScatter.jsx` | **Baseline toggle** (trailing 52w — default — vs all-period) | Makes the Store 35 correction a *demonstrable* interaction rather than a footnote. Switch the dropdown and watch 126% become 99.4% |
| `ComebackBlock.jsx` / `FailBlock.jsx` | **Ranking toggle** (VND vs % size-neutral); both measures always shown as columns; filter on `ranked_by` | Shows that absolute ranking selects big stores (avg size rank 7 of 45 vs 27), and that Store 14 survives both tests |
| `Scorecard.jsx` | Reports the **whole feed** (6.74bn ₫, 143 weeks) instead of a truncated "Oct 2021 month" that actually ended on the 22nd. Adds a like-for-like growth KPI (+1.8%, same Feb–Oct window, per store-week) | The previous scorecard labelled a partial period as a month |
| `ExecutiveSummary.jsx` | Rewritten on verified figures; each macro claim carries its sample size | This is the first thing a C-level reader sees |
| `App.jsx` insight cards | All four corrected; the anomaly card now states both intensity and breadth | |
| `AgenticChatbot.jsx` | **"UI Prototype" badge + explicit disclosure** that it is scripted, not connected to an LLM or BigQuery | It is the README hero image; a reviewer clicking it must not feel misled |

## 4. Pipeline changes (`scripts/`)

- **`verify_insights.py` (new):** independent DuckDB reproduction of the entire pipeline from
  the raw CSV. This is the artifact that found the errors.
- **`export_data.py`:** exports both baselines and both rankings; adds `spike_weeks.csv`
  (breadth-per-week), `lfl_growth.csv` (like-for-like), `data_quality_log.csv` (every excluded
  row and why). The no-selection-bias rule is now a comment at the top of the file.

---

## 5. Acceptance criteria

- [x] Every figure in the UI reproducible from `raw/bia_data.csv` via `verify_insights.py`
- [x] BigQuery and DuckDB agree exactly (169 spikes, 10 drops, 12.88 peak sigma)
- [x] `dbt build` green: 10 models, **74 tests**, 85/85 passing
- [x] `accepted_values` tests on every label string the dashboard filters on, so a renamed
      category fails the build instead of silently emptying a chart
- [x] Every metric with a methodological choice exposes that choice as a UI control
- [x] Prototype scope disclosed in the interface, the README and `stage3.md`
- [x] `npm run build` clean

## 6. Human-in-the-Loop Interventions

1. **Reviewed my own output, not just the AI's.** The AI-generated components were correct;
   the numbers they rendered were not. Cross-validating the dashboard against the *source*
   rather than against Looker Studio is what surfaced this — agreement between two views of
   the same wrong query proves nothing.
2. **Rejected a redundant column.** A first cut of the anomaly model shipped both
   `anomaly_type` and an `anomaly_context` label that restated the same three states plus one
   new split. Collapsed to a single `requires_investigation` boolean carrying only the new
   information — one column, one job.
3. **Chose additive changes over the textbook refactor.** `dim_store` should really be split
   into a static dimension plus a weekly economics fact. A live Looker dashboard reads those
   columns, so the change was kept additive and the trade-off recorded in `stage1.md` rather
   than silently taken.
4. **Kept the legacy column name.** `weekly_resilience_index` is retained as an alias so
   existing dashboard fields keep resolving while the corrected measure ships beside it.
