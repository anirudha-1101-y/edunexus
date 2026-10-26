import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  Info,
  LayoutDashboard,
  User,
  UserPlus,
  CalendarCheck,
  CreditCard,
  MessageSquare,
  BarChart3,
  GraduationCap,
  BookOpen,
  Users,
  Clock,
  BookMarked,
  Bus,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useRole } from '../../context/RoleContext';

interface AppSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}) => {
  const router = useRouter();
  const { currentRole, canAccessModule } = useRole();

  const mainModules = [
    { label: 'Information Page', path: '/information', icon: Info },
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'My Profile', path: '/profile', icon: User },
    { label: 'Admissions', path: '/admissions', icon: UserPlus },
    { label: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { label: 'Fees & Finance', path: '/finance', icon: CreditCard },
    { label: 'Communication', path: '/communication', icon: MessageSquare },
    { label: 'Reports & Analytics', path: '/reports', icon: BarChart3 },
    { label: 'Student Information', path: '/students', icon: GraduationCap },
    { label: 'Classes & Sections', path: '/academics/classes', icon: BookOpen },
    { label: 'User Management', path: '/users', icon: Users, adminOnly: true },
  ];

  const comingSoonModules = [
    { label: 'Timetable', icon: Clock },
    { label: 'Library & Media', icon: BookMarked },
    { label: 'Transport Fleet', icon: Bus },
    { label: 'Certificates & Docs', icon: FileText },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard' && router.pathname === '/') return true;
    return router.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-slate-900 text-slate-300 border-r border-slate-800 transition-all duration-300 ease-in-out flex flex-col ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 bg-slate-950/40">
          <Link href="/dashboard" className="flex items-center space-x-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-md flex-shrink-0">
              E
            </div>
            {!isCollapsed && (
              <div className="flex flex-col truncate">
                <span className="text-base font-extrabold text-white tracking-tight leading-none">EduNexus</span>
                <span className="text-[11px] font-medium text-blue-400 mt-1 uppercase tracking-wider">Enterprise ERP</span>
              </div>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Section */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Core Operations
              </div>
            )}
            <nav className="space-y-1">
              {mainModules.map((item) => {
                const isPermitted = canAccessModule(item.path);
                const active = isActive(item.path);

                if (!isPermitted) {
                  return null; // Hide unauthorized module for this role
                }

                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={() => onCloseMobile()}
                    className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'} ${isCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Future Modules Section */}
          {!isCollapsed && (
            <div>
              <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <span>Extensions</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-slate-800 text-blue-400 rounded font-normal lowercase">roadmap</span>
              </div>
              <div className="space-y-1">
                {comingSoonModules.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={idx}
                      href="/coming-soon"
                      onClick={() => onCloseMobile()}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors group"
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-slate-300 flex-shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-medium">Soon</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Role Badge */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          {!isCollapsed ? (
            <div className="flex items-center justify-between bg-slate-800/70 px-3 py-2.5 rounded-xl border border-slate-700/60">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-bold text-white truncate">{currentRole}</div>
                  <div className="text-[10px] text-slate-400">Role-Based Access</div>
                </div>
              </div>
              <Sparkles className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            </div>
          ) : (
            <div className="flex justify-center" title={`Active Role: ${currentRole}`}>
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
