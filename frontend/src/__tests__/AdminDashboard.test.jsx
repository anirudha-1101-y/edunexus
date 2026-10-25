import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from '../pages/admin';
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

describe('AdminDashboard Component', () => {
  beforeEach(() => {
    localStorage.clear();
    mockPush.mockClear();
    // Configure authenticated administrator session in localStorage
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        id: 'u-admin-1',
        email: 'admin@edunexus.org',
        is_platform_admin: true,
      })
    );
    localStorage.setItem(
      'user_memberships',
      JSON.stringify([
        {
          institution_id: 'inst-1',
          institution_name: 'EduNexus Central Admin',
          membership_type: 'STAFF',
          role_name: 'Institutional Admin',
        },
      ])
    );
    localStorage.setItem('active_institution_id', 'inst-1');
  });

  it('renders admin metrics, student table, and supports filtering for authorized admins', () => {
    render(
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    );

    // Verify key titles and metrics
    expect(screen.getByText('Institutional Administration')).toBeInTheDocument();
    expect(screen.getByText('Total Enrolled')).toBeInTheDocument();
    expect(screen.getByText('Access Control Status')).toBeInTheDocument();

    // Verify default students are listed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();

    // Test search filter
    const searchInput = screen.getByPlaceholderText(/Search by admission number/i);
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

    // Clear search filter
    fireEvent.change(searchInput, { target: { value: '' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('allows admitting a new student by authorized admin', () => {
    render(
      <AuthProvider>
        <AdminDashboard />
      </AuthProvider>
    );

    const admitBtn = screen.getByRole('button', { name: /\+ Admit Student/i });
    fireEvent.click(admitBtn);

    expect(screen.getByText('New Student 6')).toBeInTheDocument();
  });
});
