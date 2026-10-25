import React from 'react';
import Link from 'next/link';
import Header from '../components/Header';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, memberships, activeInstitutionId, activeMembership, switchInstitution, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        institutionName={activeMembership?.institution_name || 'EduNexus Platform'}
        userEmail={user?.email || 'admin@edunexus.org'}
        userRole={activeMembership?.role_name || 'Admin'}
        memberships={memberships}
        activeInstitutionId={activeInstitutionId}
        onSwitchInstitution={switchInstitution}
        onLogout={logout}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">EduNexus Unified Educational ERP</h1>
          <p className="text-base text-slate-600 mt-2 max-w-3xl">
            A production-grade, multi-tenant SaaS platform supporting both K-12 schools (grades, sections, annual cohorts, promotion)
            and higher education colleges (departments, credit-based courses, semesters, SGPA/CGPA) within a unified database architecture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card title="Institutional Administration" subtitle="Student Directory, Academics, Operations">
            <p className="text-sm text-slate-600 mb-4">
              Manage student admissions, annual school cohorts, college degree programs, timetable conflicts, and transport.
            </p>
            <Link href="/admin">
              <Button variant="primary" className="w-full justify-center">
                Open Admin Portal
              </Button>
            </Link>
          </Card>

          <Card title="Faculty Academic Desk" subtitle="Roll Call & Grade Sheets">
            <p className="text-sm text-slate-600 mb-4">
              Execute daily homeroom or period roll calls, apply session locking, and enter assessment marks with real-time GPA calculations.
            </p>
            <Link href="/teacher">
              <Button variant="secondary" className="w-full justify-center">
                Open Faculty Portal
              </Button>
            </Link>
          </Card>

          <Card title="Student & Parent Hub" subtitle="Attendance, Fees & Transcripts">
            <p className="text-sm text-slate-600 mb-4">
              Monitor attendance standing, review published report cards/transcripts, and settle invoices with minor-unit balance precision.
            </p>
            <Link href="/student">
              <Button variant="secondary" className="w-full justify-center">
                Open Student Portal
              </Button>
            </Link>
          </Card>
        </div>

        {/* DBMS Learning Mode Showcase Banner */}
        <div className="mt-12 bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
            <span>DBMS Architecture & Learning Mode</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">
            Dual-Gate Multi-Tenant Security & Zero Floating-Point Drift
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed mb-4">
            EduNexus enforces PostgreSQL 18 Row-Level Security (RLS) via <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">SET LOCAL app.current_institution_id</code> combined with Django ORM query scoping. All currency balances are computed using 64-bit integer minor currency units (<code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded">BIGINT</code>), eliminating rounding drift across fee allocations and payments.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block mb-1">Row-Level Security</span>
              <span className="text-slate-500">Dual-gate tenant isolation at ORM and Postgres database engine level.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block mb-1">Audit Trail</span>
              <span className="text-slate-500">Immutable correction logs for attendance sessions post-lockout.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block mb-1">Double Booking Check</span>
              <span className="text-slate-500">PostgreSQL exclusion constraints prevent room & faculty timetable overlaps.</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="font-semibold text-slate-800 block mb-1">Minor Unit Finance</span>
              <span className="text-slate-500">Strict <code className="text-blue-700">BIGINT</code> cents storage ensures 100% financial audit compliance.</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
