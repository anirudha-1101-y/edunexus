import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, UserAccount } from '../types/erp';
import { mockUserAccounts } from '../data/mockData';

interface RoleContextType {
  currentRole: UserRole;
  currentUser: UserAccount;
  switchRole: (role: UserRole) => void;
  canAccess: (permission: string) => boolean;
  canAccessModule: (modulePath: string) => boolean;
}

const RoleContext = createContext<RoleContextType | null>(null);

// Role permission mapping for enterprise security
const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  'Super Admin': ['*'],
  'Administrator': [
    'information', 'dashboard', 'profile', 'admissions', 'attendance',
    'finance', 'communication', 'reports', 'students', 'classes', 'users:view'
  ],
  'Principal': [
    'information', 'dashboard', 'profile', 'admissions:view', 'attendance:view',
    'finance:view', 'communication', 'reports', 'students', 'classes'
  ],
  'Teacher': [
    'information', 'dashboard', 'profile', 'attendance:mark', 'students:view',
    'classes:view', 'communication'
  ],
  'Accountant': [
    'information', 'dashboard', 'profile', 'finance', 'reports:finance',
    'students:view'
  ],
  'HR Manager': [
    'information', 'dashboard', 'profile', 'attendance:staff', 'users',
    'reports:staff', 'communication'
  ],
  'Student': [
    'information', 'dashboard', 'profile', 'attendance:own', 'finance:own',
    'communication:view'
  ],
  'Parent': [
    'information', 'dashboard', 'profile', 'attendance:child', 'finance:child',
    'communication:view'
  ],
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<UserRole>('Super Admin');
  const [currentUser, setCurrentUser] = useState<UserAccount>(mockUserAccounts[0]);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    const matchedUser = mockUserAccounts.find((u) => u.role === role) || {
      ...mockUserAccounts[0],
      name: `${role} User`,
      role,
      idNumber: `${role.slice(0, 3).toUpperCase()}-DEMO`,
    };
    setCurrentUser(matchedUser);
    if (typeof window !== 'undefined') {
      localStorage.setItem('active_demo_role', role);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('active_demo_role') as UserRole;
      if (stored && mockUserAccounts.some((u) => u.role === stored)) {
        switchRole(stored);
      }
    }
  }, []);

  const canAccess = (permission: string): boolean => {
    const perms = ROLE_PERMISSIONS[currentRole] || [];
    if (perms.includes('*')) return true;
    return perms.includes(permission);
  };

  const canAccessModule = (modulePath: string): boolean => {
    const perms = ROLE_PERMISSIONS[currentRole] || [];
    if (perms.includes('*')) return true;

    // Normalization
    const pathClean = modulePath.replace(/^\//, '').split('/')[0] || 'dashboard';

    // Everyone can access information, dashboard, profile
    if (['information', 'dashboard', 'profile', ''].includes(pathClean)) return true;

    if (currentRole === 'Student' || currentRole === 'Parent') {
      if (['admissions', 'classes', 'users'].includes(pathClean)) return false;
      if (pathClean === 'students') return false; // Students cannot see master directory
    }

    if (currentRole === 'Teacher' && ['finance', 'users', 'admissions'].includes(pathClean)) {
      return false;
    }

    if (currentRole === 'Accountant' && ['admissions', 'attendance', 'classes', 'users'].includes(pathClean)) {
      return false;
    }

    if (currentRole === 'HR Manager' && ['finance', 'admissions', 'classes'].includes(pathClean)) {
      return false;
    }

    if (pathClean === 'users' && !['Super Admin', 'Administrator', 'HR Manager'].includes(currentRole)) {
      return false;
    }

    return true;
  };

  return (
    <RoleContext.Provider
      value={{
        currentRole,
        currentUser,
        switchRole,
        canAccess,
        canAccessModule,
      }}
    >
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
