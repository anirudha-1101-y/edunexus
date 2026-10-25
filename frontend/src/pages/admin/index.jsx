import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Header from '../../components/Header';
import Card from '../../components/Card';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function AdminDashboard() {
  const router = useRouter();
  const {
    user,
    memberships,
    activeInstitutionId,
    activeMembership,
    switchInstitution,
    logout,
    isAuthenticated,
    isAdmin,
    isLoading
  } = useAuth();

  const [activeTab, setActiveTab] = useState('students');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Handle redirect if unauthenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Initial administrative dataset
  const [students, setStudents] = useState([
    { id: '1', admissionNumber: 'ADM-2025-001', name: 'John Doe', rollNumber: 'A-101', cohort: 'Grade 10 - Section A', status: 'ENROLLED', type: 'SCHOOL' },
    { id: '2', admissionNumber: 'ADM-2025-002', name: 'Alice Smith', rollNumber: 'CS-301', cohort: 'B.Tech CSE - Sem 3', status: 'ENROLLED', type: 'COLLEGE' },
    { id: '3', admissionNumber: 'ADM-2025-003', name: 'Robert Johnson', rollNumber: 'A-102', cohort: 'Grade 10 - Section A', status: 'PROMOTED', type: 'SCHOOL' },
    { id: '4', admissionNumber: 'ADM-2025-004', name: 'Emily Brown', rollNumber: 'CS-302', cohort: 'B.Tech CSE - Sem 3', status: 'WITHDRAWN', type: 'COLLEGE' },
    { id: '5', admissionNumber: 'ADM-2025-005', name: 'Michael Davis', rollNumber: 'B-201', cohort: 'Grade 9 - Section B', status: 'ENROLLED', type: 'SCHOOL' },
  ]);

  const [classes] = useState([
    { id: 'c1', name: 'Grade 9', sequence: 9, sections: ['Section A', 'Section B'], studentCount: 64 },
    { id: 'c2', name: 'Grade 10', sequence: 10, sections: ['Section A', 'Section B'], studentCount: 58 },
    { id: 'c3', name: 'Grade 11', sequence: 11, sections: ['Science', 'Commerce'], studentCount: 72 },
  ]);

  const [departments] = useState([
    { id: 'd1', code: 'CSE', name: 'Computer Science & Engineering', programs: 2, courses: 14, studentCount: 180 },
    { id: 'd2', code: 'ECE', name: 'Electronics & Communication', programs: 1, courses: 10, studentCount: 120 },
    { id: 'd3', code: 'MECH', name: 'Mechanical Engineering', programs: 1, courses: 8, studentCount: 95 },
  ]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 text-sm font-medium">Verifying administrator authorization...</div>
      </div>
    );
  }

  // Unauthenticated fallback
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600 text-sm font-medium">Redirecting to login portal...</div>
      </div>
    );
  }

  // Unauthorized (Non-Admin) state: HTTP 403 Forbidden Access Denied
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Header
          institutionName={activeMembership?.institution_name || 'EduNexus Platform'}
          userEmail={user?.email || 'user@edunexus.org'}
          userRole={activeMembership?.membership_type || 'User'}
          memberships={memberships}
          activeInstitutionId={activeInstitutionId}
          onSwitchInstitution={switchInstitution}
          onLogout={logout}
          isAdmin={false}
        />

        <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="bg-white rounded-lg border border-red-200 p-8 shadow-sm">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-4">
              403
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied: Administrator Privileges Required</h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
              You do not have permission to access the Institutional Administration portal or modify project data.
              Only verified institutional administrators have access to admissions and cohort records.
            </p>
            <Button variant="primary" onClick={() => router.push('/')}>
              Return to Platform Home
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        institutionName={activeMembership?.institution_name || 'EduNexus Central Admin'}
        userEmail={user?.email || 'admin@edunexus.org'}
        userRole="Institutional Admin"
        memberships={memberships}
        activeInstitutionId={activeInstitutionId}
        onSwitchInstitution={switchInstitution}
        onLogout={logout}
        isAdmin={true}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Title & Quick Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Institutional Administration</h1>
            <p className="text-sm text-slate-600 mt-1">
              Strict Admin-Only Portal: SIS admissions, academic cohorts, faculty allocation, and fiscal audits.
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button variant="secondary" onClick={() => alert('Exporting Master Institutional Report...')}>
              Export Data
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                const newAdm = `ADM-2025-00${students.length + 1}`;
                const newStudent = {
                  id: String(students.length + 1),
                  admissionNumber: newAdm,
                  name: `New Student ${students.length + 1}`,
                  rollNumber: `R-${100 + students.length + 1}`,
                  cohort: 'Grade 10 - Section A',
                  status: 'ENROLLED',
                  type: 'SCHOOL',
                };
                setStudents([...students, newStudent]);
              }}
            >
              + Admit Student
            </Button>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-extrabold text-slate-900">{students.length}</span>
              <span className="ml-2 text-xs font-medium text-emerald-600">+12% this term</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Active SIS Profiles</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Units</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-extrabold text-slate-900">{classes.length + departments.length}</span>
              <span className="ml-2 text-xs text-slate-500">Classes & Depts</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Configured Cohorts</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fee Collection</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-3xl font-extrabold text-slate-900">94.2%</span>
              <span className="ml-2 text-xs font-medium text-emerald-600">Minor-unit precise</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Zero balance drift</div>
          </div>

          <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Control Status</div>
            <div className="mt-2 flex items-baseline">
              <span className="text-2xl font-bold text-emerald-700">Admin Only</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Backend Enforced (RBAC & RLS)</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 mb-6 space-x-6">
          <button
            onClick={() => setActiveTab('students')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'students'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Student Directory ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('academics')}
            className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'academics'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Academic Structure
          </button>
        </div>

        {/* Tab 1: Students Roster */}
        {activeTab === 'students' && (
          <div className="bg-white shadow-sm rounded-lg border border-slate-200 overflow-hidden">
            {/* Filter and Search Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <input
                  type="text"
                  placeholder="Search by admission number, name or roll..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-3 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-slate-300 rounded-md text-xs py-1.5 px-2.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ENROLLED">Enrolled</option>
                  <option value="PROMOTED">Promoted</option>
                  <option value="WITHDRAWN">Withdrawn</option>
                </select>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Admission #</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Roll #</th>
                    <th className="px-6 py-3">Cohort / Program</th>
                    <th className="px-6 py-3">Domain</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-800">{st.admissionNumber}</td>
                        <td className="px-6 py-4 font-medium text-slate-900">{st.name}</td>
                        <td className="px-6 py-4 text-slate-600">{st.rollNumber}</td>
                        <td className="px-6 py-4 text-slate-600">{st.cohort}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                              st.type === 'SCHOOL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {st.type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                              st.status === 'ENROLLED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : st.status === 'PROMOTED'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {st.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                        No students matching the criteria found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: Academic Structure */}
        {activeTab === 'academics' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* School Classes Card */}
            <Card title="K-12 School Classes & Sections" subtitle="Standard annual cohort progression">
              <div className="divide-y divide-slate-100 mt-2">
                {classes.map((cls) => (
                  <div key={cls.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">{cls.name}</div>
                      <div className="text-xs text-slate-500">
                        Sections: {cls.sections.join(', ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-700">{cls.studentCount}</span>
                      <span className="text-xs text-slate-400 block">Students</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* College Departments Card */}
            <Card title="Higher-Ed College Departments" subtitle="Credit-based semester degree programs">
              <div className="divide-y divide-slate-100 mt-2">
                {departments.map((dept) => (
                  <div key={dept.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-sm text-slate-800">
                        {dept.name} <span className="text-xs text-slate-400 font-normal">({dept.code})</span>
                      </div>
                      <div className="text-xs text-slate-500">
                        {dept.programs} Degree Programs • {dept.courses} Active Courses
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-slate-700">{dept.studentCount}</span>
                      <span className="text-xs text-slate-400 block">Enrolled</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
