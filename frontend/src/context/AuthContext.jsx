import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [activeInstitutionId, setActiveInstitutionId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restore session on client mount
    if (typeof window !== 'undefined') {
      try {
        const storedUser = localStorage.getItem('user_data');
        const storedMemberships = localStorage.getItem('user_memberships');
        const storedInstId = localStorage.getItem('active_institution_id');

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
        if (storedMemberships) {
          setMemberships(JSON.parse(storedMemberships));
        }
        if (storedInstId) {
          setActiveInstitutionId(storedInstId);
        }
      } catch (err) {
        console.error('Failed to parse cached session', err);
      } finally {
        setIsLoading(false);
      }
    }
  }, []);

  const login = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login/', { email, password });
      const responseData = response.data.data || response.data;
      const { tokens, user: userData, memberships: userMemberships, active_institution_id } = responseData;
      const access = tokens?.access || responseData.access;
      const refresh = tokens?.refresh || responseData.refresh;

      if (access) {
        localStorage.setItem('access_token', access);
      }
      if (refresh) {
        localStorage.setItem('refresh_token', refresh);
      }

      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('user_memberships', JSON.stringify(userMemberships || []));

      setUser(userData);
      setMemberships(userMemberships || []);

      let initialInstId = active_institution_id;
      if (!initialInstId && userMemberships && userMemberships.length > 0) {
        initialInstId = userMemberships[0].institution_id;
      }
      if (initialInstId) {
        localStorage.setItem('active_institution_id', initialInstId);
      }
      setActiveInstitutionId(initialInstId);

      return { success: true, user: userData };
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.non_field_errors?.[0] ||
        'Authentication failed. Please verify your credentials.';
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        apiClient.post('/auth/logout/', { refresh: refreshToken }).catch(() => {});
      }
    } catch (err) {
      // Continue client cleanup even if network request fails
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_memberships');
      localStorage.removeItem('active_institution_id');
      setUser(null);
      setMemberships([]);
      setActiveInstitutionId(null);
    }
  };

  const switchInstitution = async (institutionId) => {
    try {
      await apiClient.post('/auth/switch-institution/', { institution_id: institutionId });
      localStorage.setItem('active_institution_id', institutionId);
      setActiveInstitutionId(institutionId);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Failed to switch institution tenant.',
      };
    }
  };

  const activeMembership = memberships.find((m) => m.institution_id === activeInstitutionId) || null;

  // Strict Administrator authorization determination
  const isAdmin = Boolean(
    user?.is_platform_admin ||
    user?.is_staff ||
    user?.is_superuser ||
    activeMembership?.membership_type === 'STAFF' ||
    activeMembership?.membership_type === 'ADMIN' ||
    (activeMembership?.role_name && ['ADMIN', 'PRINCIPAL', 'DEAN', 'ADMINISTRATOR'].some(r => activeMembership.role_name.toUpperCase().includes(r))) ||
    activeMembership?.roles?.some(r =>
      ['ADMIN', 'INSTITUTION_ADMIN', 'ADMINISTRATOR', 'PRINCIPAL', 'DEAN'].includes((r.code || r.name || '').toUpperCase())
    )
  );

  const value = {
    user,
    memberships,
    activeInstitutionId,
    activeMembership,
    isAuthenticated: !!user,
    isAdmin,
    isLoading,
    login,
    logout,
    switchInstitution,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
