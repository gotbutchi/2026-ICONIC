import React from 'react';

const InsightCard = ({ title, description }) => {
  return (
    <div className="flex flex-col justify-start h-full p-6 border border-slate-200 bg-white shadow-sm">
      <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{description}</p>
    </div>
  );
};

export default InsightCard;
