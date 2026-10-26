import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { DashboardCard } from '../components/ui/DashboardCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { erpService } from '../services/erpService';
import { useRole } from '../context/RoleContext';
import {
  Users,
  Briefcase,
  BookOpen,
  UserPlus,
  CheckCircle2,
  XCircle,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  ArrowRight,
  PlusCircle,
  CreditCard,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export default function DashboardPage() {
  const { currentRole } = useRole();
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const data = await erpService.getDashboardSummary();
        setSummary(data);
      } finally {
        setLoading(false);
      }
    }
    fetchSummary();
  }, []);

  if (loading || !summary) {
    return (
      <MainLayout>
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Loading executive dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  const { charts, recentAdmissions, recentAnnouncements, recentActivities } = summary;

  return (
    <MainLayout>
      <PageHeader
        title="Institutional Executive Dashboard"
        subtitle={`Welcome back, ${currentRole}! Real-time campus telemetry across SIS admissions, roll call attendance, and fiscal audits.`}
        breadcrumbs={[{ label: 'Dashboard' }]}
        actions={
          <div className="flex items-center space-x-2.5">
            <Link
              href="/admissions"
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              New Admission
            </Link>
            <Link
              href="/attendance"
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
              Mark Attendance
            </Link>
          </div>
        }
      />

      {/* 8 Primary Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <DashboardCard
          title="Total Enrolled Students"
          value={summary.totalStudents}
          subtitle="Active SIS Student Profiles"
          icon={Users}
          colorTheme="blue"
          trend={{ value: '12% this term', isPositive: true }}
        />
        <DashboardCard
          title="Teachers & Faculty Staff"
          value={summary.totalStaff}
          subtitle="Academic & Operations Personnel"
          icon={Briefcase}
          colorTheme="indigo"
          trend={{ value: '4 new joins', isPositive: true }}
        />
        <DashboardCard
          title="Academic Units & Sections"
          value={summary.totalClasses}
          subtitle="K-12 Grades & College Depts"
          icon={BookOpen}
          colorTheme="slate"
        />
        <DashboardCard
          title="New Admissions (Intake)"
          value={summary.newAdmissions}
          subtitle="Fall 2025 Applications"
          icon={UserPlus}
          colorTheme="emerald"
          trend={{ value: '85% approved', isPositive: true }}
        />
        <DashboardCard
          title="Students Present Today"
          value={summary.presentToday}
          subtitle="Campus Roll Call Standing"
          icon={CheckCircle2}
          colorTheme="emerald"
          trend={{ value: '94.8% rate', isPositive: true }}
        />
        <DashboardCard
          title="Students Absent Today"
          value={summary.absentToday}
          subtitle="Unexcused & Medical Leaves"
          icon={XCircle}
          colorTheme="rose"
        />
        <DashboardCard
          title="Outstanding / Pending Fees"
          value={`$${(summary.pendingFeesMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Unsettled Accounts Receivable"
          icon={AlertCircle}
          colorTheme="amber"
        />
        <DashboardCard
          title="Total Fee Collections"
          value={`$${(summary.totalCollectedMinor / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
          subtitle="Minor-Unit Balanced Ledger"
          icon={DollarSign}
          colorTheme="emerald"
          trend={{ value: '96.2% target', isPositive: true }}
        />
      </div>

      {/* Recharts Analytics Row 1: Enrollment Trend & Daily Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Chart 1: Enrollment Trend */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Enrollment Progression</h3>
              <p className="text-xs text-slate-500">School vs Higher Education monthly intake</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              Monthly Active
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.enrollmentByMonth}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="school" name="K-12 School" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="college" name="Higher-Ed College" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Attendance Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Weekly Attendance Dynamics</h3>
              <p className="text-xs text-slate-500">Campus-wide daily present, absent and late counts</p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
              95.2% Avg
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.attendanceWeekly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} domain={[1200, 1400]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="present" name="Present Count" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="absent" name="Absent Count" stroke="#EF4444" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recharts Analytics Row 2: Fee Collections vs Target & Department Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Fee Collection Bars */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Quarterly Fiscal Fee Collections</h3>
              <p className="text-xs text-slate-500">Target vs Actual Settlements ($ in thousands)</p>
            </div>
            <span className="text-xs font-semibold text-emerald-600 font-mono">Zero Drift Guaranteed</span>
          </div>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.feeCollectionQuarterly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`$${(val / 1000).toFixed(0)}k`, 'Amount']}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="target" name="Collection Target" fill="#E2E8F0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="collected" name="Settled Funds" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Student Department Breakdown (Donut) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-slate-900">Student Body Distribution</h3>
            <p className="text-xs text-slate-500">Enrollment by academic division</p>
          </div>
          <div className="h-52 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.departmentShare}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                >
                  {charts.departmentShare.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
            {charts.departmentShare.map((d: any) => (
              <div key={d.name} className="flex items-center space-x-1.5 truncate">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }}></span>
                <span className="text-slate-600 truncate">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Lists: Recent Admissions, Announcements, Activity Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Admissions */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <UserPlus className="w-4 h-4 text-blue-600 mr-2" />
              Recent Admissions
            </h3>
            <Link href="/admissions" className="text-xs font-semibold text-blue-600 hover:underline">
              View All
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {recentAdmissions.map((adm: any) => (
              <div key={adm.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800">{adm.applicantName}</div>
                  <div className="text-[11px] text-slate-400">{adm.applyingForClass} • {adm.applicationNumber}</div>
                </div>
                <StatusBadge status={adm.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Announcements Bulletin */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <MessageSquare className="w-4 h-4 text-indigo-600 mr-2" />
              Campus Announcements
            </h3>
            <Link href="/communication" className="text-xs font-semibold text-blue-600 hover:underline">
              Compose
            </Link>
          </div>
          <div className="space-y-3 flex-1">
            {recentAnnouncements.map((ann: any) => (
              <div key={ann.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-semibold text-blue-700">{ann.targetAudience}</span>
                  <span className="text-slate-400">{ann.publishDate}</span>
                </div>
                <div className="text-xs font-bold text-slate-800 line-clamp-1">{ann.title}</div>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{ann.content}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Activity Audit Feed */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center">
              <Clock className="w-4 h-4 text-slate-600 mr-2" />
              Live System Activity
            </h3>
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              Live
            </span>
          </div>
          <div className="space-y-3 flex-1">
            {recentActivities.map((act: any) => (
              <div key={act.id} className="flex items-start space-x-2.5 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0"></div>
                <div>
                  <div className="font-bold text-slate-800 leading-snug">{act.title}</div>
                  <div className="text-[11px] text-slate-500 leading-relaxed">{act.description}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{act.timestamp} by {act.actorName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
