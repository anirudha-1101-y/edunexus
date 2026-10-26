import React from 'react';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const norm = (status || '').toUpperCase().replace(/\s+/g, '_');

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['ACTIVE', 'APPROVED', 'PRESENT', 'PAID', 'SUCCESS', 'VERIFIED'].includes(norm)) {
    bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium';
  } else if (['PENDING', 'UNDER_REVIEW', 'PARTIAL', 'LATE', 'LEAVE'].includes(norm)) {
    bgClass = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
  } else if (['REJECTED', 'ABSENT', 'OVERDUE', 'INACTIVE', 'SUSPENDED', 'FAILED', 'HIGH', 'URGENT'].includes(norm)) {
    bgClass = 'bg-rose-50 text-rose-700 border-rose-200 font-medium';
  } else if (['GRADUATED', 'TRANSFERRED', 'MEDIUM', 'NORMAL'].includes(norm)) {
    bgClass = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
  } else if (['SCHOOL', 'COLLEGE'].includes(norm)) {
    bgClass = norm === 'SCHOOL' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-purple-50 text-purple-700 border-purple-200';
  }

  const paddingClass = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span className={`inline-flex items-center rounded-full border ${paddingClass} ${bgClass} tracking-wide transition-colors`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
