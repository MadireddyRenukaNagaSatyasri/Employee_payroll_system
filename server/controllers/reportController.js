import reportService from '../services/reportService.js';

// Helper to convert array of objects into CSV format
const convertToCsv = (fields, data) => {
  const header = fields.map((f) => `"${f.label}"`).join(',');
  const rows = data.map((item) =>
    fields
      .map((f) => {
        let val = item[f.key];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'string') val = val.replace(/"/g, '""');
        return `"${val}"`;
      })
      .join(',')
  );
  return [header, ...rows].join('\r\n');
};

/**
 * @desc    Get comprehensive dashboard analytics & live statistics
 * @route   GET /api/reports/dashboard
 * @access  Private (Admin)
 */
export const getDashboardAnalytics = async (req, res, next) => {
  try {
    const stats = await reportService.getDashboardAnalytics();
    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Monthly Payroll Report & CSV Export
 * @route   GET /api/reports/payroll
 * @access  Private (Admin)
 */
export const getMonthlyPayrollReport = async (req, res, next) => {
  try {
    const { year, month, format } = req.query;
    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || now.getMonth() + 1;

    const report = await reportService.getMonthlyPayrollReport(y, m);

    if (format === 'csv') {
      const fields = [
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'department', label: 'Department' },
        { key: 'designation', label: 'Designation' },
        { key: 'basicSalary', label: 'Basic Salary (INR)' },
        { key: 'grossSalary', label: 'Gross Salary (INR)' },
        { key: 'totalDeductions', label: 'Total Deductions (INR)' },
        { key: 'netSalary', label: 'Net Take-Home Salary (INR)' },
        { key: 'status', label: 'Payroll Status' },
        { key: 'paymentMethod', label: 'Payment Method' },
        { key: 'transactionReference', label: 'Transaction Ref' },
      ];

      const csv = convertToCsv(fields, report.records);
      res.header('Content-Type', 'text/csv');
      res.attachment(`Monthly-Payroll-Report-${y}-${String(m).padStart(2, '0')}.csv`);
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Employee Roster Report & CSV Export
 * @route   GET /api/reports/employees
 * @access  Private (Admin)
 */
export const getEmployeeListReport = async (req, res, next) => {
  try {
    const { department, status, format } = req.query;
    const report = await reportService.getEmployeeListReport({ department, status });

    if (format === 'csv') {
      const fields = [
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'department', label: 'Department' },
        { key: 'designation', label: 'Designation' },
        { key: 'status', label: 'Employment Status' },
        { key: 'basicSalary', label: 'Basic Monthly Salary (INR)' },
        { key: 'bankName', label: 'Bank Name' },
        { key: 'accountNumber', label: 'Account Number' },
      ];

      const csv = convertToCsv(fields, report.records);
      res.header('Content-Type', 'text/csv');
      res.attachment('Employee-Roster-Report.csv');
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Department Headcount & Budget Report
 * @route   GET /api/reports/departments
 * @access  Private (Admin)
 */
export const getDepartmentSummaryReport = async (req, res, next) => {
  try {
    const { format } = req.query;
    const report = await reportService.getDepartmentSummaryReport();

    if (format === 'csv') {
      const fields = [
        { key: 'department', label: 'Department' },
        { key: 'headcount', label: 'Active Employees' },
        { key: 'totalBasicSalary', label: 'Total Monthly Budget (INR)' },
        { key: 'averageSalary', label: 'Average Salary (INR)' },
      ];

      const csv = convertToCsv(fields, report.departments);
      res.header('Content-Type', 'text/csv');
      res.attachment('Department-Summary-Report.csv');
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Monthly Attendance Report & CSV Export
 * @route   GET /api/reports/attendance
 * @access  Private (Admin)
 */
export const getAttendanceReport = async (req, res, next) => {
  try {
    const { year, month, department, format } = req.query;
    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || now.getMonth() + 1;

    const report = await reportService.getAttendanceReport(y, m, department);

    if (format === 'csv') {
      const fields = [
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'fullName', label: 'Full Name' },
        { key: 'department', label: 'Department' },
        { key: 'standardWorkingDays', label: 'Working Days' },
        { key: 'presentDays', label: 'Present Days' },
        { key: 'halfDays', label: 'Half Days' },
        { key: 'leaveDays', label: 'Leave Days' },
        { key: 'absentDays', label: 'Absent Days' },
        { key: 'payableDays', label: 'Payable Days' },
        { key: 'attendancePercentage', label: 'Attendance %' },
      ];

      const csv = convertToCsv(fields, report.records);
      res.header('Content-Type', 'text/csv');
      res.attachment(`Attendance-Report-${y}-${String(m).padStart(2, '0')}.csv`);
      return res.send(csv);
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Salary Component Breakdown Report
 * @route   GET /api/reports/salary-breakdown
 * @access  Private (Admin)
 */
export const getSalaryBreakdownReport = async (req, res, next) => {
  try {
    const { year, month } = req.query;
    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || now.getMonth() + 1;

    const report = await reportService.getSalaryBreakdownReport(y, m);

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    next(error);
  }
};
