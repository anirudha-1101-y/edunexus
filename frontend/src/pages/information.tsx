import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { erpService } from '../services/erpService';
import { InstitutionInfo, Announcement } from '../types/erp';
import {
  School,
  Mail,
  Phone,
  Globe,
  MapPin,
  Award,
  Calendar,
  Users,
  Building2,
  ExternalLink,
  GraduationCap,
  CreditCard,
  CalendarCheck,
  UserPlus,
  ArrowRight,
  Bell,
  Clock,
} from 'lucide-react';

export default function InformationPage() {
  const [institution, setInstitution] = useState<InstitutionInfo | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [instData, annData] = await Promise.all([
          erpService.getInstitutionInfo(),
          erpService.getAnnouncements(),
        ]);
        setInstitution(instData);
        setAnnouncements(annData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !institution) {
    return (
      <MainLayout>
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Loading institution overview...</p>
        </div>
      </MainLayout>
    );
  }

  const quickLinks = [
    { title: 'Admissions Desk', desc: 'Process new candidate intakes and registrations', href: '/admissions', icon: UserPlus, color: 'text-blue-600 bg-blue-50' },
    { title: 'Daily Attendance', desc: 'Classroom roll call & leave approvals', href: '/attendance', icon: CalendarCheck, color: 'text-emerald-600 bg-emerald-50' },
    { title: 'Fee Collection', desc: 'Tuition ledger, balance billing & receipts', href: '/finance', icon: CreditCard, color: 'text-amber-600 bg-amber-50' },
    { title: 'Student Directory', desc: 'Master SIS student roster and profiles', href: '/students', icon: GraduationCap, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Institution Overview & Directory"
        subtitle="Institutional accreditation profile, campus contact registry, academic calendar milestones, and notices."
        breadcrumbs={[{ label: 'Information Desk' }]}
        actions={
          <div className="flex items-center space-x-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Accredited Tier 1 Institute
            </span>
          </div>
        }
      />

      {/* Hero Welcome Card */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-md mb-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-4 border border-white/15">
            <School className="w-3.5 h-3.5" />
            <span>EduNexus Verified Institution • Est. {institution.establishedYear}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{institution.name}</h2>
          <p className="mt-2 text-slate-200 text-sm leading-relaxed">{institution.tagline}</p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-blue-100">
            <div className="flex items-center space-x-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Affiliation: {institution.affiliationNumber}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{institution.totalStudents} Enrolled Students</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Building2 className="w-4 h-4 text-blue-300" />
              <span>Campus Area: {institution.campusArea}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Column: Campus Registry & Executive Leadership */}
        <div className="lg:col-span-2 space-y-6">
          {/* Institutional Contact Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 text-blue-600 mr-2" />
              Contact & Campus Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <MapPin className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 uppercase font-semibold block">Campus Address</span>
                  <span className="font-medium text-slate-800">{institution.address}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Mail className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 uppercase font-semibold block">Office of Admissions</span>
                  <a href={`mailto:${institution.email}`} className="font-medium text-blue-600 hover:underline">
                    {institution.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Phone className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 uppercase font-semibold block">Helpline / Switchboard</span>
                  <span className="font-medium text-slate-800">{institution.phone}</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
                <Globe className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-slate-400 uppercase font-semibold block">Official Web Portal</span>
                  <a href={institution.website} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline inline-flex items-center">
                    {institution.website}
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Year Milestones */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
              <Calendar className="w-5 h-5 text-blue-600 mr-2" />
              Academic Term Milestones ({institution.currentAcademicYear})
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-lg border border-emerald-100 bg-emerald-50/50">
                <div>
                  <div className="text-xs font-bold text-slate-900">Fall Semester & School Term 1</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Jun 01, 2025 — Oct 31, 2025</div>
                </div>
                <StatusBadge status="ACTIVE" />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <div className="text-xs font-bold text-slate-900">Mid-Term Assessment & Project Moderation</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Nov 10, 2025 — Nov 25, 2025</div>
                </div>
                <StatusBadge status="PENDING" />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50">
                <div>
                  <div className="text-xs font-bold text-slate-900">Spring Semester & School Term 2</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Dec 01, 2025 — May 31, 2026</div>
                </div>
                <StatusBadge status="PENDING" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Links & Important Notices */}
        <div className="space-y-6">
          {/* Quick Action Navigation Cards */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider text-xs text-slate-400">
              Quick Module Navigation
            </h3>
            <div className="space-y-2.5">
              {quickLinks.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={idx}
                    href={item.href}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-blue-200 hover:bg-blue-50/40 transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1">{item.desc}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Important Notices */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center">
                <Bell className="w-4 h-4 text-rose-500 mr-2" />
                Important Notices
              </h3>
              <Link href="/communication" className="text-xs text-blue-600 font-semibold hover:underline">
                View All
              </Link>
            </div>

            <div className="space-y-3">
              {announcements.slice(0, 3).map((ann) => (
                <div key={ann.id} className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <StatusBadge status={ann.priority} />
                    <span className="text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {ann.publishDate}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 leading-snug">{ann.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{ann.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
