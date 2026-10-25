import Attendance from '../models/Attendance.js';

/**
 * Decimal-safe rounding to 2 decimal places
 */
export const roundMoney = (amount) => {
  const num = Number(amount) || 0;
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

/**
 * Calculate standard working days in a month (excluding Sundays)
 */
export const getWorkingDaysInMonth = (year, month) => {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    if (dayOfWeek !== 0) {
      // Not Sunday
      workingDays++;
    }
  }
  return workingDays;
};

/**
 * Calculate payroll components for an individual employee for a given month and year
 * @param {Object} employee - Employee Mongoose document
 * @param {number} year - 4 digit year (e.g. 2026)
 * @param {number} month - 1-indexed month (1 - 12)
 * @param {Object} customInputs - Optional manual overrides for allowances, bonuses, deductions
 */
export const calculateEmployeePayroll = async (
  employee,
  year,
  month,
  customInputs = {}
) => {
  const basicSalary = roundMoney(employee.basicSalary);
  const standardWorkingDays = getWorkingDaysInMonth(year, month);

  // 1. Fetch Attendance records for the month
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59));

  const attendanceRecords = await Attendance.find({
    employee: employee._id,
    date: { $gte: startDate, $lte: endDate },
  });

  let presentDays = 0;
  let absentDays = 0;
  let halfDays = 0;
  let leaveDays = 0;

  attendanceRecords.forEach((rec) => {
    if (rec.status === 'Present') presentDays++;
    else if (rec.status === 'Absent') absentDays++;
    else if (rec.status === 'Half-Day') halfDays++;
    else if (rec.status === 'Leave') leaveDays++;
  });

  // Payable days = Present + Approved Leaves + (Half Days * 0.5)
  // If no attendance was marked at all during the month, assume full attendance by default for draft preview
  const hasAttendanceMarked = attendanceRecords.length > 0;
  const payableDays = hasAttendanceMarked
    ? presentDays + leaveDays + halfDays * 0.5
    : standardWorkingDays;

  // Unpaid days = working days - payable days
  const unpaidDays = Math.max(0, standardWorkingDays - payableDays);

  // Daily rate for unpaid deduction
  const dailyRate = standardWorkingDays > 0 ? basicSalary / standardWorkingDays : 0;
  const unpaidLeaveDeduction = roundMoney(unpaidDays * dailyRate);

  // 2. Allowances (from custom inputs or default standard allowances)
  const hra = customInputs.allowances?.hra !== undefined
    ? roundMoney(customInputs.allowances.hra)
    : roundMoney(basicSalary * 0.2); // Default HRA 20%

  const da = customInputs.allowances?.da !== undefined
    ? roundMoney(customInputs.allowances.da)
    : roundMoney(basicSalary * 0.1); // Default DA 10%

  const specialAllowance = customInputs.allowances?.specialAllowance !== undefined
    ? roundMoney(customInputs.allowances.specialAllowance)
    : 0;

  const otherAllowance = customInputs.allowances?.otherAllowance !== undefined
    ? roundMoney(customInputs.allowances.otherAllowance)
    : 0;

  const totalAllowances = roundMoney(hra + da + specialAllowance + otherAllowance);

  // 3. Bonuses
  const performanceBonus = customInputs.bonuses?.performanceBonus !== undefined
    ? roundMoney(customInputs.bonuses.performanceBonus)
    : 0;

  const festivalBonus = customInputs.bonuses?.festivalBonus !== undefined
    ? roundMoney(customInputs.bonuses.festivalBonus)
    : 0;

  const totalBonuses = roundMoney(performanceBonus + festivalBonus);

  // 4. Overtime
  const overtimeHours = Number(customInputs.overtime?.hours) || 0;
  const ratePerHour = Number(customInputs.overtime?.ratePerHour) || roundMoney(dailyRate / 8);
  const totalOvertimePay = roundMoney(overtimeHours * ratePerHour);

  // 5. Deductions
  // PF: default 12% of basic if configured or provided
  const pf = customInputs.deductions?.pf !== undefined
    ? roundMoney(customInputs.deductions.pf)
    : roundMoney(basicSalary * 0.12);

  // ESI: default 0.75% if basic is under threshold, or provided
  const esi = customInputs.deductions?.esi !== undefined
    ? roundMoney(customInputs.deductions.esi)
    : basicSalary <= 21000
    ? roundMoney(basicSalary * 0.0075)
    : 0;

  const taxTds = customInputs.deductions?.taxTds !== undefined
    ? roundMoney(customInputs.deductions.taxTds)
    : 0;

  const otherDeductions = customInputs.deductions?.otherDeductions !== undefined
    ? roundMoney(customInputs.deductions.otherDeductions)
    : 0;

  const totalDeductions = roundMoney(
    unpaidLeaveDeduction + pf + esi + taxTds + otherDeductions
  );

  // 6. Gross & Net Salary
  const grossSalary = roundMoney(
    basicSalary + totalAllowances + totalBonuses + totalOvertimePay
  );

  const netSalary = Math.max(0, roundMoney(grossSalary - totalDeductions));

  return {
    employee: employee._id,
    month,
    year,
    period: `${year}-${String(month).padStart(2, '0')}`,
    basicSalary,
    attendanceDetails: {
      standardWorkingDays,
      presentDays,
      halfDays,
      leaveDays,
      absentDays,
      payableDays,
      unpaidDays,
    },
    allowances: {
      hra,
      da,
      specialAllowance,
      otherAllowance,
      totalAllowances,
    },
    bonuses: {
      performanceBonus,
      festivalBonus,
      totalBonuses,
    },
    overtime: {
      hours: overtimeHours,
      ratePerHour,
      totalOvertimePay,
    },
    deductions: {
      unpaidLeaveDeduction,
      pf,
      esi,
      taxTds,
      otherDeductions,
      totalDeductions,
    },
    grossSalary,
    netSalary,
  };
};

export default {
  roundMoney,
  getWorkingDaysInMonth,
  calculateEmployeePayroll,
};
