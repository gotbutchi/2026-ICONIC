import React, { useMemo } from 'react';
import Papa from 'papaparse';
import rawData from '../../data/overall_kpis.csv?raw';

export default function Scorecard() {
  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    return parsed.data[0] || {}; // Take the first row
  }, []);

  const formatCurrency = (val) => {
    if (!val) return '0M ₫';
    return (val / 1000000).toFixed(1) + 'M ₫';
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
        <p className="text-sm text-slate-500 italic flex-1">Scorecard Figures filtered for Oct 1 - Oct 31, 2021 baseline evaluation</p>
        <div className="flex flex-col w-full md:w-auto">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">Date Range (KPIs):</label>
          <select className="bg-white border border-slate-300 text-sm rounded px-3 py-1.5 text-slate-900 shadow-sm focus:outline-none" disabled>
            <option>Oct 1 - Oct 31, 2021</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* KPI 1: Total Sales */}
        <div className="p-4 border-l-4 border-emerald-500 bg-slate-50 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">KPI 1: Total Sales (VND)</p>
          <p className="text-3xl font-light text-slate-900">{formatCurrency(data.total_sales)}</p>
        </div>

        {/* KPI 2: Active Stores */}
        <div className="p-4 border-l-4 border-slate-300 bg-slate-50 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">KPI 2: Unique Active Stores</p>
          <p className="text-3xl font-light text-slate-900">{data.unique_stores || 0}</p>
        </div>

        {/* KPI 3: Avg Weekly Sales */}
        <div className="p-4 border-l-4 border-slate-300 bg-slate-50 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">KPI 3: Avg Weekly Sales / Store</p>
          <p className="text-3xl font-light text-slate-900">{formatCurrency(data.avg_weekly_sales_per_store)}</p>
        </div>
      </div>
    </div>
  );
}
