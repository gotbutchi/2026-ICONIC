import React from 'react';
import { Target, Zap } from 'lucide-react';

export default function ExecutiveSummary() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 border border-slate-200 p-6 shadow-sm mb-12">
      {/* Column 1: Summary */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-slate-700" />
          <h2 className="text-lg font-bold text-slate-900 uppercase tracking-wide">Executive Summary</h2>
        </div>
        <ul className="space-y-3 text-sm text-slate-700 leading-relaxed list-disc list-inside">
          <li>
            <strong>Network Stability:</strong> A flat 45-store footprint generated 6.74bn ₫ across 143 trading
            weeks, so all growth is organic rather than expansion-driven. Like-for-like sales per store-week rose
            <strong> +1.8%</strong> (2021 vs 2019, identical Feb–Oct window). The network absorbs moderate fuel
            inflation, averaging <strong>+0.69%</strong> sales growth across all 111 weeks where fuel rose more than 5%.
          </li>
          <li>
            <strong>The Calendar Runs the Business:</strong> 169 store-weeks breach +3σ, and they are not spread
            evenly. Black Friday week is the most <em>intense</em> (all top-10 spikes, peaking at 12.9σ) while the
            pre-Christmas week is the most <em>broad</em> — 40 of 45 stores in 2019, repeating with 38 stores in
            2020. A pattern that recurs in consecutive years is a plannable one.
          </li>
          <li>
            <strong>A Flag That Inverts the Truth:</strong> the source <code>Is_holiday_week</code> field marks the
            week after Christmas (0.86× an average week — below average) and misses the week before it
            (1.72× — the single largest trading week on record). Segmenting on the raw flag would suggest
            Christmas suppresses sales.
          </li>
          <li>
            <strong>Macro Vulnerability — Stated Honestly:</strong> above +10% fuel inflation every observed store
            turned pro-cyclical, but that rests on <strong>3 store-weeks in a single week (2021-10-08)</strong>.
            It is a hypothesis to monitor, not a threshold to fund.
          </li>
        </ul>
      </div>

      {/* Column 2: Actions */}
      <div className="border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-emerald-800 uppercase tracking-wide">Strategic Actions to Take</h2>
        </div>
        <ul className="space-y-3 text-sm text-slate-700 leading-relaxed list-decimal list-inside">
          <li>
            <strong>Plan Inventory Around the Broad Peak, Not Just the Loud One:</strong> the pre-Christmas week
            moves 40 of 45 stores in both years; Black Friday moves fewer stores harder. Buy depth for December
            and concentrate promotional intensity on Black Friday, weighting Tier-2 branches (Store 29 hit 12.9σ,
            nearly doubling its own baseline) where relative elasticity is highest.
          </li>
          <li>
            <strong>Fix the Trading Calendar Before Trusting Any Seasonality Cut:</strong> adopt
            <code> dim_date.is_trading_peak_week</code> and source a real promo calendar
            (<code>dim_marketing_spend</code>). Until then, every holiday-versus-normal comparison in the business
            is measuring the wrong weeks.
          </li>
          <li>
            <strong>Investigate 10 Stores, Not 2:</strong> excluding the week under test from its own baseline
            raised detected negative anomalies from 2 to 10. Store 16 (−3.6σ) and Store 35's three-week
            September 2019 slide are now visible and warrant an operational audit.
          </li>
          <li>
            <strong>Re-test the &ldquo;Lipstick Effect&rdquo; Before Acting On It:</strong> Store 35's 126%
            resilience is a trend artifact — against a trailing 52-week baseline it is 99.4%, i.e. no downturn
            advantage at all. The genuine performers are Store 7 (114.9% over 27 weeks) and Store 16 (107.7% over
            48 weeks, the largest sample). Audit those product mixes instead.
          </li>
        </ul>
      </div>
    </div>
  );
}
