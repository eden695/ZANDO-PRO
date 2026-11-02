import React from 'react';

interface StatCardProps {
  label: string;
  value: string;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'default' | 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon: Icon,
  tone = 'default',
  onClick,
}) => {
  const toneMap = {
    default: {
      bg: 'bg-white',
      border: 'border-slate-200',
      iconBg: 'bg-slate-100 text-slate-700',
      valColor: 'text-slate-900',
    },
    cyan: {
      bg: 'bg-white',
      border: 'border-cyan-200/80',
      iconBg: 'bg-cyan-50 text-cyan-700',
      valColor: 'text-slate-900',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-emerald-200/80',
      iconBg: 'bg-emerald-50 text-emerald-700',
      valColor: 'text-slate-900',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-amber-200/80',
      iconBg: 'bg-amber-50 text-amber-700',
      valColor: 'text-slate-900',
    },
    rose: {
      bg: 'bg-white',
      border: 'border-rose-200/80',
      iconBg: 'bg-rose-50 text-rose-700',
      valColor: 'text-slate-900',
    },
    indigo: {
      bg: 'bg-white',
      border: 'border-indigo-200/80',
      iconBg: 'bg-indigo-50 text-indigo-700',
      valColor: 'text-slate-900',
    },
  };

  const style = toneMap[tone];

  return (
    <div
      onClick={onClick}
      className={`${style.bg} ${style.border} border rounded-xl p-4 shadow-xs transition-all ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-slate-300' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">
          {label}
        </span>
        {Icon && (
          <div className={`p-2 rounded-lg ${style.iconBg} shrink-0`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="mt-2.5">
        <div className={`text-xl sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${style.valColor}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-slate-500 truncate">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
};
