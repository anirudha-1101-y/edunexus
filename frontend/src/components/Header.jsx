import React, { useState } from 'react';
import Link from 'next/link';

export default function Header({
  institutionName,
  userEmail,
  onSwitchInstitution,
  memberships = [],
  activeInstitutionId,
  userRole,
  onLogout,
  isAdmin = true,
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const displayInstName = institutionName || 'EduNexus Platform';
  const displayEmail = userEmail || 'user@edunexus.org';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Navigation */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-bold text-blue-600 tracking-tight">EduNexus</span>
            </Link>

            <span className="text-slate-300">|</span>

            {/* Tenant Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-md transition-colors"
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                <span>{displayInstName}</span>
                <span className="text-xs text-slate-400">▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1 z-50">
                  <div className="px-4 py-2 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Assigned Institutions
                  </div>
                  {memberships.length > 0 ? (
                    memberships.map((m) => (
                      <button
                        key={m.institution_id || m.id}
                        type="button"
                        onClick={() => {
                          if (onSwitchInstitution) {
                            onSwitchInstitution(m.institution_id || m.id);
                          }
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center justify-between ${
                          (m.institution_id || m.id) === activeInstitutionId
                            ? 'text-blue-600 font-semibold bg-blue-50/50'
                            : 'text-slate-700'
                        }`}
                      >
                        <span className="truncate">{m.institution_name || m.name}</span>
                        <span className="text-xs text-slate-400 capitalize">{m.role_name || 'Member'}</span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-slate-500">
                      Current: {displayInstName}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Links: Admin link hidden if user does not have admin permissions */}
            <nav className="hidden md:flex space-x-4 text-sm font-medium text-slate-600">
              {isAdmin && (
                <Link href="/admin" className="hover:text-blue-600 transition-colors">
                  Admin
                </Link>
              )}
              <Link href="/teacher" className="hover:text-blue-600 transition-colors">
                Teacher
              </Link>
              <Link href="/student" className="hover:text-blue-600 transition-colors">
                Student
              </Link>
            </nav>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-4">
            {userRole && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                {userRole}
              </span>
            )}
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Signed in as</span>
              <span className="text-sm font-medium text-slate-800">{displayEmail}</span>
            </div>
            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-slate-500 hover:text-red-600 font-medium px-2 py-1 rounded border border-slate-200 hover:border-red-200 transition-colors"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
