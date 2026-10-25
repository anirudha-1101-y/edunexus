import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminDashboard from '../pages/admin';
import Header from '../components/Header';
import { AuthProvider } from '../context/AuthContext';

const mockPush = jest.fn();

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: mockPush,
      prefetch: jest.fn(),
    };
  },
}));

describe('Frontend Strict Admin-Only Access Control', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
  });

  it('redirects unauthenticated users to the login page', () => {
    // No user session stored
    render(
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    );

    // Verify unauthenticated message and redirect trigger
    expect(screen.getByText(/Redirecting to login portal.../i)).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('denies access (HTTP 403 Forbidden UI) to non-admin users and hides management controls', () => {
    // Configure regular student session
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        id: 'u-student-1',
        email: 'student@edunexus.org',
        is_platform_admin: false,
        is_staff: false,
      })
    );
    localStorage.setItem(
      'user_memberships',
      JSON.stringify([
        {
          institution_id: 'inst-1',
          institution_name: 'Apex High School',
          membership_type: 'STUDENT',
          role_name: 'Student',
        },
      ])
    );
    localStorage.setItem('active_institution_id', 'inst-1');

    render(
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    );

    // Verify 403 Forbidden display
    expect(screen.getByText('403')).toBeInTheDocument();
    expect(screen.getByText(/Access Denied: Administrator Privileges Required/i)).toBeInTheDocument();
    expect(screen.getByText(/Only verified institutional administrators have access/i)).toBeInTheDocument();

    // Verify management controls and student roster are NOT rendered
    expect(screen.queryByRole('button', { name: /\+ Admit Student/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Total Enrolled')).not.toBeInTheDocument();
  });

  it('hides the Admin navigation link in Header for non-admin users', () => {
    const { rerender } = render(
      <Header
        institutionName="Apex High School"
        userEmail="student@apex.edu"
        isAdmin={false}
      />
    );

    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Teacher' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Student' })).toBeInTheDocument();

    // Rerender with isAdmin={true}
    rerender(
      <Header
        institutionName="Apex High School"
        userEmail="admin@apex.edu"
        isAdmin={true}
      />
    );

    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
  });
});
