# EduNexus — Unified Educational ERP

[![Django](https://img.shields.io/badge/Django-5.1-092E20?logo=django)](https://www.djangoproject.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-4169E1?logo=postgresql)](https://www.postgresql.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

A production-grade, multi-tenant Educational Resource Planning (ERP) platform designed to support both K-12 primary/secondary schools and credit-based higher education colleges within a unified, high-integrity database architecture.

---

## Architecture Overview

EduNexus integrates an enterprise-grade Django 5.1 REST backend with Next.js 14, backed by PostgreSQL Row-Level Security (RLS) for multi-tenant isolation.

```
                    +-----------------------------+
                    |      Next.js 14 Client      |
                    |   (Admin, Faculty, Student) |
                    +--------------+--------------+
                                   |
                         JWT / REST API Calls
                                   |
                    +--------------v--------------+
                    |    Django 5.1 REST Backend  |
                    |  - Strict Admin Permissions |
                    |  - Tenant Middleware Context|
                    +--------------+--------------+
                                   |
                        SQL Session Context (RLS)
                                   |
                    +--------------v--------------+
                    |     PostgreSQL 18 Database  |
                    |  - Dual-Gate RLS Isolation  |
                    |  - Minor-Unit Currency Ledger|
                    +-----------------------------+
```

---

## Enterprise HRMS-Inspired Frontend Architecture

EduNexus features a modern enterprise UI inspired by modern HRMS and SaaS admin panels, built with **Next.js 14, TypeScript, Tailwind CSS, Lucide React, and Recharts**.

### Navigation & Layout Modules
- **Collapsible Sidebar (`AppSidebar`)**: Quick access to all modules with icons, module categorization, collapse toggle, and active route highlights.
- **Top Navigation Bar (`TopNavbar`)**: Global search (`Ctrl+K`), Academic Year pill (`AY 2025-2026`), dynamic **Role Switcher** (test from 8 persona perspectives), real-time notifications dropdown with unread badge, and user identity profile menu.
- **Role-Based Access Control (RBAC)**: Supports 8 distinct personas with automated route guards and UI button toggles:
  1. `Super Admin` (Full platform administrative access)
  2. `Administrator` (Institutional operations, admissions, and SIS directory)
  3. `Principal / Director` (Executive approvals, analytics reports, leadership oversight)
  4. `Teacher / Faculty` (Classroom roll call, session locking, assessment marks)
  5. `Accountant / Bursar` (Tuition ledgers, fee structures, partial payments, receipts)
  6. `HR / Staff Manager` (Employee directory, staff attendance, leave approval)
  7. `Student` (Personal attendance, fee vouchers, academic transcripts)
  8. `Parent` (Ward attendance, online tuition payment checkout, announcements)

### Core Operational Modules
1. **Information Page (`/information`)**: School/college overview, accreditation, address, contact registry, leadership desk, academic year milestones, and important notices.
2. **Dashboard (`/dashboard` & `/`)**: 8 KPI summary cards, Recharts visualizations (student enrollment trends, weekly attendance dynamics, quarterly fee collection targets vs actuals, department distribution donut), recent admissions, announcements, and live system activity log.
3. **My Profile (`/profile`)**: Personal details, institutional ID badge, residential address, contact details, role-permitted editing, password change with length and security validation, and communication preferences.
4. **Admissions (`/admissions`)**: Admissions pipeline metrics, new applicant intake modal, filterable candidate ledger, document verification checklist, status update actions (`Under Review`, `Approved`, `Rejected`), and printable admission confirmation letter preview.
5. **Attendance Management (`/attendance`)**: Dual-view module (Students vs Employees), date and cohort filters, bulk roll call (`Mark All Present`), individual `P / A / L / LV` toggle buttons, session audit-locking workflow (`Save & Lock Session`), and formal leave filing & approval sub-panel.
6. **Fees & Finance (`/finance`)**: Fiscal ledger with collection KPIs, fee category management, class-wise fee schedules, student accounts receivable table, partial payment recording modal with automatic minor-unit calculation, and printable payment receipt view.
7. **Communication Center (`/communication`)**: Announcements bulletin with priority tags, rich announcement composer with audience targeting (`Students`, `Parents`, `Teachers`, `Staff`), and interactive direct messaging thread mockup.
8. **Reports & Analytics (`/reports`)**: Configurable report generator with academic year/class/date filters, multi-metric preview tables (Attendance, Revenue, Admissions, Performance), Recharts trend charts, dynamic CSV export download, and print-friendly view.
9. **Student Information (`/students`)**: Master SIS directory, student detail modal/drawer with academic records, parent info, documents list, and attendance/fee standing; Add/Edit student form dialog with validation; Bulk CSV import interface preview.
10. **Classes & Sections (`/academics/classes`)**: School grade levels & classroom divisions, college departments & degree programs, teacher allocation, student rosters per section, and course credit catalogs.
11. **User Management (`/users`)**: Restricted admin portal, RBAC directory supporting 8 roles, user activation/deactivate toggle, role and permission assignment modal, and password reset workflow.
12. **Future Modules (`/coming-soon`)**: Extensible placeholders with "Coming Soon" badges for Timetable, Exams & Results, Library, Transport, Hostel, Inventory, and Certificates.

---

## Core Capabilities

1. **Strict Admin-Only Access Control**:
   - Backend-enforced authorization (`IsAdminOrReadOnly`, `IsInstitutionAdmin`).
   - Non-admin modification attempts strictly rejected with `HTTP 403 Forbidden`.
   - Unauthenticated API and page requests blocked with `HTTP 401 Unauthorized`.
   - Immutable database records upon failed or unauthorized write attacks.

2. **K-12 School Progression & Higher Education Framework**:
   - K-12: Grade levels, sections, annual cohorts, promotion rules, and roll-call homeroom attendance.
   - Higher-Ed: Academic departments, degree programs, semester course registration, credits, and SGPA/CGPA evaluation.

3. **Attendance & Roll Call**:
   - Session locking prevents post-hoc tampering.
   - Audit logging for administrative attendance corrections.

4. **Examinations & Grading**:
   - Dynamic grading scale tiers (Letter Grade Points and Percentage ranges).
   - Real-time GPA computation and automated assessment report locking.

5. **Financial Ledger & Fee Collection**:
   - Monetary values stored in integer minor currency units (cents / paise) eliminating floating-point rounding drift.
   - Granular invoice item allocation and multi-line item reconciliations.

6. **Operations & Logistics**:
   - Double-booking conflict prevention for rooms and time slots.
   - Library circulation ledger tracking book checkouts, returns, and inventory counts.
   - Transport routing and capacity tracking.

---

## Getting Started

### Prerequisites
- Python 3.12+ (or 3.13+)
- Node.js 18+ & npm
- PostgreSQL 16+ (or 18)

### 1. Clone & Setup Environment

```bash
git clone https://github.com/anirudha-1101-y/edunexus.git
cd edunexus
```

Copy the example environment configuration:
```bash
cp .env.example .env
```
Configure your PostgreSQL credentials in `.env`.

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations
python backend/manage.py migrate

# Seed initial demonstration data
python backend/manage.py seed_demo_data

# Start backend server
python backend/manage.py runserver 0.0.0.0:8000
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The web client will be available at `http://localhost:3000/`.

---

## Demo Credentials

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@edunexus.org` | `AdminPass123!` | Full SIS Administration, Admissions, Cohorts, Operations |
| **Faculty** | `teacher@apex.edu` | `TeacherPass123!` | Roll Call Attendance, Assessment Mark Entry |
| **Student** | `student@apex.edu` | `StudentPass123!` | Read-Only Transcript, Attendance Records, Invoices |

---

## Test Suites

```bash
# Run backend test suite (31 tests)
pytest backend/apps

# Run frontend Jest tests (18 tests)
npm test --prefix frontend

# Run Next.js production build verification
npm run build --prefix frontend
```
