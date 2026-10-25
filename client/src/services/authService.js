import api from './api.js';

export const authService = {
  /**
   * Log in admin with credentials
   */
  async login(email, password) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  /**
   * Fetch current authenticated admin profile
   */
  async getProfile() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Change current admin password
   */
  async changePassword(currentPassword, newPassword) {
    const response = await api.put('/auth/change-password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  /**
   * Logout helper (clears local credentials)
   */
  logout() {
    localStorage.removeItem('payroll_admin_token');
    localStorage.removeItem('payroll_admin_user');
  },
};

export default authService;
