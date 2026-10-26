import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { DashboardCard } from '../components/ui/DashboardCard';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useToast } from '../context/ToastContext';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Filter,
  Users,
  CreditCard,
  GraduationCap,
  TrendingUp,
  FileSpreadsheet,
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
} from 'recharts';

export default function ReportsPage() {
  const { success } = useToast();

  const [reportType, setReportType] = useState<'attendance' | 'finance' | 'admissions' | 'performance'>('attendance');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [selectedCohort, setSelectedCohort] = useState('ALL');
  const [dateRange, setDateRange] = useState('MONTH');

  // Realistic Report Data
  const attendanceData = [
    { class: 'Grade 9 - A', enrolled: 32, presentAvg: '94.2%', absentAvg: '4.1%', status: 'GOOD' },
    { class: 'Grade 9 - B', enrolled: 32, presentAvg: '91.8%', absentAvg: '6.2%', status: 'GOOD' },
    { class: 'Grade 10 - A', enrolled: 30, presentAvg: '96.5%', absentAvg: '2.5%', status: 'EXCELLENT' },
    { class: 'Grade 10 - B', enrolled: 28, presentAvg: '89.4%', absentAvg: '8.1%', status: 'ATTENTION' },
    { class: 'Grade 11 - Sci', enrolled: 36, presentAvg: '95.1%', absentAvg: '3.2%', status: 'EXCELLENT' },
    { class: 'B.Tech CSE - 3', enrolled: 65, presentAvg: '92.4%', absentAvg: '5.8%', status: 'GOOD' },
  ];

  const financialData = [
    { category: 'Grade 9 Standard Tuition', billed: '$96,000.00', collected: '$91,200.00', pending: '$4,800.00', rate: '95.0%' },
    { category: 'Grade 10 Standard Tuition', billed: '$90,000.00', collected: '$86,400.00', pending: '$3,600.00', rate: '96.0%' },
    { category: 'Grade 11 Science Stream', billed: '$133,200.00', collected: '$118,500.00', pending: '$14,700.00', rate: '89.0%' },
    { category: 'B.Tech CSE Semester 3', billed: '$208,000.00', collected: '$198,000.00', pending: '$10,000.00', rate: '95.2%' },
    { category: 'Science Laboratory Fee', billed: '$48,000.00', collected: '$44,000.00', pending: '$4,000.00', rate: '91.6%' },
  ];

  const admissionsTrend = [
    { month: 'Jun', applied: 85, approved: 72 },
    { month: 'Jul', applied: 140, approved: 120 },
    { month: 'Aug', applied: 220, approved: 185 },
    { month: 'Sep', applied: 95, approved: 80 },
    { month: 'Oct', applied: 45, approved: 38 },
  ];

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'attendance') {
      csvContent += 'Cohort,Enrolled,Present Avg,Absent Avg,Standing\n';
      attendanceData.forEach((row) => {
        csvContent += `${row.class},${row.enrolled},${row.presentAvg},${row.absentAvg},${row.status}\n`;
      });
    } else {
      csvContent += 'Category,Billed Total,Collected,Pending,Collection Rate\n';
      financialData.forEach((row) => {
        csvContent += `"${row.category}","${row.billed}","${row.collected}","${row.pending}","${row.rate}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `EduNexus_${reportType.toUpperCase()}_Report_${academicYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    success('CSV Exported', 'Report dataset downloaded successfully.');
  };

  return (
    <MainLayout>
      <PageHeader
        title="Reports & Institutional Analytics"
        subtitle="Custom filterable reporting engine across attendance, tuition revenue, student cohorts, and academic performance."
        breadcrumbs={[{ label: 'Reports & Analytics' }]}
        actions={
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Print Report
            </button>
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Export to CSV
            </button>
          </div>
        }
      />

      {/* Filter Parameters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-500">Report Focus:</span>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800"
            >
              <option value="attendance">Student & Staff Attendance Audit</option>
              <option value="finance">Tuition & Fee Collection Ledger</option>
              <option value="admissions">Admissions & Intake Analytics</option>
              <option value="performance">Academic GPA & Marks Evaluation</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-500">Academic Year:</span>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
            >
              <option value="2025-2026">AY 2025-2026 (Current)</option>
              <option value="2024-2025">AY 2024-2025</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-500">Date Range:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
            >
              <option value="MONTH">Current Month</option>
              <option value="TERM">Current Semester / Term</option>
              <option value="ANNUAL">Full Academic Year</option>
            </select>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 font-mono">
          Generated: {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Report Preview Panel */}
      <div className="printable-area space-y-6">
        {/* Visual Charts Component */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                {reportType === 'attendance'
                  ? 'Attendance Standing by Cohort'
                  : reportType === 'finance'
                  ? 'Fiscal Budget & Settlement Trend'
                  : 'Admissions Funnel Progression'}
              </h3>
              <p className="text-xs text-slate-500">Aggregated statistics based on current filter selections</p>
            </div>
            <StatusBadge status="VERIFIED" />
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {reportType === 'admissions' ? (
                <BarChart data={admissionsTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="applied" name="Total Applied" fill="#64748B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name="Approved Intakes" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : (
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="class" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="enrolled" name="Enrolled Count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Data Tables */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/75 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {reportType === 'attendance' ? 'Cohort Attendance Breakdown' : 'Fiscal Accounts Receivable Statement'}
            </h4>
            <span className="text-xs text-slate-500 font-mono">Precision Minor-Unit Verified</span>
          </div>

          <div className="overflow-x-auto">
            {reportType === 'attendance' ? (
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-5 py-3">Academic Unit</th>
                    <th className="px-5 py-3">Enrolled Headcount</th>
                    <th className="px-5 py-3">Present % Average</th>
                    <th className="px-5 py-3">Absenteeism</th>
                    <th className="px-5 py-3">Evaluation Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {attendanceData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">{row.class}</td>
                      <td className="px-5 py-3 text-slate-700">{row.enrolled} Students</td>
                      <td className="px-5 py-3 font-semibold text-emerald-600">{row.presentAvg}</td>
                      <td className="px-5 py-3 text-rose-600 font-medium">{row.absentAvg}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase">
                  <tr>
                    <th className="px-5 py-3">Billing Category</th>
                    <th className="px-5 py-3">Total Invoiced</th>
                    <th className="px-5 py-3">Funds Settled</th>
                    <th className="px-5 py-3">Outstanding Dues</th>
                    <th className="px-5 py-3">Collection Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {financialData.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-bold text-slate-900">{row.category}</td>
                      <td className="px-5 py-3 text-slate-700 font-semibold">{row.billed}</td>
                      <td className="px-5 py-3 text-emerald-700 font-bold">{row.collected}</td>
                      <td className="px-5 py-3 text-amber-700 font-bold">{row.pending}</td>
                      <td className="px-5 py-3 font-mono font-bold text-blue-700">{row.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
