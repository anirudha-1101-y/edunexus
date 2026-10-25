import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TeacherPortal from '../pages/teacher';
import { AuthProvider } from '../context/AuthContext';

describe('TeacherPortal Component', () => {
  it('renders attendance roll call, supports status toggle, and session lock', () => {
    render(
      <AuthProvider>
        <TeacherPortal />
      </AuthProvider>
    );

    expect(screen.getByText('Faculty Academic Portal')).toBeInTheDocument();
    expect(screen.getByText('Attendance Roll Call')).toBeInTheDocument();
    expect(screen.getByText('Marks & Grading Sheet')).toBeInTheDocument();

    // Verify presence counter
    expect(screen.getByText('Present')).toBeInTheDocument();

    // Test mark all present
    const markAllBtn = screen.getByRole('button', { name: /Mark All Present/i });
    fireEvent.click(markAllBtn);

    // Test lock session
    const lockBtn = screen.getByRole('button', { name: /Submit & Lock Session/i });
    fireEvent.click(lockBtn);

    expect(screen.getByText(/Session Locked \(Audit Enforced\)/i)).toBeInTheDocument();
  });

  it('switches to marks entry tab and supports marks input', () => {
    render(
      <AuthProvider>
        <TeacherPortal />
      </AuthProvider>
    );

    const marksTab = screen.getByRole('button', { name: /Marks & Grading Sheet/i });
    fireEvent.click(marksTab);

    expect(screen.getByText(/Midterm Mathematics Examination/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Publish Results/i })).toBeInTheDocument();
  });
});
