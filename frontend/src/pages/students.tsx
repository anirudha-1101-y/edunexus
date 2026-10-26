import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { DashboardCard } from '../components/ui/DashboardCard';
import { DataTable, Column } from '../components/ui/DataTable';
import { SearchFilterBar } from '../components/ui/SearchFilterBar';
import { StatusBadge } from '../components/ui/StatusBadge';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { erpService } from '../services/erpService';
import { Student } from '../types/erp';
import { useToast } from '../context/ToastContext';
import { useRole } from '../context/RoleContext';
import {
  GraduationCap,
  Users,
  CheckCircle2,
  FileCheck,
  Plus,
  Upload,
  Eye,
  Edit,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
} from 'lucide-react';

export default function StudentsPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const { currentRole } = useRole();

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [cohortFilter, setCohortFilter] = useState('ALL');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Selected Student
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Add/Edit Form State
  const [formStudent, setFormStudent] = useState({
    firstName: '',
    lastName: '',
    admissionNumber: '',
    rollNumber: '',
    gender: 'MALE' as Student['gender'],
    dob: '2009-01-01',
    bloodGroup: 'O+',
    cohortType: 'SCHOOL' as 'SCHOOL' | 'COLLEGE',
    className: 'Grade 10',
    sectionName: 'Section A',
    email: '',
    phone: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    residentialAddress: '',
    status: 'ACTIVE' as Student['status'],
    academicYear: '2025-2026',
    admissionDate: '2025-06-01',
    attendancePercentage: 95.0,
    feeStatus: 'PAID' as Student['feeStatus'],
    cgpaOrGrade: 'A (3.8 GPA)',
  });

  const loadStudents = async () => {
    setLoading(true);
    try {
      const data = await erpService.getStudents();
      setStudents(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (router.query.q) {
      setSearch(router.query.q as string);
    }
    loadStudents();
  }, [router.query.q]);

  const handleOpenAdd = () => {
    setFormStudent({
      firstName: '',
      lastName: '',
      admissionNumber: `ADM-2025-00${students.length + 1}`,
      rollNumber: `${100 + students.length + 1}`,
      gender: 'MALE',
      dob: '2009-01-01',
      bloodGroup: 'O+',
      cohortType: 'SCHOOL',
      className: 'Grade 10',
      sectionName: 'Section A',
      email: '',
      phone: '',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      residentialAddress: '124 Academic Way, Tech Valley',
      status: 'ACTIVE',
      academicYear: '2025-2026',
      admissionDate: new Date().toISOString().split('T')[0],
      attendancePercentage: 100.0,
      feeStatus: 'PAID',
      cgpaOrGrade: 'A (3.8 GPA)',
    });
    setAddModalOpen(true);
  };

  const handleOpenEdit = (st: Student) => {
    setSelectedStudent(st);
    setFormStudent({
      firstName: st.firstName,
      lastName: st.lastName,
      admissionNumber: st.admissionNumber,
      rollNumber: st.rollNumber,
      gender: st.gender,
      dob: st.dob,
      bloodGroup: st.bloodGroup,
      cohortType: st.cohortType,
      className: st.className,
      sectionName: st.sectionName,
      email: st.email,
      phone: st.phone,
      parentName: st.parentName,
      parentPhone: st.parentPhone,
      parentEmail: st.parentEmail,
      residentialAddress: st.residentialAddress,
      status: st.status,
      academicYear: st.academicYear,
      admissionDate: st.admissionDate,
      attendancePercentage: st.attendancePercentage,
      feeStatus: st.feeStatus,
      cgpaOrGrade: st.cgpaOrGrade,
    });
    setEditModalOpen(true);
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudent.firstName || !formStudent.lastName || !formStudent.email) {
      error('Missing Information', 'First name, last name, and email are required.');
      return;
    }
    const created = await erpService.createStudent({
      ...formStudent,
      documents: [
        { name: 'Birth Certificate', type: 'PDF', status: 'VERIFIED' },
        { name: 'Transcript Transfer', type: 'PDF', status: 'VERIFIED' },
      ],
    });
    setStudents([created, ...students]);
    setAddModalOpen(false);
    success('Student Enrolled', `${created.fullName} has been created in SIS master records.`);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    const updated = await erpService.updateStudent(selectedStudent.id, formStudent);
    setStudents((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setEditModalOpen(false);
    success('Record Updated', `Profile for ${updated.fullName} has been updated.`);
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;
    await erpService.deleteStudent(selectedStudent.id);
    setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
    setConfirmDeleteOpen(false);
    success('Record Removed', `Student ${selectedStudent.fullName} removed from active roster.`);
  };

  // Filtered Students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const matchesCohort = cohortFilter === 'ALL' || s.cohortType === cohortFilter;
    return matchesSearch && matchesStatus && matchesCohort;
  });

  const columns: Column<Student>[] = [
    {
      key: 'admissionNumber',
      header: 'Admission #',
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-bold text-slate-800">{s.admissionNumber}</span>,
    },
    {
      key: 'fullName',
      header: 'Student Name',
      sortable: true,
      render: (s) => (
        <div>
          <div className="font-bold text-slate-900">{s.fullName}</div>
          <div className="text-[11px] text-slate-400">{s.email}</div>
        </div>
      ),
    },
    {
      key: 'className',
      header: 'Class / Program',
      sortable: true,
      render: (s) => (
        <div>
          <span className="font-semibold text-slate-800">{s.className}</span>
          <span className="text-[11px] text-slate-500 block">{s.sectionName}</span>
        </div>
      ),
    },
    {
      key: 'attendancePercentage',
      header: 'Attendance',
      sortable: true,
      render: (s) => (
        <span className={`font-semibold ${s.attendancePercentage >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
          {s.attendancePercentage}%
        </span>
      ),
    },
    {
      key: 'feeStatus',
      header: 'Fee Standing',
      sortable: true,
      render: (s) => <StatusBadge status={s.feeStatus} />,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (s) => (
        <div className="flex items-center justify-end space-x-1.5">
          <button
            onClick={() => {
              setSelectedStudent(s);
              setDetailModalOpen(true);
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
            title="View Full Profile Dossier"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(s)}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
            title="Edit Student Info"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedStudent(s);
              setConfirmDeleteOpen(true);
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 hover:text-rose-600 text-slate-600 transition-colors"
            title="Withdraw / Delete Record"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Student Information System (SIS)"
        subtitle="Master identity directory decoupled from annual classroom cohorts, complete with contact registry, academic standing, and documentation."
        breadcrumbs={[{ label: 'Student Information' }]}
        actions={
          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Bulk Import (CSV)
            </button>
            <button
              onClick={handleOpenAdd}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Student
            </button>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <DashboardCard
          title="Total Registered Students"
          value={students.length}
          subtitle="Master Database Profiles"
          icon={Users}
          colorTheme="blue"
        />
        <DashboardCard
          title="Active Standing"
          value={students.filter((s) => s.status === 'ACTIVE').length}
          subtitle="Currently Attending Classes"
          icon={CheckCircle2}
          colorTheme="emerald"
        />
        <DashboardCard
          title="K-12 School Cohort"
          value={students.filter((s) => s.cohortType === 'SCHOOL').length}
          subtitle="Grades 9 through 11"
          icon={GraduationCap}
          colorTheme="indigo"
        />
        <DashboardCard
          title="Higher Education College"
          value={students.filter((s) => s.cohortType === 'COLLEGE').length}
          subtitle="B.Tech & Technical Branches"
          icon={FileCheck}
          colorTheme="slate"
        />
      </div>

      {/* Search & Filter Bar */}
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by student name, admission #, roll #, email..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'All Statuses', value: 'ALL' },
              { label: 'Active', value: 'ACTIVE' },
              { label: 'Inactive', value: 'INACTIVE' },
              { label: 'Graduated', value: 'GRADUATED' },
              { label: 'Transferred', value: 'TRANSFERRED' },
            ],
          },
          {
            id: 'cohort',
            label: 'Institution Division',
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

      {/* Students Table */}
      <DataTable
        columns={columns}
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        isLoading={loading}
        pageSize={6}
        emptyMessage="No student profiles matching your search or filters."
      />

      {/* Modal: Add / Edit Student */}
      {(addModalOpen || editModalOpen) && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-slate-900">
                {addModalOpen ? 'Admit New Student to SIS' : `Edit Student Profile (${formStudent.admissionNumber})`}
              </h3>
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setEditModalOpen(false);
                }}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={addModalOpen ? handleCreateStudent : handleUpdateStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formStudent.firstName}
                    onChange={(e) => setFormStudent({ ...formStudent, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formStudent.lastName}
                    onChange={(e) => setFormStudent({ ...formStudent, lastName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Admission Number</label>
                  <input
                    type="text"
                    required
                    value={formStudent.admissionNumber}
                    onChange={(e) => setFormStudent({ ...formStudent, admissionNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Roll Number</label>
                  <input
                    type="text"
                    required
                    value={formStudent.rollNumber}
                    onChange={(e) => setFormStudent({ ...formStudent, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Class / Program *</label>
                  <input
                    type="text"
                    required
                    value={formStudent.className}
                    onChange={(e) => setFormStudent({ ...formStudent, className: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Section / Semester</label>
                  <input
                    type="text"
                    required
                    value={formStudent.sectionName}
                    onChange={(e) => setFormStudent({ ...formStudent, sectionName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Institutional Email *</label>
                  <input
                    type="email"
                    required
                    value={formStudent.email}
                    onChange={(e) => setFormStudent({ ...formStudent, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Student Phone</label>
                  <input
                    type="text"
                    value={formStudent.phone}
                    onChange={(e) => setFormStudent({ ...formStudent, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent Name</label>
                  <input
                    type="text"
                    value={formStudent.parentName}
                    onChange={(e) => setFormStudent({ ...formStudent, parentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Parent Phone</label>
                  <input
                    type="text"
                    value={formStudent.parentPhone}
                    onChange={(e) => setFormStudent({ ...formStudent, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">Residential Address</label>
                  <input
                    type="text"
                    value={formStudent.residentialAddress}
                    onChange={(e) => setFormStudent({ ...formStudent, residentialAddress: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddModalOpen(false);
                    setEditModalOpen(false);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm"
                >
                  {addModalOpen ? 'Save Student' : 'Update Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Full Student Profile Dossier */}
      {detailModalOpen && selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                  {selectedStudent.fullName.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{selectedStudent.fullName}</h3>
                  <div className="text-xs text-slate-400 font-mono">Admission ID: {selectedStudent.admissionNumber}</div>
                </div>
              </div>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold">Cohort Assigned:</span>
                  <span className="font-bold text-slate-800">{selectedStudent.className} ({selectedStudent.sectionName})</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Status:</span>
                  <StatusBadge status={selectedStudent.status} />
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Academic Standing:</span>
                  <span className="font-semibold text-emerald-700">{selectedStudent.cgpaOrGrade}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Attendance Record:</span>
                  <span className="font-semibold text-blue-700">{selectedStudent.attendancePercentage}% Present</span>
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1">Parent / Guardian Contact:</span>
                <p className="text-slate-600">{selectedStudent.parentName} • {selectedStudent.parentPhone} • {selectedStudent.parentEmail}</p>
                <p className="text-slate-500 mt-1">{selectedStudent.residentialAddress}</p>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-2">Verified Documents in Vault:</span>
                <div className="space-y-1.5">
                  {selectedStudent.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded border border-slate-100 bg-slate-50">
                      <span className="font-medium text-slate-700 flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {doc.name} ({doc.type})
                      </span>
                      <StatusBadge status={doc.status} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end mt-4">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Bulk CSV Import Interface Preview */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center">
              <Upload className="w-5 h-5 text-blue-600 mr-2" />
              Bulk Student CSV Importer
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Upload standardized `.csv` file with columns: `first_name`, `last_name`, `admission_no`, `class`, `gender`.
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">Drag & drop CSV file or browse</div>
              <div className="text-[11px] text-slate-400 mt-1">UTF-8 formatted CSV up to 10MB</div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex justify-end space-x-2 text-xs">
              <button
                onClick={() => setImportModalOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setImportModalOpen(false);
                  success('CSV Validated', 'Sample import processed 15 new student records.');
                }}
                className="px-4 py-1.5 rounded-lg bg-blue-600 text-white font-bold"
              >
                Simulate Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog: Delete Student */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        title="Withdraw / Remove Student?"
        message={`Are you sure you want to withdraw ${selectedStudent?.fullName} from the active institution directory? This action will archive their profile.`}
        confirmText="Confirm Archive"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteStudent}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </MainLayout>
  );
}
