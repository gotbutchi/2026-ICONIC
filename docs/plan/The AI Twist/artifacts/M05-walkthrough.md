# M05: Statistical Correction Walkthrough

**Phase Objective:** Re-verify every published number against `raw/bia_data.csv`, fix the
statistical logic in the dbt layer, and rebuild the frontend so a metric's methodological
choice is visible to the user rather than decided silently for them.

## Execution Summary

1. **Built an independent verification harness** (`scripts/verify_insights.py`). Rather than
   re-reading the dashboard, the full pipeline — staging, star schema, all five marts — was
   reimplemented in DuckDB directly against the raw CSV, printing every figure quoted in the
   reports. Cross-validating a dashboard against another view of the *same query* proves
   nothing; only an independent recomputation from source does.
2. **Audited the raw file exhaustively.** Confirmed 6,435 rows = 45 stores x 143 weeks, every
   week ending Friday, no duplicate (store, week) pairs. Isolated exactly 4 data-quality
   defects.
3. **Corrected the date recovery.** The published fix mapped `14/13/2019` to `2019-12-14` — a
   **Saturday**, the only off-cadence date in 144. Triangulated the true value as `2019-06-14`
   from three independent directions: store 42's single sequence gap, its unemployment value
   (`9.524`, which occurs only Mar–Jun 2019), and its CPI (`126.114`, interpolating exactly
   between 06-07 and 06-21).
4. **Fixed the anomaly window frame**, the highest-impact change: the baseline had included the
   week being scored.
5. **Recomputed all five commercial insights** and rewrote every one that did not hold.
6. **Pushed each fix upstream into dbt**, not just into the prose, so the frontend cannot
   re-present the flattering version.
7. **Rebuilt BigQuery** (`dbt build --full-refresh`) so the live Looker dashboard reads
   corrected logic, then re-exported all frontend CSVs.
8. **Rebuilt and verified the React app** (`npm run build` clean).

## Technical Highlights

1. **The window frame was masking most operational incidents.** `ROWS BETWEEN 51 PRECEDING AND
   CURRENT ROW` puts the observation inside its own baseline, dragging the mean toward the
   outlier and inflating sigma. Correcting to `52 PRECEDING AND 1 PRECEDING`: positive
   anomalies 151 → **169**, negative anomalies **2 → 10**, peak sigma 5.72 → **12.88**. A
   monitoring system that reports 2 incidents in three years looks healthy and is in fact
   blind in one eye.
2. **A source flag that inverts the commercial truth (DQ-4).** `Is_holiday_week` marks the week
   ending 2019-12-27 (0.86x an average week — *below* average) and misses 2019-12-20 (1.72x —
   the largest trading week on record). Same inversion in 2020. It passes every schema test:
   no nulls, no type errors, no duplicates. Added `is_pre_christmas_week` and
   `is_trading_peak_week` to `dim_date`.
3. **Conditioning on the outcome, quantified.** "Iron Wall" stores averaged +9.39% / +9.21%
   *when only their positive weeks were counted*, versus **+1.35% / +0.56%** across all their
   fuel-spike weeks — a ~7x overstatement. Store 38 is the honest leader at +2.18%.
4. **Baseline choice reversed a conclusion.** Store 35's "Lipstick Effect" reads 126% against
   an all-period average but **99.4%** against a trailing 52-week average: the all-period
   baseline looks ahead and does not detrend, so a growth trend was being read as downturn
   resilience. The genuine performers are Store 7 (114.9%, 27 weeks) and Store 16 (107.7%, 48
   weeks — largest sample). Both indices now ship, and the chart exposes the choice as a
   dropdown.
5. **Sample size as a first-class column.** Only **3 store-weeks** in the entire dataset exceed
   +10% fuel growth — all on 2021-10-08, across 3 stores. `fuel_spike_bucket` carries n into
   the BI layer so the threshold cannot be quoted bare. This downgraded a subsidy
   *recommendation* back to a *hypothesis*.
6. **Absolute vs relative ranking, made visible.** Top-10 comebacks by VND average a store-size
   rank of 7 of 45; by percentage, 27. Both measures ship and both blocks expose a ranking
   toggle. Store 14 leads on both, so the headline is robust rather than an artifact.
7. **Test coverage tripled where it mattered.** 22 → **74 tests**. Previously *zero* tests
   existed on the five marts powering every insight. Added `accepted_values` on the exact label
   strings the dashboard filters on, a Friday-cadence assertion (the test that would have
   caught the original date fix), `unique_combination_of_columns` on the fact grain, and
   `valid_from < valid_to` on the SCD2 windows. `dbt build`: **85/85 passing**.
8. **Two engines, one answer.** DuckDB and BigQuery agree exactly on 169 spikes, 10 drops and
   12.88 peak sigma — the strongest available evidence that neither the SQL nor the harness is
   wrong.

## Human-in-the-Loop Interventions

1. **The most valuable review was of my own work.** The AI's React components rendered exactly
   what they were given; the defects were in the model logic and in how I interpreted the
   output. Four of five headline insights needed correcting. Recomputing from source, rather
   than admiring the dashboard, is what found them.
2. **Rejected redundancy in my own first fix.** The corrected anomaly model initially shipped
   `anomaly_type` *and* an `anomaly_context` label that restated the same three states plus one
   new split. Collapsed to a `requires_investigation` boolean carrying only the new
   information.
3. **Chose the additive path deliberately.** `dim_store` versions weekly because the source
   re-publishes the indicators weekly — so it is a point-in-time snapshot, not a classic SCD2.
   The correct refactor (static dimension + weekly economics fact) was deferred because a live
   dashboard reads those columns; the trade-off is documented in `stage1.md` rather than hidden,
   and `weekly_resilience_index` is retained as an alias so existing fields keep resolving.
4. **Disclosed prototype scope.** The chat panel now carries a "UI Prototype" badge and an
   explicit note that it is scripted. It is the README hero image, and a reviewer clicking it
   should never feel misled.

## Validated Outcomes

| Criterion | Result |
| --- | --- |
| Every UI figure reproducible from raw source | ✅ via `scripts/verify_insights.py` |
| BigQuery ↔ DuckDB agreement | ✅ exact (169 / 10 / 12.88) |
| `dbt build` | ✅ 10 models, 74 tests, **85/85 pass** |
| Mart-level test coverage | ✅ 0 → 24 assertions across the 5 marts |
| Methodological choices exposed as UI controls | ✅ baseline toggle, ranking toggle |
| Prototype scope disclosed | ✅ UI badge, README, `stage3.md` |
| `npm run build` | ✅ clean (820 kB bundle) |
| Corrected insights are *better* than the originals | ✅ a pattern recurring across two Decembers beats one that peaked once |
