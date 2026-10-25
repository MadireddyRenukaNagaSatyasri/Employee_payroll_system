import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'sky', // 'sky' | 'emerald' | 'amber' | 'indigo' | 'rose'
}) {
  const colorStyles = {
    sky: {
      bg: 'bg-sky-50',
      text: 'text-sky-700',
      border: 'border-sky-100',
    },
    emerald: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-100',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-100',
    },
    indigo: {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-100',
    },
    rose: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-100',
    },
  };

  const style = colorStyles[color] || colorStyles.sky;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex items-start justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {title}
        </p>
        <h3 className="text-2xl font-extrabold text-slate-800 mt-1 tracking-tight">
          {value}
        </h3>
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>
        )}
      </div>

      {Icon && (
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${style.bg} ${style.text} ${style.border} border shadow-inner flex-shrink-0`}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
