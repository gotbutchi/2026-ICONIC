import React, { useMemo } from 'react';
import Papa from 'papaparse';
import rawData from '../../data/overall_kpis.csv?raw';
import rawLfl from '../../data/lfl_growth.csv?raw';

export default function Scorecard() {
  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    return parsed.data[0] || {};
  }, []);

  // Like-for-like growth: identical Feb 1 - Oct 22 window each year, compared per
  // store-week so an unequal number of trading weeks cannot distort it.
  const lfl = useMemo(() => {
    const rows = Papa.parse(rawLfl, { header: true, dynamicTyping: true }).data.filter(r => r.year_num);
    if (rows.length < 2) return null;
    const first = rows[0];
    const last = rows[rows.length - 1];
    return {
      from: first.year_num,
      to: last.year_num,
      pct: ((last.avg_sales_per_store_week / first.avg_sales_per_store_week) - 1) * 100,
    };
  }, []);

  const formatBn = (val) => (!val ? '0 ₫' : (val / 1000000000).toFixed(2) + 'bn ₫');
  const formatM = (val) => (!val ? '0 ₫' : (val / 1000000).toFixed(2) + 'M ₫');

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <p className="text-sm text-slate-500 italic flex-1">
          Full feed: {data.first_week} to {data.last_week} ({data.total_weeks} complete trading weeks).
          Rows failing data-quality checks are excluded, never silently dropped.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* KPI 1: Total Sales */}
        <div className="p-4 border-l-4 border-emerald-500 bg-slate-50 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Total Sales (VND)</p>
          <p className="text-3xl font-light text-slate-900">{formatBn(data.total_sales)}</p>
        </div>

        {/* KPI 2: Active Stores */}
        <div className="p-4 border-l-4 border-slate-300 bg-slate-50 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Active Stores</p>
          <p className="text-3xl font-light text-slate-900">{data.unique_stores || 0}</p>
          <p className="text-xs text-slate-400 mt-1">Flat all period — growth is organic, not expansion</p>
        </div>

        {/* KPI 3: Avg Weekly Sales */}
        <div className="p-4 border-l-4 border-slate-300 bg-slate-50 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Avg Weekly Sales / Store</p>
          <p className="text-3xl font-light text-slate-900">{formatM(data.avg_weekly_sales_per_store)}</p>
        </div>

        {/* KPI 4: Like-for-like growth */}
        <div className="p-4 border-l-4 border-slate-300 bg-slate-50 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">
            Like-for-Like Growth
          </p>
          <p className="text-3xl font-light text-slate-900">
            {lfl ? (lfl.pct > 0 ? '+' : '') + lfl.pct.toFixed(1) + '%' : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-1">
            {lfl ? `${lfl.from} vs ${lfl.to}, per store-week, same Feb–Oct window` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}
