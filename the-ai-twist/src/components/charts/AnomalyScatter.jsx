import React, { useMemo } from 'react';
import Papa from 'papaparse';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import rawData from '../../data/anomaly_detection_mock_data.csv?raw';

const AnomalyScatter = ({ selectedStoreId }) => {
  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    // Transform to { x, y, z, ... } shape for Recharts
    return parsed.data.filter(row => row.store_id).map(row => ({
      ...row,
      x: row.rolling_52w_avg,
      y: row.z_score,
      z: row.weekly_sales_amount_vnd // For bubble size
    }));
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 shadow-lg text-sm border border-slate-700">
          <p className="font-bold mb-1">Store {d.store_id} - {d.anomaly_type}</p>
          <p>Date: {new Date(d.partition_date).toLocaleDateString()}</p>
          <p>Z-Score: {d.y.toFixed(2)}</p>
          <p>Weekly Sales: {d.weekly_sales_amount_vnd?.toLocaleString()} VND</p>
          <p>52w Baseline: {d.x?.toLocaleString()} VND</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-1 px-2">Anomaly Detection (Flash Sales vs Drops)</h3>
      <p className="text-xs text-slate-500 mb-1 px-2 leading-relaxed">
        <strong>Definition:</strong> Flag every "Flash Sale" week—any week where a store's sales were &gt; 3 standard deviations above its own 52-week rolling average.
      </p>
      <p className="text-xs text-slate-500 mb-4 px-2 italic">(🟢 Positive Spike | 🔴 Negative Drop | X-axis: 52-Week Baseline | Y-axis: Z-Score)</p>
      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="52w Avg Baseline" 
              tickFormatter={(val) => `${(val/1000000).toFixed(0)}M`}
              stroke="#64748b"
              label={{ value: '52-Week Baseline Sales (VND)', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Z-Score" 
              stroke="#64748b"
              domain={['auto', 'auto']}
              label={{ value: 'Z-Score Volatility', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            <ReferenceLine y={3} stroke="#10b981" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: '+3σ Spike', fill: '#10b981', fontSize: 12 }} />
            <ReferenceLine y={-3} stroke="#f43f5e" strokeDasharray="3 3" label={{ position: 'insideBottomRight', value: '-3σ Drop', fill: '#f43f5e', fontSize: 12 }} />
            
            <Scatter name="Anomalies" data={data}>
              {data.map((entry, index) => {
                const isHighlight = selectedStoreId && selectedStoreId !== 'None' && entry.store_id.toString() === selectedStoreId.toString();
                const isFaded = selectedStoreId && selectedStoreId !== 'None' && !isHighlight;
                const opacity = isFaded ? 0.2 : (isHighlight ? 1 : 0.7);
                const color = isHighlight ? '#8b5cf6' : (entry.y > 0 ? '#10b981' : '#f43f5e');
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={opacity} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnomalyScatter;
