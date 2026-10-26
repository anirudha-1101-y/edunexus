import React from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import {
  Clock,
  BookMarked,
  Bus,
  Home,
  Package,
  FileCheck2,
  CalendarDays,
  LifeBuoy,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

export default function ComingSoonPage() {
  const upcomingModules = [
    {
      title: 'Timetable & Conflict Detection',
      desc: 'Automatic room scheduling, faculty conflict avoidance, and period-wise timetable generation.',
      icon: Clock,
      badge: 'Phase 2 Architecture',
    },
    {
      title: 'Library Circulation & Accession',
      desc: 'Book issue/return ledgers, barcode scanning, overdue fine calculator, and digital repository links.',
      icon: BookMarked,
      badge: 'Backend Ready',
    },
    {
      title: 'Campus Transport & Fleet',
      desc: 'GPS vehicle routes, passenger occupancy limits, driver rosters, and stop-wise fee mapping.',
      icon: Bus,
      badge: 'In Development',
    },
    {
      title: 'Hostel & Residential Quarters',
      desc: 'Room allocation, warden check-ins, mess billing, and curfew logs.',
      icon: Home,
      badge: 'Planned',
    },
    {
      title: 'Inventory & Institutional Assets',
      desc: 'Stationery stocks, laboratory equipment lifecycle, maintenance contracts, and procurement.',
      icon: Package,
      badge: 'Planned',
    },
    {
      title: 'Certificates & Bonafide Issuance',
      desc: 'Automated transfer certificate (TC) generation, character certificates, and verified QR codes.',
      icon: FileCheck2,
      badge: 'Planned',
    },
    {
      title: 'Academic Calendar & Events',
      desc: 'Term schedules, holiday calendars, faculty duty rosters, and university sports meets.',
      icon: CalendarDays,
      badge: 'Planned',
    },
    {
      title: 'Help Desk & IT Ticket Support',
      desc: 'Staff ticket tracking, student grievance redressal, and SLA escalation policies.',
      icon: LifeBuoy,
      badge: 'Planned',
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Enterprise Roadmap & Extension Modules"
        subtitle="These modules are configured in the database architecture and will be brought online in upcoming release phases."
        breadcrumbs={[{ label: 'Roadmap' }]}
        actions={
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Roadmap Overview
          </span>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {upcomingModules.map((mod, idx) => {
          const Icon = mod.icon;
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                    Coming Soon
                  </span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 leading-snug">{mod.title}</h3>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{mod.desc}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>{mod.badge}</span>
                <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline flex items-center">
                  Back to Hub
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </MainLayout>
  );
}
