import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { AppSidebar } from './AppSidebar';
import { TopNavbar } from './TopNavbar';
import { useRole } from '../../context/RoleContext';
import { ShieldAlert, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const router = useRouter();
  const { currentRole, canAccessModule, switchRole } = useRole();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Restore sidebar collapse state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sidebar_collapsed');
      if (stored === 'true') setIsSidebarCollapsed(true);
    }
  }, []);

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const isPermitted = canAccessModule(router.pathname);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <AppSidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Navbar */}
        <TopNavbar
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isPermitted ? (
            children
          ) : (
            <div className="bg-white rounded-2xl border border-rose-200 p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto my-8">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Access Restricted</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
                Your current active role (<span className="font-bold text-rose-700">{currentRole}</span>) does not have
                permission to access this administrative module.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  Return to Dashboard
                </Link>
                <button
                  onClick={() => switchRole('Super Admin')}
                  className="inline-flex items-center px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" />
                  Switch to Super Admin
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
