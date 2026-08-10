import React, { useMemo } from 'react';
import Papa from 'papaparse';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Scorecard from '../ui/Scorecard';
import InsightCard from '../ui/InsightCard';
import rawTrendData from '../../data/weekly_trend.csv?raw';
import rawTopStoresData from '../../data/top_10_stores.csv?raw';

export default function OverallPerformance() {
  const trendData = useMemo(() => {
    return Papa.parse(rawTrendData, { header: true, dynamicTyping: true }).data.filter(row => row.partition_date);
  }, []);

  const topStoresData = useMemo(() => {
    return Papa.parse(rawTopStoresData, { header: true, dynamicTyping: true }).data.filter(row => row.store_id);
  }, []);

  const formatCurrency = (val) => {
    return (val / 1000000).toFixed(0) + 'M';
  };

  return (
    <section className="bg-white p-6 rounded-lg shadow-sm border border-slate-200 mb-12" data-tour="step-3">
      <h2 className="text-xl font-bold text-slate-900 mb-6 uppercase tracking-wide">I. Overall Performance</h2>
      
      {/* Scorecard Component */}
      <Scorecard />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 border-t border-slate-100 pt-8">
        
        <div className="lg:col-span-2 flex flex-col gap-8">
          {/* Line Chart */}
          <div className="h-[350px] flex flex-col">
          <h3 className="text-sm font-semibold text-slate-700 uppercase">Weekly Sales Trend (VND)</h3>
          <p className="text-xs text-slate-500 mb-4 italic">Time between 2019-2021: Unfiltered macro trend showing weekly volume seasonality across the network</p>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="partition_date" 
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', year: '2-digit'})}
                stroke="#94a3b8"
                fontSize={12}
                minTickGap={30}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="#94a3b8"
                fontSize={12}
              />
              <Tooltip 
                formatter={(value) => [value.toLocaleString() + ' ₫', 'Sales']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line type="monotone" dataKey="total_weekly_sales" stroke="#1e293b" strokeWidth={2} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-[350px] flex flex-col">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 uppercase">Top 10 Stores by Sales Volume</h3>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topStoresData} margin={{ top: 5, right: 0, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="store_id" stroke="#94a3b8" fontSize={12} />
              <YAxis tickFormatter={formatCurrency} stroke="#94a3b8" fontSize={12} width={40} />
              <Tooltip formatter={(value) => [value.toLocaleString() + ' ₫', 'Sales']} cursor={{fill: '#f1f5f9'}} />
              <Bar dataKey="total_sales" fill="#1e293b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Insight Card */}
        <div className="lg:col-span-1">
          <InsightCard 
            title="Macro Trend & Network Pareto"
            description="Extreme Q4 Seasonality & Revenue Concentration: Network sales exhibit predictable macro-spikes in late Q4 (Nov-Dec), driven by holiday shopping, followed by sharp post-holiday slumps in early Q1.

Furthermore, revenue distribution follows a steep Pareto principle—the Top 10 stores (led by Store 20 and Store 4) generate over 40% of total network volume, serving as the primary revenue anchors for the entire 45-store footprint."
          />
        </div>
      </div>
    </section>
  );
}
