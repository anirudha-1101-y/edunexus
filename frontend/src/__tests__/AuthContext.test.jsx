import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../context/AuthContext';
import apiClient from '../services/api';

jest.mock('../services/api');

function TestConsumer() {
  const { user, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Guest'}</div>
      <div data-testid="user-email">{user ? user.email : 'None'}</div>
      <button
        onClick={() => login('admin@apex.edu', 'secret')}
        data-testid="login-btn"
      >
        Login
      </button>
      <button onClick={logout} data-testid="logout-btn">
        Logout
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('provides default guest state and handles login and logout lifecycle', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        access: 'mock_jwt_access',
        refresh: 'mock_jwt_refresh',
        user: { id: 'u1', email: 'admin@apex.edu' },
        memberships: [{ institution_id: 'inst-1', institution_name: 'Apex School' }],
      },
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('Guest');
    expect(screen.getByTestId('user-email').textContent).toBe('None');

    await act(async () => {
      screen.getByTestId('login-btn').click();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('Authenticated');
    expect(screen.getByTestId('user-email').textContent).toBe('admin@apex.edu');
    expect(localStorage.getItem('access_token')).toBe('mock_jwt_access');

    act(() => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('auth-status').textContent).toBe('Guest');
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
