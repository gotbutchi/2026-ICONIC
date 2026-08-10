import React, { useMemo } from 'react';
import Papa from 'papaparse';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import rawData from '../../data/counter_cyclical_mock_data.csv?raw';

const FuelElasticityMatrix = ({ selectedStoreId }) => {
  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    return parsed.data.filter(row => row.store_id).map(row => ({
      ...row,
      x: row.fuel_growth_pct * 100, // Convert to percentage
      y: row.sales_growth_pct * 100
    }));
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 shadow-lg text-sm border border-slate-700">
          <p className="font-bold mb-1">Store {d.store_id} - {d.economic_trend_type}</p>
          <p>Date: {new Date(d.partition_date).toLocaleDateString()}</p>
          <p>Fuel Inflation: +{d.x.toFixed(2)}%</p>
          <p>Sales Growth: {d.y > 0 ? '+' : ''}{d.y.toFixed(2)}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-full bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-1 px-2">Fuel Price Elasticity Matrix</h3>
      <p className="text-xs text-slate-500 mb-1 px-2 leading-relaxed">
        <strong>Definition (Counter-Cyclical Trends):</strong> Identify stores where Fuel Price rose by &gt;5% while Weekly Sales also increased (contrary to economic theory).
      </p>
      <p className="text-xs text-slate-500 mb-4 px-2 italic">(🟢 Resilient | 🔴 Vulnerable | X-axis: Fuel Growth | Y-axis: Sales Growth)</p>
      <div className="flex-1 min-h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              dataKey="x" 
              name="Fuel Growth %" 
              tickFormatter={(val) => `${val}%`}
              stroke="#64748b"
              label={{ value: 'Fuel Growth %', position: 'insideBottom', offset: -10, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis 
              type="number" 
              dataKey="y" 
              name="Sales Growth %" 
              tickFormatter={(val) => `${val}%`}
              stroke="#64748b"
              label={{ value: 'Sales Growth %', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            
            <ReferenceLine x={10} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: '10% Vulnerability Threshold', fill: '#f59e0b', fontSize: 12 }} />
            <ReferenceLine y={0} stroke="#64748b" />
            
            <Scatter name="Elasticity" data={data}>
              {data.map((entry, index) => {
                const isHighlight = selectedStoreId && selectedStoreId !== 'None' && entry.store_id.toString() === selectedStoreId.toString();
                const isFaded = selectedStoreId && selectedStoreId !== 'None' && !isHighlight;
                const opacity = isFaded ? 0.2 : (isHighlight ? 1 : 0.8);
                const color = isHighlight ? '#8b5cf6' : (entry.economic_trend_type === 'Counter-Cyclical (Resilient)' ? '#10b981' : (entry.economic_trend_type === 'Pro-Cyclical (Vulnerable)' ? '#f43f5e' : '#94a3b8'));
                return <Cell key={`cell-${index}`} fill={color} fillOpacity={opacity} />;
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FuelElasticityMatrix;
