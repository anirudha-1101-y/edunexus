import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../pages/login';
import { AuthProvider } from '../context/AuthContext';

jest.mock('next/router', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      prefetch: jest.fn(),
    };
  },
}));

describe('LoginPage', () => {
  it('renders login form elements with credentials inputs', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    expect(screen.getByText('EduNexus ERP')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('updates form values on user input', () => {
    render(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>
    );

    const emailInput = screen.getByLabelText(/Email address/i);
    const passInput = screen.getByLabelText(/Password/i);

    fireEvent.change(emailInput, { target: { value: 'teacher@institution.edu' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('teacher@institution.edu');
    expect(passInput.value).toBe('password123');
  });
});
