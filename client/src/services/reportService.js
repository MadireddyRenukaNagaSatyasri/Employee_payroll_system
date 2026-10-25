import api from './api.js';

export const reportService = {
  /**
   * Fetch monthly payroll report data
   */
  async getMonthlyPayrollReport(year, month) {
    const response = await api.get('/reports/payroll', { params: { year, month } });
    return response.data;
  },

  /**
   * Fetch employee directory report data
   */
  async getEmployeeListReport(params = {}) {
    const response = await api.get('/reports/employees', { params });
    return response.data;
  },

  /**
   * Fetch department summary report data
   */
  async getDepartmentSummaryReport() {
    const response = await api.get('/reports/departments');
    return response.data;
  },

  /**
   * Fetch attendance report data
   */
  async getAttendanceReport(year, month, department) {
    const response = await api.get('/reports/attendance', { params: { year, month, department } });
    return response.data;
  },

  /**
   * Fetch salary component breakdown
   */
  async getSalaryBreakdownReport(year, month) {
    const response = await api.get('/reports/salary-breakdown', { params: { year, month } });
    return response.data;
  },

  /**
   * Helper to download CSV directly
   */
  downloadCsv(endpoint, filename, params = {}) {
    const queryParams = new URLSearchParams({ ...params, format: 'csv' }).toString();
    const token = localStorage.getItem('payroll_admin_token');
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const url = `${baseUrl}${endpoint}?${queryParams}`;

    // Fetch as blob with Authorization header
    fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      })
      .catch((err) => alert('Failed to download CSV: ' + err.message));
  },
};

export default reportService;
