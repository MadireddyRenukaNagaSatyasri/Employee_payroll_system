import api from './api.js';

export const payrollService = {
  /**
   * Generate or calculate monthly payroll for active employees
   */
  async generatePayroll(year, month) {
    const response = await api.post('/payroll/generate', { year, month });
    return response.data;
  },

  /**
   * Get payroll records list with filters
   */
  async getPayrollList(params = {}) {
    const response = await api.get('/payroll', { params });
    return response.data;
  },

  /**
   * Get single payroll breakdown by ID
   */
  async getPayrollById(id) {
    const response = await api.get(`/payroll/${id}`);
    return response.data;
  },

  /**
   * Update draft payroll adjustments
   */
  async updateDraftPayroll(id, data) {
    const response = await api.put(`/payroll/${id}`, data);
    return response.data;
  },

  /**
   * Finalize payroll (lock from edits)
   */
  async finalizePayroll(id) {
    const response = await api.patch(`/payroll/${id}/finalize`);
    return response.data;
  },

  /**
   * Reopen finalized payroll for corrections
   */
  async reopenPayroll(id, reason) {
    const response = await api.patch(`/payroll/${id}/reopen`, { reason });
    return response.data;
  },

  /**
   * Mark finalized payroll as paid
   */
  async markPayrollPaid(id, paymentData = {}) {
    const response = await api.patch(`/payroll/${id}/pay`, paymentData);
    return response.data;
  },

  /**
   * Delete draft payroll
   */
  async deletePayroll(id) {
    const response = await api.delete(`/payroll/${id}`);
    return response.data;
  },
};

export default payrollService;
