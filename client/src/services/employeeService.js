import api from './api.js';

export const employeeService = {
  /**
   * Get all employees with search, filter, and pagination
   */
  async getEmployees(params = {}) {
    const response = await api.get('/employees', { params });
    return response.data;
  },

  /**
   * Get a single employee by ID or employeeId
   */
  async getEmployeeById(id) {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  },

  /**
   * Create a new employee
   */
  async createEmployee(employeeData) {
    const response = await api.post('/employees', employeeData);
    return response.data;
  },

  /**
   * Update employee details
   */
  async updateEmployee(id, employeeData) {
    const response = await api.put(`/employees/${id}`, employeeData);
    return response.data;
  },

  /**
   * Toggle or update employee active/inactive status
   */
  async toggleStatus(id, status) {
    const response = await api.patch(`/employees/${id}/status`, { status });
    return response.data;
  },

  /**
   * Delete employee
   */
  async deleteEmployee(id) {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  },
};

export default employeeService;
