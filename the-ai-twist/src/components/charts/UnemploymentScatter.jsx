import React, { useMemo } from 'react';
import Papa from 'papaparse';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import rawData from '../../data/unemployment_mock_data.csv?raw';

const UnemploymentScatter = ({ selectedStoreId }) => {
  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    return parsed.data.filter(row => row.store_id).map(row => ({
      ...row,
      x: row.unemployment_rate, // Already in percentage format (e.g., 8.5)
      y: row.weekly_resilience_index * 100 // Convert to percentage
    }));
  }, []);

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
      <h3 className="text-lg font-bold text-slate-900 mb-1 px-2">Unemployment Resilience (The Lipstick Effect)</h3>
      <p className="text-xs text-slate-500 mb-1 px-2 leading-relaxed">
        <strong>Definition (The Lipstick Effect):</strong> Identify "High Resilience" stores that maintain robust sales growth even when regional unemployment rates escalate beyond the network average of 8%, successfully capturing down-trading consumers.
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
