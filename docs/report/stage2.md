# Stage 2: Advanced SQL Intelligence - Detailed Report

**Goal:** Use complex logic to find "hidden" stories.

## 1. The "Comeback King"
*Identify the store that achieved the highest cumulative sales growth in the 4 weeks immediately following a week of negative or zero growth.*

### SQL Implementation Strategy (`mart_comeback_king.sql`)
The logic uses `LAG()` to detect negative growth weeks (`is_negative_growth = TRUE`), followed by a window frame `SUM(...) OVER (PARTITION BY store_id ORDER BY partition_date ROWS BETWEEN 1 FOLLOWING AND 4 FOLLOWING)` to calculate the subsequent 4-week recovery.

**Data Mart Design Choice:** While the challenge specifically asks to identify *"the"* single store with the highest recovery, hardcoding `LIMIT 1` at the data model layer restricts downstream BI flexibility. Instead, this mart outputs an Event-Log containing all recovery events, deferring the ranking to the BI layer.

### The Insight (Store 14 Case Study)
By preserving all negative growth events rather than filtering, we uncovered that **Store 14** is the system's most volatile location. It recorded both the highest recovery (Comeback King in Feb 2019 with +4.37M) and the deepest continued decline (Fail King in Dec 2019 with -3.89M). 
* *The Feb 2019 Comeback:* A massive post-clearance recovery following a brief drop in early February.
* *The Dec 2019 Decline:* A classic "Post-Holiday Slump". The 4 weeks following Dec 27 plummeted compared to the massive 4-week holiday peak preceding it. This indicates extreme vulnerability to seasonality rather than operational failure.

---

## 2. Statistical Anomaly Detection
*Flag every "Flash Sale" week—any week where a store's sales were > 3 standard deviations above its own 52-week rolling average.*

### SQL Implementation Strategy (`mart_anomaly_detection.sql`)
To identify true "Flash Sale" weeks without being misled by overall store sizes, we implemented a **52-week Rolling Z-Score** calculation using dbt Window Functions (`AVG` and `STDDEV_SAMP` over `51 PRECEDING AND CURRENT ROW`). A week is flagged as a **Flash Sale (Positive Anomaly)** if its sales exceed $3$ standard deviations above its own baseline ($Z\text{-score} > 3$). We also expanded the model to capture two-sided anomalies (Critical Drops where $Z < -3$).

### Key Findings & Executive Insights
1. **Dominance of Black Friday:** The statistical anomaly log reveals an undeniable pattern—**80% of the top 10 Flash Sale events occurred simultaneously on November 22, 2019**. This proves that company-wide seasonal campaigns like Black Friday drive extraordinary multi-sigma bumps ($> 5\sigma$) across nearly all retail branches.
2. **Highest Elasticity in Tier-2 Stores:** While flagship stores like **Store 4** generated the highest absolute revenue ($2.78\text{M}$ VND), smaller branches like **Store 29** achieved the highest relative anomaly rating ($Z = 5.72$), nearly doubling its 52-week baseline ($538\text{K} \rightarrow 975\text{K}$ VND).
3. **Reverse Insight (Critical Drops):** We identified severe operational drops, such as **Store 36 on Nov 29, 2019** ($Z = -3.01$). While other stores experienced Black Friday spikes on this date, Store 36 suffered an unexpected severe drop, highlighting a potential localized operational failure (e.g., inventory stockout or POS system failure) that requires immediate audit.

---

## 3. Counter-Cyclical Trends
*Identify stores where Fuel_Price rose by >5% while Weekly_Sales also increased (contrary to traditional economic theory).*

### SQL Implementation Strategy (`mart_counter_cyclical.sql`)
Designed as an Event-Log Fact Table, it calculates `sales_growth_pct` and `fuel_growth_pct` week-over-week using `LAG()`. Instead of filtering out data, it classifies each week into an `economic_trend_type`:
* `Counter-Cyclical (Resilient)`: Fuel grew >5% AND Sales grew (Defying economic theory).
* `Pro-Cyclical (Vulnerable)`: Fuel grew >5% AND Sales dropped (Sensitive to inflation).
* `Normal / Neutral`: All other scenarios.

### Macro-Economic Resilience Insights
1. **The "Iron Wall" Stores (Store 33 & 42):** These locations demonstrate absolute inelasticity to fuel inflation. During fuel price shocks averaging $+6.5\%$, Store 33 and 42 astonishingly grew their sales by $+9.39\%$ and $+9.21\%$ respectively. This indicates they operate in highly affluent demographics or carry a highly essential product mix.
2. **The Critical Vulnerability Threshold (>10% Fuel Growth):** When fuel price increases stay within the $5\% - 8\%$ range, the network maintains a healthy distribution of resilient stores. However, when fuel prices suffer a "thermal shock" exceeding $+12\%$, retail resilience completely collapses. Every single store plunges into "Pro-Cyclical" vulnerability. This defines **10%** as the absolute critical threshold where Executive Management must deploy system-wide price subsidies.
3. **The Absolute Champion of Unemployment (Store 35):** Store 35 secured the Top 1 rank with an incredible Resilience Index of $130\%$. Over 21 distinct weeks of high unemployment, its sales actually surged. This indicates that Store 35 benefits from the "Lipstick Effect" or consumer down-trading (attracting shoppers who abandoned more expensive competitors during economic downturns).
