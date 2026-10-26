import React, { useState, useEffect } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { DashboardCard } from '../components/ui/DashboardCard';
import { DataTable, Column } from '../components/ui/DataTable';
import { SearchFilterBar } from '../components/ui/SearchFilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { erpService } from '../services/erpService';
import { AdmissionApplicant } from '../types/erp';
import { useToast } from '../context/ToastContext';
import {
  UserPlus,
  FileCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  Eye,
  Plus,
  Download,
  School,
  X,
} from 'lucide-react';

export default function AdmissionsPage() {
  const { success, error } = useToast();
  const [admissions, setAdmissions] = useState<AdmissionApplicant[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cohortFilter, setCohortFilter] = useState('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<AdmissionApplicant | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // New Admission Form State
  const [formData, setFormData] = useState({
    applicantName: '',
    applyingForClass: 'Grade 10',
    cohortType: 'SCHOOL' as 'SCHOOL' | 'COLLEGE',
    parentName: '',
    parentContact: '',
    email: '',
    previousSchoolOrCollege: '',
    entranceExamScore: 85,
    documentsVerified: true,
    notes: '',
  });

  const loadAdmissions = async () => {
    try {
      setLoading(true);
      const data = await erpService.getAdmissions();
      setAdmissions(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmissions();
  }, []);

  const handleCreateApplicant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.applicantName || !formData.email) {
      error('Required Fields Missing', 'Please provide applicant name and email.');
      return;
    }
    const created = await erpService.createAdmission({
      ...formData,
      status: 'PENDING',
    });
    setAdmissions([created, ...admissions]);
    setIsAddModalOpen(false);
    success('Application Received', `Candidate ${created.applicantName} registered with ${created.applicationNumber}.`);
    setFormData({
      applicantName: '',
      applyingForClass: 'Grade 10',
      cohortType: 'SCHOOL',
      parentName: '',
      parentContact: '',
      email: '',
      previousSchoolOrCollege: '',
      entranceExamScore: 85,
      documentsVerified: true,
      notes: '',
    });
  };

  const handleUpdateStatus = async (id: string, newStatus: AdmissionApplicant['status']) => {
    await erpService.updateAdmissionStatus(id, newStatus);
    setAdmissions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    if (selectedApplicant && selectedApplicant.id === id) {
      setSelectedApplicant({ ...selectedApplicant, status: newStatus });
    }
    success('Status Updated', `Application status transitioned to ${newStatus}.`);
  };

  // Filtered List
  const filteredData = admissions.filter((item) => {
    const matchesSearch =
      item.applicantName.toLowerCase().includes(search.toLowerCase()) ||
      item.applicationNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    const matchesCohort = cohortFilter === 'ALL' || item.cohortType === cohortFilter;
    return matchesSearch && matchesStatus && matchesCohort;
  });

  // Metrics
  const totalApps = admissions.length;
  const underReview = admissions.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'PENDING').length;
  const approved = admissions.filter((a) => a.status === 'APPROVED').length;
  const rejected = admissions.filter((a) => a.status === 'REJECTED').length;

  const columns: Column<AdmissionApplicant>[] = [
    {
      key: 'applicationNumber',
      header: 'App #',
      sortable: true,
      render: (item) => <span className="font-mono text-xs font-bold text-slate-800">{item.applicationNumber}</span>,
    },
    {
      key: 'applicantName',
      header: 'Candidate Name',
      sortable: true,
      render: (item) => (
        <div>
          <div className="font-bold text-slate-900">{item.applicantName}</div>
          <div className="text-[11px] text-slate-400">{item.email}</div>
        </div>
      ),
    },
    {
      key: 'applyingForClass',
      header: 'Cohort Target',
      sortable: true,
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-800">{item.applyingForClass}</span>
          <span className="text-[10px] ml-1.5 px-1.5 py-0.2 bg-slate-100 rounded text-slate-500">{item.cohortType}</span>
        </div>
      ),
    },
    {
      key: 'parentContact',
      header: 'Parent Contact',
      render: (item) => (
        <div>
          <div className="text-slate-800">{item.parentName}</div>
          <div className="text-[11px] text-slate-400">{item.parentContact}</div>
        </div>
      ),
    },
    {
      key: 'entranceExamScore',
      header: 'Exam Score',
      sortable: true,
      render: (item) => (
        <span className={`font-semibold ${item.entranceExamScore && item.entranceExamScore >= 70 ? 'text-emerald-600' : 'text-slate-600'}`}>
          {item.entranceExamScore ? `${item.entranceExamScore}%` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => setSelectedApplicant(item)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
            title="View Application Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>
          {item.status === 'APPROVED' && (
            <button
              onClick={() => {
                setSelectedApplicant(item);
                setIsReceiptModalOpen(true);
              }}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 transition-colors"
              title="Print Admission Confirmation"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Student Admissions & Registration"
        subtitle="End-to-end applicant tracking pipeline, document verification, review workflow, and cohort assignment."
        breadcrumbs={[{ label: 'Admissions' }]}
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Application
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          title="Total Applications"
          value={totalApps}
          subtitle="All Received Inquiries"
          icon={UserPlus}
          colorTheme="blue"
        />
        <DashboardCard
          title="Pending / Under Review"
          value={underReview}
          subtitle="Evaluation in Progress"
          icon={Clock}
          colorTheme="amber"
        />
        <DashboardCard
          title="Admissions Approved"
          value={approved}
          subtitle="Ready for Section Allocation"
          icon={CheckCircle2}
          colorTheme="emerald"
        />
        <DashboardCard
          title="Rejected / Ineligible"
          value={rejected}
          subtitle="Cutoff / Prerequisite Disqualified"
          icon={XCircle}
          colorTheme="rose"
        />
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search applicant name, application #, email..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Pending', value: 'PENDING' },
              { label: 'Under Review', value: 'UNDER_REVIEW' },
              { label: 'Approved', value: 'APPROVED' },
              { label: 'Rejected', value: 'REJECTED' },
            ],
          },
          {
            id: 'cohort',
            label: 'Institution Type',
            value: cohortFilter,
            onChange: setCohortFilter,
            options: [
              { label: 'All Divisions', value: 'ALL' },
              { label: 'K-12 School', value: 'SCHOOL' },
              { label: 'College / University', value: 'COLLEGE' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('');
          setStatusFilter('ALL');
          setCohortFilter('ALL');
        }}
      />

      {/* Admissions Table */}
      <DataTable
        columns={columns}
        data={filteredData}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pageSize={6}
        emptyMessage="No admissions candidates matching the filter criteria."
      />

      {/* Modal: New Admission Intake */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center">
                <UserPlus className="w-5 h-5 text-blue-600 mr-2" />
                Intake New Candidate Application
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateApplicant} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicant Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.applicantName}
                    onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Julian Hayes"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applicant Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="candidate@example.com"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Division Target</label>
                  <select
                    value={formData.cohortType}
                    onChange={(e) => setFormData({ ...formData, cohortType: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="SCHOOL">K-12 Primary / Secondary School</option>
                    <option value="COLLEGE">Higher Education College</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Applying For Class / Degree *</label>
                  <input
                    type="text"
                    required
                    value={formData.applyingForClass}
                    onChange={(e) => setFormData({ ...formData, applyingForClass: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Grade 10 or B.Tech CSE"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent / Guardian Name</label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Robert Hayes"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent Contact Phone</label>
                  <input
                    type="text"
                    value={formData.parentContact}
                    onChange={(e) => setFormData({ ...formData, parentContact: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Previous Institution</label>
                  <input
                    type="text"
                    value={formData.previousSchoolOrCollege}
                    onChange={(e) => setFormData({ ...formData, previousSchoolOrCollege: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Westside Middle School"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entrance Score (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.entranceExamScore}
                    onChange={(e) => setFormData({ ...formData, entranceExamScore: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Reviewer Internal Notes</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional administrative observations..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm"
                >
                  Register Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Application Detail & Status Transition */}
      {selectedApplicant && !isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="font-mono text-xs font-bold text-blue-600">{selectedApplicant.applicationNumber}</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedApplicant.applicantName}</h3>
              </div>
              <button
                onClick={() => setSelectedApplicant(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold">Applying For:</span>
                  <span className="font-bold text-slate-800">{selectedApplicant.applyingForClass}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Current Status:</span>
                  <StatusBadge status={selectedApplicant.status} />
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Parent Contact:</span>
                  <span className="text-slate-800">{selectedApplicant.parentName} ({selectedApplicant.parentContact})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Entrance Exam:</span>
                  <span className="font-semibold text-emerald-600">{selectedApplicant.entranceExamScore}%</span>
                </div>
              </div>

              {/* Document Checklist */}
              <div>
                <span className="font-bold text-slate-800 block mb-2">Mandatory Verification Checklist:</span>
                <div className="space-y-1.5 p-3 rounded-lg border border-slate-200 bg-white">
                  <div className="flex items-center text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    <span>Birth Certificate & Identity Verification (Verified)</span>
                  </div>
                  <div className="flex items-center text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    <span>Previous Academic Transcript & Transfer Record (Verified)</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <CheckCircle2 className="w-4 h-4 mr-2 text-slate-300" />
                    <span>Residential Address & Utility Bill Copy</span>
                  </div>
                </div>
              </div>

              {selectedApplicant.notes && (
                <div className="p-3 rounded-lg bg-amber-50/60 border border-amber-200/80 text-amber-900">
                  <span className="font-bold block mb-0.5">Administrative Notes:</span>
                  <p>{selectedApplicant.notes}</p>
                </div>
              )}

              {/* Status Update Actions */}
              <div className="pt-2">
                <span className="font-bold text-slate-800 block mb-2">Update Application Decision:</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedApplicant.id, 'UNDER_REVIEW')}
                    className="px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 font-semibold hover:bg-amber-100 transition-colors"
                  >
                    Mark Under Review
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApplicant.id, 'APPROVED')}
                    className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    Approve Candidate
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedApplicant.id, 'REJECTED')}
                    className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 font-semibold hover:bg-rose-100 transition-colors"
                  >
                    Reject Candidate
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedApplicant(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Admission Confirmation Receipt */}
      {selectedApplicant && isReceiptModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="no-print flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admission Confirmation Preview
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5 mr-1.5" />
                  Print Admission Letter
                </button>
                <button
                  onClick={() => setIsReceiptModalOpen(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Letter */}
            <div className="printable-area p-6 bg-slate-50 rounded-xl border border-slate-200 text-slate-900 text-xs font-sans">
              <div className="text-center pb-4 border-b border-slate-300">
                <div className="inline-flex p-2 bg-blue-100 text-blue-700 rounded-full mb-1">
                  <School className="w-5 h-5" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900">Apex Academy & Institute</h3>
                <p className="text-[11px] text-slate-500">Office of Registrar & Academic Admissions</p>
                <div className="mt-2 inline-block px-3 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded-full">
                  OFFICIAL ADMISSION CONFIRMATION
                </div>
              </div>

              <div className="py-4 space-y-2 border-b border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Applicant:</span>
                  <span className="font-bold text-slate-900">{selectedApplicant.applicantName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Application Number:</span>
                  <span className="font-mono font-bold text-blue-700">{selectedApplicant.applicationNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cohort Admitted:</span>
                  <span className="font-semibold text-slate-800">{selectedApplicant.applyingForClass}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Section:</span>
                  <span className="font-semibold text-emerald-700">{selectedApplicant.assignedSection || 'Section A'}</span>
                </div>
              </div>

              <div className="pt-4 text-slate-600 leading-relaxed text-[11px]">
                Congratulations! We are delighted to inform you that the admissions committee has approved your candidacy for enrollment into the 2025-2026 Academic Cycle. Please report to the campus bursar office to complete tuition settlement.
              </div>
            </div>

            <div className="no-print mt-6 text-right">
              <button
                onClick={() => setIsReceiptModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
