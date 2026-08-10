import React, { useMemo, useState } from 'react';
import Papa from 'papaparse';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import rawData from '../../data/unemployment_mock_data.csv?raw';

const UnemploymentScatter = ({ selectedStoreId }) => {
  // The baseline is not a cosmetic choice: an all-period average looks ahead and
  // does not detrend, so a store that simply grew scores above 100% regardless of
  // unemployment. Toggling to the trailing baseline moves Store 35 from 126% to
  // 99.4%. Both ship in the mart so the difference stays auditable.
  const [baseline, setBaseline] = useState('trailing');

  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    const key = baseline === 'trailing' ? 'resilience_index_trailing' : 'resilience_index_alltime';
    return parsed.data
      .filter(row => row.store_id && row[key])
      .map(row => ({
        ...row,
        x: row.unemployment_rate, // Already in percentage format (e.g., 8.5)
        y: row[key] * 100 // Convert to percentage
      }));
  }, [baseline]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 shadow-lg text-sm border border-slate-700">
          <p className="font-bold mb-1">Store {d.store_id}</p>
          <p>Date: {new Date(d.partition_date).toLocaleDateString()}</p>
          <p>Unemployment Rate: {d.x.toFixed(2)}%</p>
          <p>Resilience Index: {d.y.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-1 px-2">
        <h3 className="text-lg font-bold text-slate-900">Unemployment Resilience (The Lipstick Effect)</h3>
        <select
          value={baseline}
          onChange={(e) => setBaseline(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-sm rounded px-2 py-1 text-slate-700 focus:outline-none focus:border-emerald-500"
        >
          <option value="trailing">Baseline: trailing 52w (causal)</option>
          <option value="alltime">Baseline: all-period avg</option>
        </select>
      </div>
      <p className="text-xs text-slate-500 mb-1 px-2 leading-relaxed">
        <strong>Definition:</strong> stores that hold sales when their own regional unemployment exceeds their
        mean + 1σ, i.e. that capture down-trading consumers. <strong>Switch the baseline</strong> to see why the
        measure matters: Store 35 reads 126% against its whole-period average but 99.4% against a trailing
        52-week average — the first looks ahead and does not detrend.
      </p>
      <p className="text-xs text-slate-500 mb-4 px-2 italic">(🟢 High Resilience | 🔴 Low Resilience | X-axis: Unemployment % | Y-axis: Resilience Index)</p>
      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Unemployment %" 
              tickFormatter={(val) => `${val}%`}
              stroke="#64748b"
              label={{ value: 'Unemployment %', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Resilience Index %" 
              tickFormatter={(val) => `${val}%`}
              stroke="#64748b"
              label={{ value: 'Resilience Index %', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: '100% Baseline', fill: '#10b981', fontSize: 12 }} />
            
            <Scatter name="Resilience" data={data}>
              {data.map((entry, index) => {
                const isHighlight = selectedStoreId && selectedStoreId !== 'None' && entry.store_id.toString() === selectedStoreId.toString();
                const isFaded = selectedStoreId && selectedStoreId !== 'None' && !isHighlight;
                const opacity = isFaded ? 0.2 : (isHighlight ? 1 : 0.8);
                
                let color = '#94a3b8';
                if (entry.y >= 100) color = '#10b981';
                else if (entry.y < 80) color = '#f43f5e';
                
                if (isHighlight) color = '#8b5cf6';

                return <Cell key={`cell-${index}`} fill={color} fillOpacity={opacity} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UnemploymentScatter;
