import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import StudentPortal from '../pages/student';
import { AuthProvider } from '../context/AuthContext';

describe('StudentPortal Component', () => {
  it('renders student profile, attendance summary, transcript, and invoice details', () => {
    render(
      <AuthProvider>
        <StudentPortal />
      </AuthProvider>
    );

    // Profile & Attendance
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Attendance Rate: 91.7%')).toBeInTheDocument();
    expect(screen.getByText('Days Present')).toBeInTheDocument();

    // Transcript
    expect(screen.getByText('Academic Transcript & Report Card')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();

    // Invoices
    expect(screen.getByText('INV-2025-001')).toBeInTheDocument();
    const payButtons = screen.getAllByText(/Pay Balance/i);
    expect(payButtons.length).toBeGreaterThan(0);
  });

  it('opens payment checkout modal and executes payment transaction', () => {
    render(
      <AuthProvider>
        <StudentPortal />
      </AuthProvider>
    );

    const payBtn = screen.getAllByText(/Pay Balance/i)[0];
    fireEvent.click(payBtn);

    expect(screen.getByText(/Pay Invoice: INV-2025-001/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: /Confirm & Pay/i });
    fireEvent.click(confirmBtn);

    expect(screen.getByText(/Payment Successfully Processed/i)).toBeInTheDocument();
    expect(screen.getByText(/Receipt Number:/i)).toBeInTheDocument();
  });
});
