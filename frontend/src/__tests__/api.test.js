import apiClient from '../services/api';

describe('API Client Configuration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('attaches auth token and institution header from localStorage', async () => {
    localStorage.setItem('access_token', 'mock_access_jwt_token');
    localStorage.setItem('active_institution_id', 'inst-uuid-1234');

    const config = { headers: {} };
    // Call interceptor directly
    const interceptor = apiClient.interceptors.request.handlers[0];
    const updatedConfig = interceptor.fulfilled(config);

    expect(updatedConfig.headers.Authorization).toBe('Bearer mock_access_jwt_token');
    expect(updatedConfig.headers['X-Institution-ID']).toBe('inst-uuid-1234');
  });

  it('does not attach headers if localStorage is empty', () => {
    const config = { headers: {} };
    const interceptor = apiClient.interceptors.request.handlers[0];
    const updatedConfig = interceptor.fulfilled(config);

    expect(updatedConfig.headers.Authorization).toBeUndefined();
    expect(updatedConfig.headers['X-Institution-ID']).toBeUndefined();
  });
});
