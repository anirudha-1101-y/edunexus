import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { DashboardCard } from '../components/ui/DashboardCard';
import { DataTable, Column } from '../components/ui/DataTable';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { erpService } from '../services/erpService';
import { AttendanceRecord, LeaveRequest } from '../types/erp';
import { useToast } from '../context/ToastContext';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Lock,
  Unlock,
  Plus,
  Filter,
  Check,
  X,
  FileText,
} from 'lucide-react';

export default function AttendancePage() {
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'students' | 'employees' | 'leaves'>('students');
  const [selectedDate, setSelectedDate] = useState('2026-10-26');
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [isSessionLocked, setIsSessionLocked] = useState(false);

  // Student Roll Call Data
  const [studentRollCall, setStudentRollCall] = useState<AttendanceRecord[]>([]);
  // Employee Roll Call Data
  const [employeeRollCall, setEmployeeRollCall] = useState<AttendanceRecord[]>([]);
  // Leave Requests Data
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Confirm Dialog State
  const [confirmLockOpen, setConfirmLockOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);

  // Leave Application Form State
  const [leaveForm, setLeaveForm] = useState({
    applicantName: 'Sarah Jenkins',
    applicantRole: 'TEACHER' as 'STUDENT' | 'TEACHER' | 'STAFF',
    idNumber: 'FAC-102',
    leaveType: 'CASUAL' as const,
    startDate: '2026-11-01',
    endDate: '2026-11-02',
    daysCount: 2,
    reason: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [stuRecords, empRecords, leaves] = await Promise.all([
        erpService.getAttendanceRecords(undefined, 'STUDENT'),
        erpService.getAttendanceRecords(undefined, 'EMPLOYEE'),
        erpService.getLeaveRequests(),
      ]);
      setStudentRollCall(stuRecords);
      setEmployeeRollCall(empRecords);
      setLeaveRequests(leaves);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateIndividualStatus = (id: string, newStatus: AttendanceRecord['status'], isEmployee = false) => {
    if (isSessionLocked) {
      error('Session Locked', 'Locked attendance cannot be modified without an administrative audit correction.');
      return;
    }
    if (isEmployee) {
      setEmployeeRollCall((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } else {
      setStudentRollCall((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    }
  };

  const markAllPresent = (isEmployee = false) => {
    if (isSessionLocked) return;
    if (isEmployee) {
      setEmployeeRollCall((prev) => prev.map((r) => ({ ...r, status: 'PRESENT' })));
    } else {
      setStudentRollCall((prev) => prev.map((r) => ({ ...r, status: 'PRESENT' })));
    }
    success('Bulk Update', 'All candidates marked as Present.');
  };

  const handleSaveAndLock = () => {
    setIsSessionLocked(true);
    setConfirmLockOpen(false);
    success('Roll Call Locked', 'Attendance ledger signed and audit-locked.');
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason) {
      error('Reason Required', 'Please provide a clear reason for the leave application.');
      return;
    }
    const created = await erpService.submitLeaveRequest(leaveForm);
    setLeaveRequests([created, ...leaveRequests]);
    setLeaveModalOpen(false);
    success('Leave Submitted', `Leave request for ${created.daysCount} days logged for approval.`);
    setLeaveForm({ ...leaveForm, reason: '' });
  };

  const handleReviewLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    await erpService.updateLeaveStatus(id, status, 'Dr. Arthur Vance (Director)');
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status, reviewedBy: 'Dr. Arthur Vance' } : l))
    );
    success('Leave Reviewed', `Leave request marked as ${status}.`);
  };

  // Student Metrics
  const totalStu = studentRollCall.length;
  const presentStu = studentRollCall.filter((r) => r.status === 'PRESENT').length;
  const absentStu = studentRollCall.filter((r) => r.status === 'ABSENT').length;
  const attendanceRate = totalStu > 0 ? ((presentStu / totalStu) * 100).toFixed(1) : '100';

  const studentColumns: Column<AttendanceRecord>[] = [
    {
      key: 'rollOrEmpId',
      header: 'Roll #',
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.rollOrEmpId}</span>,
    },
    {
      key: 'personName',
      header: 'Student Name',
      sortable: true,
      render: (r) => <span className="font-bold text-slate-900">{r.personName}</span>,
    },
    {
      key: 'className',
      header: 'Class & Section',
      render: (r) => <span className="text-slate-600">{r.className} - {r.sectionName}</span>,
    },
    {
      key: 'status',
      header: 'Recorded Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Roll Call Toggle',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            disabled={isSessionLocked}
            onClick={() => updateIndividualStatus(r.id, 'PRESENT')}
            className={`px-2.5 py-1 text-xs font-bold rounded ${
              r.status === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            P
          </button>
          <button
            disabled={isSessionLocked}
            onClick={() => updateIndividualStatus(r.id, 'ABSENT')}
            className={`px-2.5 py-1 text-xs font-bold rounded ${
              r.status === 'ABSENT' ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            A
          </button>
          <button
            disabled={isSessionLocked}
            onClick={() => updateIndividualStatus(r.id, 'LATE')}
            className={`px-2.5 py-1 text-xs font-bold rounded ${
              r.status === 'LATE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            L
          </button>
          <button
            disabled={isSessionLocked}
            onClick={() => updateIndividualStatus(r.id, 'LEAVE')}
            className={`px-2.5 py-1 text-xs font-bold rounded ${
              r.status === 'LEAVE' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            LV
          </button>
        </div>
      ),
    },
  ];

  const employeeColumns: Column<AttendanceRecord>[] = [
    {
      key: 'rollOrEmpId',
      header: 'Staff ID',
      sortable: true,
      render: (r) => <span className="font-mono text-xs font-bold text-slate-800">{r.rollOrEmpId}</span>,
    },
    {
      key: 'personName',
      header: 'Employee Name',
      sortable: true,
      render: (r) => <span className="font-bold text-slate-900">{r.personName}</span>,
    },
    {
      key: 'department',
      header: 'Department Unit',
      render: (r) => <span className="text-slate-600">{r.department}</span>,
    },
    {
      key: 'status',
      header: 'Attendance Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      header: 'Mark Status',
      className: 'text-right',
      render: (r) => (
        <div className="flex items-center justify-end space-x-1">
          <button
            disabled={isSessionLocked}
            onClick={() => updateIndividualStatus(r.id, 'PRESENT', true)}
            className={`px-2.5 py-1 text-xs font-bold rounded ${
              r.status === 'PRESENT' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            Present
          </button>
          <button
            disabled={isSessionLocked}
            onClick={() => updateIndividualStatus(r.id, 'LEAVE', true)}
            className={`px-2.5 py-1 text-xs font-bold rounded ${
              r.status === 'LEAVE' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50`}
          >
            On Leave
          </button>
        </div>
      ),
    },
  ];

  const leaveColumns: Column<LeaveRequest>[] = [
    {
      key: 'applicantName',
      header: 'Applicant',
      sortable: true,
      render: (l) => (
        <div>
          <div className="font-bold text-slate-900">{l.applicantName}</div>
          <div className="text-[11px] text-slate-400">{l.applicantRole} • {l.idNumber}</div>
        </div>
      ),
    },
    {
      key: 'leaveType',
      header: 'Leave Type',
      render: (l) => <span className="font-semibold text-slate-800">{l.leaveType}</span>,
    },
    {
      key: 'dates',
      header: 'Duration',
      render: (l) => (
        <span className="text-xs text-slate-600">
          {l.startDate} to {l.endDate} ({l.daysCount} days)
        </span>
      ),
    },
    {
      key: 'reason',
      header: 'Declared Reason',
      render: (l) => <span className="text-xs text-slate-600 max-w-xs truncate block">{l.reason}</span>,
    },
    {
      key: 'status',
      header: 'Approval State',
      render: (l) => <StatusBadge status={l.status} />,
    },
    {
      key: 'actions',
      header: 'Decision',
      className: 'text-right',
      render: (l) =>
        l.status === 'PENDING' ? (
          <div className="flex items-center justify-end space-x-1.5">
            <button
              onClick={() => handleReviewLeave(l.id, 'APPROVED')}
              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              title="Approve Leave"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleReviewLeave(l.id, 'REJECTED')}
              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
              title="Reject Leave"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <span className="text-[11px] text-slate-400 font-medium">Reviewed</span>
        ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Attendance Management & Roll Call"
        subtitle="Institutional daily homeroom and lecture attendance, session audit locking, and employee leave requests."
        breadcrumbs={[{ label: 'Attendance' }]}
        actions={
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setLeaveModalOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Apply for Leave
            </button>
            {!isSessionLocked ? (
              <button
                onClick={() => setConfirmLockOpen(true)}
                className="inline-flex items-center px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Lock className="w-3.5 h-3.5 mr-1.5" />
                Save & Lock Session
              </button>
            ) : (
              <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                <Lock className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                Session Audit-Locked
              </div>
            )}
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          title="Attendance Standing"
          value={`${attendanceRate}%`}
          subtitle="Cohort Presence Rate"
          icon={CalendarCheck}
          colorTheme="emerald"
        />
        <DashboardCard
          title="Present Today"
          value={presentStu}
          subtitle="Signed in Homeroom"
          icon={CheckCircle2}
          colorTheme="blue"
        />
        <DashboardCard
          title="Absent Unexcused"
          value={absentStu}
          subtitle="Automated Parent SMS Alerts"
          icon={XCircle}
          colorTheme="rose"
        />
        <DashboardCard
          title="Active Leave Requests"
          value={leaveRequests.filter((l) => l.status === 'PENDING').length}
          subtitle="Staff & Student Filings"
          icon={Clock}
          colorTheme="amber"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 mb-6">
        <div className="flex space-x-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'students' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Student Attendance ({studentRollCall.length})
          </button>
          <button
            onClick={() => setActiveTab('employees')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'employees' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Employee Attendance ({employeeRollCall.length})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'leaves' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Leave Requests ({leaveRequests.length})
          </button>
        </div>

        {activeTab !== 'leaves' && (
          <div className="hidden sm:flex items-center space-x-3 mb-2">
            <button
              disabled={isSessionLocked}
              onClick={() => markAllPresent(activeTab === 'employees')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 disabled:opacity-40"
            >
              + Mark All Present
            </button>
          </div>
        )}
      </div>

      {/* Filters Bar */}
      {activeTab !== 'leaves' && (
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 mb-6 text-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {activeTab === 'students' && (
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400 font-semibold">Cohort:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-medium"
                >
                  <option value="Grade 10">Grade 10 - Section A</option>
                  <option value="Grade 9">Grade 9 - Section B</option>
                  <option value="Grade 11">Grade 11 - Science</option>
                  <option value="B.Tech CSE">B.Tech CSE - Semester 3</option>
                </select>
              </div>
            )}
          </div>

          <div className="text-slate-500">
            {isSessionLocked ? (
              <span className="text-emerald-700 font-semibold flex items-center">
                <Lock className="w-3.5 h-3.5 mr-1" />
                Ledger Locked
              </span>
            ) : (
              <span className="text-amber-700 font-semibold flex items-center">
                <Unlock className="w-3.5 h-3.5 mr-1" />
                Draft Mode (Editable)
              </span>
            )}
          </div>
        </div>
      )}

      {/* Table: Student Roll Call */}
      {activeTab === 'students' && (
        <DataTable
          columns={studentColumns}
          data={studentRollCall}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          pageSize={8}
          emptyMessage="No student roll call records logged for this session."
        />
      )}

      {/* Table: Employee Roll Call */}
      {activeTab === 'employees' && (
        <DataTable
          columns={employeeColumns}
          data={employeeRollCall}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          pageSize={8}
          emptyMessage="No employee roll call records logged."
        />
      )}

      {/* Table: Leave Requests */}
      {activeTab === 'leaves' && (
        <DataTable
          columns={leaveColumns}
          data={leaveRequests}
          keyExtractor={(item) => item.id}
          isLoading={loading}
          pageSize={8}
          emptyMessage="No pending or historical leave requests found."
        />
      )}

      {/* Confirm Dialog: Lock Session */}
      <ConfirmDialog
        isOpen={confirmLockOpen}
        title="Lock Attendance Session?"
        message="Once locked, roll call records cannot be altered directly without an audited correction logged in the system. Proceed to lock?"
        confirmText="Yes, Lock Session"
        cancelText="Cancel"
        variant="primary"
        onConfirm={handleSaveAndLock}
        onCancel={() => setConfirmLockOpen(false)}
      />

      {/* Modal: Apply For Leave */}
      {leaveModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center">
              <CalendarCheck className="w-5 h-5 text-blue-600 mr-2" />
              File Formal Leave Application
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Submit your absence request for review by department leads and administration.
            </p>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Leave Category</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                >
                  <option value="CASUAL">Casual Personal Leave</option>
                  <option value="SICK">Medical / Sick Leave</option>
                  <option value="EMERGENCY">Family Emergency</option>
                  <option value="ACADEMIC">Academic / Conference Duty</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Declared Reason *</label>
                <textarea
                  rows={3}
                  required
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  placeholder="Provide context and notes for review..."
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setLeaveModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
