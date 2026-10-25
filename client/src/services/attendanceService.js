import api from './api.js';

export const attendanceService = {
  /**
   * Get attendance for all active employees for a given date
   */
  async getAttendanceByDate(date) {
    const response = await api.get('/attendance/date', { params: { date } });
    return response.data;
  },

  /**
   * Record single attendance
   */
  async recordAttendance(data) {
    const response = await api.post('/attendance', data);
    return response.data;
  },

  /**
   * Record bulk attendance for a date
   */
  async recordBatchAttendance(date, records) {
    const response = await api.post('/attendance/batch', { date, records });
    return response.data;
  },

  /**
   * Get monthly attendance summary
   */
  async getMonthlySummary(year, month) {
    const response = await api.get('/attendance/summary', { params: { year, month } });
    return response.data;
  },

  /**
   * Get attendance history for a single employee
   */
  async getEmployeeHistory(employeeId, params = {}) {
    const response = await api.get(`/attendance/employee/${employeeId}`, { params });
    return response.data;
  },

  /**
   * Update attendance record by ID
   */
  async updateAttendance(id, data) {
    const response = await api.put(`/attendance/${id}`, data);
    return response.data;
  },
};

export default attendanceService;
