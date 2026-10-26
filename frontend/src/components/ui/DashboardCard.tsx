import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  colorTheme?: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'slate';
  onClick?: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorTheme = 'blue',
  onClick,
}) => {
  const themeStyles = {
    blue: { bg: 'bg-blue-50 text-blue-600', ring: 'hover:border-blue-300' },
    emerald: { bg: 'bg-emerald-50 text-emerald-600', ring: 'hover:border-emerald-300' },
    amber: { bg: 'bg-amber-50 text-amber-600', ring: 'hover:border-amber-300' },
    rose: { bg: 'bg-rose-50 text-rose-600', ring: 'hover:border-rose-300' },
    indigo: { bg: 'bg-indigo-50 text-indigo-600', ring: 'hover:border-indigo-300' },
    slate: { bg: 'bg-slate-100 text-slate-700', ring: 'hover:border-slate-300' },
  }[colorTheme];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 p-5 shadow-sm transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md' : ''
      } ${themeStyles.ring}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-lg ${themeStyles.bg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{value}</div>
        {trend && (
          <div
            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
              trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>

      {subtitle && <div className="mt-2 text-xs text-slate-500 font-medium">{subtitle}</div>}
    </div>
  );
};
