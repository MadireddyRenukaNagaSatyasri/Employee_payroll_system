import Payroll from '../models/Payroll.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import { getWorkingDaysInMonth, roundMoney } from './payrollService.js';

export const reportService = {
  /**
   * Complete live dashboard statistics
   */
  async getDashboardAnalytics() {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // 1. Employee Counts
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: 'Active' });

    // 2. Current Month Payroll Metrics
    const currentMonthPayrolls = await Payroll.find({
      year: currentYear,
      month: currentMonth,
    });

    let currentMonthPayrollTotal = 0;
    let pendingPayrollCount = 0;
    let paidPayrollCount = 0;

    currentMonthPayrolls.forEach((p) => {
      currentMonthPayrollTotal += p.netSalary;
      if (p.status !== 'Paid') pendingPayrollCount++;
      else paidPayrollCount++;
    });

    // 3. Today's Attendance Breakdown
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const todayRecords = await Attendance.find({
      date: { $gte: today, $lt: tomorrow },
    });

    let todayPresent = 0;
    let todayAbsent = 0;
    let todayHalfDay = 0;
    let todayLeave = 0;

    todayRecords.forEach((r) => {
      if (r.status === 'Present') todayPresent++;
      else if (r.status === 'Absent') todayAbsent++;
      else if (r.status === 'Half-Day') todayHalfDay++;
      else if (r.status === 'Leave') todayLeave++;
    });

    const todayNotMarked = Math.max(0, activeEmployees - todayRecords.length);

    // 4. Monthly Payroll Trend (Last 6 Months)
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const trend = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1;

      const payrollsInMonth = await Payroll.find({ year: y, month: m });
      let netSum = 0;
      let grossSum = 0;

      payrollsInMonth.forEach((p) => {
        netSum += p.netSalary;
        grossSum += p.grossSalary;
      });

      trend.push({
        month: monthNames[m - 1],
        year: y,
        period: `${monthNames[m - 1]} ${y}`,
        totalNet: roundMoney(netSum),
        totalGross: roundMoney(grossSum),
        count: payrollsInMonth.length,
      });
    }

    // 5. Recent 5 Employees
    const recentEmployees = await Employee.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName employeeId department designation joiningDate status');

    // 6. Recent 5 Payroll records
    const recentPayrolls = await Payroll.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('employee', 'fullName employeeId department')
      .select('employee period netSalary status paymentDetails updatedAt');

    return {
      kpi: {
        totalEmployees,
        activeEmployees,
        currentMonthPayrollTotal: roundMoney(currentMonthPayrollTotal),
        pendingPayrollCount,
        paidPayrollCount,
      },
      todayAttendance: {
        totalActive: activeEmployees,
        present: todayPresent,
        absent: todayAbsent,
        halfDay: todayHalfDay,
        leave: todayLeave,
        notMarked: todayNotMarked,
      },
      payrollTrend: trend,
      recentEmployees,
      recentPayrolls,
    };
  },

  /**
   * Monthly Payroll Summary Report
   */
  async getMonthlyPayrollReport(year, month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    const records = await Payroll.find({ year: y, month: m })
      .populate('employee', 'fullName employeeId department designation basicSalary')
      .sort({ 'employee.employeeId': 1 });

    let totalBasic = 0;
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;

    const data = records.map((p) => {
      totalBasic += p.basicSalary;
      totalGross += p.grossSalary;
      totalDeductions += p.deductions?.totalDeductions || 0;
      totalNet += p.netSalary;

      return {
        id: p._id,
        employeeId: p.employee?.employeeId,
        fullName: p.employee?.fullName,
        department: p.employee?.department,
        designation: p.employee?.designation,
        basicSalary: p.basicSalary,
        grossSalary: p.grossSalary,
        totalAllowances: p.allowances?.totalAllowances || 0,
        totalBonuses: p.bonuses?.totalBonuses || 0,
        totalDeductions: p.deductions?.totalDeductions || 0,
        unpaidLeaveDeduction: p.deductions?.unpaidLeaveDeduction || 0,
        netSalary: p.netSalary,
        status: p.status,
        paymentMethod: p.paymentDetails?.paymentMethod || '-',
        paymentDate: p.paymentDetails?.paymentDate || null,
        transactionReference: p.paymentDetails?.transactionReference || '-',
      };
    });

    return {
      period: `${y}-${String(m).padStart(2, '0')}`,
      totalEmployees: data.length,
      totals: {
        totalBasic: roundMoney(totalBasic),
        totalGross: roundMoney(totalGross),
        totalDeductions: roundMoney(totalDeductions),
        totalNet: roundMoney(totalNet),
      },
      records: data,
    };
  },

  /**
   * Employee Directory & Compensation Report
   */
  async getEmployeeListReport(filters = {}) {
    const query = {};
    if (filters.department && filters.department !== 'All') {
      query.department = filters.department;
    }
    if (filters.status && filters.status !== 'All') {
      query.status = filters.status;
    }

    const employees = await Employee.find(query).sort({ employeeId: 1 });

    let totalMonthlyPayrollBudget = 0;
    const records = employees.map((emp) => {
      totalMonthlyPayrollBudget += emp.basicSalary;
      return {
        id: emp._id,
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        email: emp.email,
        phone: emp.phone,
        department: emp.department,
        designation: emp.designation,
        joiningDate: emp.joiningDate,
        status: emp.status,
        basicSalary: emp.basicSalary,
        bankName: emp.bankDetails?.bankName || '-',
        accountNumber: emp.bankDetails?.accountNumber || '-',
      };
    });

    return {
      totalEmployees: records.length,
      totalMonthlyPayrollBudget: roundMoney(totalMonthlyPayrollBudget),
      records,
    };
  },

  /**
   * Department Breakdown Report (Headcount & Salary Budget)
   */
  async getDepartmentSummaryReport() {
    const employees = await Employee.find({ status: 'Active' });

    const deptMap = {};
    employees.forEach((emp) => {
      const dept = emp.department || 'Other';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          headcount: 0,
          totalBasicSalary: 0,
        };
      }
      deptMap[dept].headcount += 1;
      deptMap[dept].totalBasicSalary += emp.basicSalary;
    });

    const records = Object.values(deptMap).map((d) => ({
      ...d,
      averageSalary: roundMoney(d.totalBasicSalary / d.headcount),
      totalBasicSalary: roundMoney(d.totalBasicSalary),
    }));

    return {
      totalDepartments: records.length,
      totalActiveEmployees: employees.length,
      departments: records,
    };
  },

  /**
   * Monthly Attendance Report
   */
  async getAttendanceReport(year, month, department) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    const empQuery = { status: { $ne: 'Terminated' } };
    if (department && department !== 'All') {
      empQuery.department = department;
    }

    const employees = await Employee.find(empQuery).sort({ employeeId: 1 });
    const standardWorkingDays = getWorkingDaysInMonth(y, m);

    const startDate = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59));

    const records = await Attendance.find({
      date: { $gte: startDate, $lte: endDate },
    });

    const empRecordsMap = new Map();
    records.forEach((r) => {
      const empId = r.employee.toString();
      if (!empRecordsMap.has(empId)) empRecordsMap.set(empId, []);
      empRecordsMap.get(empId).push(r);
    });

    const summary = employees.map((emp) => {
      const empAttendance = empRecordsMap.get(emp._id.toString()) || [];
      let presentDays = 0;
      let absentDays = 0;
      let halfDays = 0;
      let leaveDays = 0;

      empAttendance.forEach((r) => {
        if (r.status === 'Present') presentDays++;
        else if (r.status === 'Absent') absentDays++;
        else if (r.status === 'Half-Day') halfDays++;
        else if (r.status === 'Leave') leaveDays++;
      });

      const payableDays = presentDays + leaveDays + halfDays * 0.5;
      const totalMarked = presentDays + absentDays + halfDays + leaveDays;
      const rate = totalMarked > 0 ? ((payableDays / totalMarked) * 100).toFixed(1) : 0;

      return {
        employeeId: emp.employeeId,
        fullName: emp.fullName,
        department: emp.department,
        standardWorkingDays,
        presentDays,
        halfDays,
        leaveDays,
        absentDays,
        payableDays,
        attendancePercentage: Number(rate),
      };
    });

    return {
      period: `${y}-${String(m).padStart(2, '0')}`,
      standardWorkingDays,
      totalEmployees: summary.length,
      records: summary,
    };
  },

  /**
   * Salary Cost Breakdown Report
   */
  async getSalaryBreakdownReport(year, month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);

    const payrolls = await Payroll.find({ year: y, month: m });

    let totalBasic = 0;
    let totalHra = 0;
    let totalDa = 0;
    let totalSpecial = 0;
    let totalBonuses = 0;
    let totalOvertime = 0;
    let totalUnpaidLeaveDeductions = 0;
    let totalPf = 0;
    let totalEsi = 0;
    let totalTax = 0;

    payrolls.forEach((p) => {
      totalBasic += p.basicSalary || 0;
      totalHra += p.allowances?.hra || 0;
      totalDa += p.allowances?.da || 0;
      totalSpecial += p.allowances?.specialAllowance || 0;
      totalBonuses += p.bonuses?.totalBonuses || 0;
      totalOvertime += p.overtime?.totalOvertimePay || 0;
      totalUnpaidLeaveDeductions += p.deductions?.unpaidLeaveDeduction || 0;
      totalPf += p.deductions?.pf || 0;
      totalEsi += p.deductions?.esi || 0;
      totalTax += p.deductions?.taxTds || 0;
    });

    return {
      period: `${y}-${String(m).padStart(2, '0')}`,
      count: payrolls.length,
      earningsBreakdown: {
        basicSalary: roundMoney(totalBasic),
        hra: roundMoney(totalHra),
        da: roundMoney(totalDa),
        specialAllowance: roundMoney(totalSpecial),
        bonuses: roundMoney(totalBonuses),
        overtime: roundMoney(totalOvertime),
      },
      deductionsBreakdown: {
        unpaidLeaves: roundMoney(totalUnpaidLeaveDeductions),
        providentFund: roundMoney(totalPf),
        esi: roundMoney(totalEsi),
        taxTds: roundMoney(totalTax),
      },
    };
  },
};

export default reportService;
