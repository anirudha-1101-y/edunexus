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
