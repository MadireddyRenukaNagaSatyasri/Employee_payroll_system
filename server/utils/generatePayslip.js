/**
 * Standardize and sanitize payslip document data for PDF rendering or download
 * @param {Object} payroll - Mongoose payroll document populated with employee
 * @param {Object} companyInfo - Company metadata (name, address, tax info)
 */
export const formatPayslipData = (payroll, companyInfo = {}) => {
  if (!payroll || !payroll.employee) {
    throw new Error('Invalid payroll document: employee data missing');
  }

  const emp = payroll.employee;
  const company = {
    name: companyInfo.name || 'ACME Corporation Pvt. Ltd.',
    address: companyInfo.address || 'Tech Park, Sector 5, Bangalore - 560001',
    taxId: companyInfo.taxId || 'GSTIN: 29AABCU9603R1ZM',
  };

  return {
    payslipNumber: `PS-${payroll.period.replace('-', '')}-${emp.employeeId}`,
    company,
    employee: {
      id: emp.employeeId,
      name: emp.fullName,
      department: emp.department,
      designation: emp.designation,
      joiningDate: emp.joiningDate,
      email: emp.email,
      phone: emp.phone,
      bankName: emp.bankDetails?.bankName || '-',
      accountNumber: emp.bankDetails?.accountNumber || '-',
      ifscCode: emp.bankDetails?.ifscCode || '-',
      panNumber: emp.bankDetails?.panNumber || '-',
    },
    payrollPeriod: payroll.period,
    generatedDate: new Date(),
    attendance: {
      workingDays: payroll.attendanceDetails?.standardWorkingDays || 26,
      presentDays: payroll.attendanceDetails?.presentDays || 0,
      halfDays: payroll.attendanceDetails?.halfDays || 0,
      leaveDays: payroll.attendanceDetails?.leaveDays || 0,
      absentDays: payroll.attendanceDetails?.absentDays || 0,
      payableDays: payroll.attendanceDetails?.payableDays || 0,
      unpaidDays: payroll.attendanceDetails?.unpaidDays || 0,
    },
    earnings: {
      basicSalary: payroll.basicSalary,
      hra: payroll.allowances?.hra || 0,
      da: payroll.allowances?.da || 0,
      specialAllowance: payroll.allowances?.specialAllowance || 0,
      bonuses: payroll.bonuses?.totalBonuses || 0,
      overtime: payroll.overtime?.totalOvertimePay || 0,
      grossSalary: payroll.grossSalary,
    },
    deductions: {
      unpaidLeaveDeduction: payroll.deductions?.unpaidLeaveDeduction || 0,
      pf: payroll.deductions?.pf || 0,
      esi: payroll.deductions?.esi || 0,
      taxTds: payroll.deductions?.taxTds || 0,
      otherDeductions: payroll.deductions?.otherDeductions || 0,
      totalDeductions: payroll.deductions?.totalDeductions || 0,
    },
    netSalary: payroll.netSalary,
    status: payroll.status,
    paymentDetails: payroll.paymentDetails || {},
  };
};

export default formatPayslipData;
