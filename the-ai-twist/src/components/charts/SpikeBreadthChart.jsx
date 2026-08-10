import React, { useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import rawData from '../../data/spike_weeks.csv?raw';

/*
  The chart the dashboard was missing. The Executive Summary claims the calendar runs
  the business; nothing visualised it -- the anomaly scatter shows intensity per event
  but not how many stores a given week moved.

  It carries two findings at once:
    1. Breadth vs intensity. Black Friday week spikes hardest (12.9 sigma) but the
       pre-Christmas week moves the widest estate (40 of 45), and repeats at 38 the
       next year. Recurrence is what makes a pattern plannable.
    2. DQ-4. Bars are coloured by whether the SOURCE flagged that week as a holiday.
       The two largest bars are amber -- the source flag misses them entirely.
*/

const SpikeBreadthChart = () => {
  const data = useMemo(() => {
    const parsed = Papa.parse(rawData, { header: true, dynamicTyping: true });
    return parsed.data
      .filter(row => row.partition_date && row.stores_flagged >= 4)
      .sort((a, b) => b.stores_flagged - a.stores_flagged)
      .map(row => ({
        ...row,
        label: new Date(row.partition_date).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: '2-digit' }),
        flagged: row.source_flagged_holiday === 1,
      }));
  }, []);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-slate-900 text-white p-3 shadow-lg text-sm border border-slate-700 max-w-xs">
          <p className="font-bold mb-1">Week ending {d.label}</p>
          <p>Stores &gt; 3σ: <strong>{d.stores_flagged} of 45</strong></p>
          <p>Avg intensity: {d.avg_z_score}σ &nbsp;|&nbsp; Peak: {d.max_z_score}σ</p>
          <p className={`mt-2 pt-2 border-t border-slate-700 ${d.flagged ? 'text-emerald-400' : 'text-amber-400'}`}>
            {d.flagged
              ? 'Source flagged this as a holiday week — expected trading.'
              : 'NOT flagged as a holiday week by the source feed (DQ-4).'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full bg-white border border-slate-200 shadow-sm p-4 flex flex-col">
      <h3 className="text-lg font-bold text-slate-900 mb-1 px-2">
        Spike Breadth by Week — How Many Stores Each Event Moved
      </h3>
      <p className="text-xs text-slate-500 mb-1 px-2 leading-relaxed">
        <strong>Why this chart exists:</strong> ranking anomalies by z-score answers <em>which event
        was sharpest</em>. It does not answer <em>how much of the estate moved</em> — and for inventory
        planning that is the more useful question. 169 store-weeks breach +3σ; they concentrate into
        five weeks, all in November and December.
      </p>
      <p className="text-xs mb-4 px-2 leading-relaxed">
        <span className="inline-block w-3 h-3 bg-emerald-500 align-middle mr-1"></span>
        <span className="text-slate-600 mr-4">Source flagged as holiday week</span>
        <span className="inline-block w-3 h-3 bg-amber-500 align-middle mr-1"></span>
        <span className="text-slate-600">Not flagged by source — the flag misses the biggest weeks</span>
      </p>

      <div className="flex-1 min-h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#64748b"
              fontSize={11}
              label={{ value: 'Week ending', position: 'insideBottom', offset: -18, fill: '#64748b', fontSize: 12 }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={12}
              domain={[0, 45]}
              label={{ value: 'Stores above +3σ (of 45)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
            <Bar dataKey="stores_flagged" radius={[3, 3, 0, 0]}>
              <LabelList dataKey="stores_flagged" position="top" fontSize={11} fill="#475569" />
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.flagged ? '#10b981' : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-500 mt-3 px-2 leading-relaxed border-t border-slate-100 pt-3">
        <strong>Read it this way:</strong> the pre-Christmas week is the broadest event of the year
        (40 of 45 stores in 2019, 38 in 2020) and the source holiday flag captures neither. Black Friday
        week — flagged, and correctly so — moves fewer stores but hits hardest, holding all ten of the
        largest individual spikes at up to 12.9σ. Both are true, and they imply different actions:
        buy depth for December, concentrate promotional intensity on Black Friday.
      </p>
    </div>
  );
};

export default SpikeBreadthChart;
