import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Download,
  Users,
  CreditCard,
  Building2,
  CalendarCheck,
  Filter,
} from 'lucide-react';
import reportService from '../services/reportService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import formatDate from '../utils/formatDate.js';

export default function Reports() {
  const now = new Date();
  const [activeTab, setActiveTab] = useState('payroll'); // 'payroll' | 'employees' | 'attendance' | 'departments'

  // Payroll Report State
  const [payrollMonth, setPayrollMonth] = useState(now.getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState(now.getFullYear());
  const [payrollReport, setPayrollReport] = useState(null);
  const [payrollLoading, setPayrollLoading] = useState(false);

  // Employee Report State
  const [empDept, setEmpDept] = useState('All');
  const [empStatus, setEmpStatus] = useState('All');
  const [employeeReport, setEmployeeReport] = useState(null);
  const [empLoading, setEmpLoading] = useState(false);

  // Attendance Report State
  const [attMonth, setAttMonth] = useState(now.getMonth() + 1);
  const [attYear, setAttYear] = useState(now.getFullYear());
  const [attDept, setAttDept] = useState('All');
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [attLoading, setAttLoading] = useState(false);

  // Department Report State
  const [deptReport, setDeptReport] = useState(null);
  const [deptLoading, setDeptLoading] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const departments = [
    'All',
    'Engineering',
    'Human Resources',
    'Finance',
    'Marketing',
    'Sales',
    'Operations',
    'Design',
    'Other',
  ];

  // Loaders
  useEffect(() => {
    if (activeTab === 'payroll') {
      setPayrollLoading(true);
      reportService
        .getMonthlyPayrollReport(payrollYear, payrollMonth)
        .then((res) => res.success && setPayrollReport(res.report))
        .finally(() => setPayrollLoading(false));
    } else if (activeTab === 'employees') {
      setEmpLoading(true);
      reportService
        .getEmployeeListReport({ department: empDept !== 'All' ? empDept : undefined, status: empStatus !== 'All' ? empStatus : undefined })
        .then((res) => res.success && setEmployeeReport(res.report))
        .finally(() => setEmpLoading(false));
    } else if (activeTab === 'attendance') {
      setAttLoading(true);
      reportService
        .getAttendanceReport(attYear, attMonth, attDept !== 'All' ? attDept : undefined)
        .then((res) => res.success && setAttendanceReport(res.report))
        .finally(() => setAttLoading(false));
    } else if (activeTab === 'departments') {
      setDeptLoading(true);
      reportService
        .getDepartmentSummaryReport()
        .then((res) => res.success && setDeptReport(res.report))
        .finally(() => setDeptLoading(false));
    }
  }, [activeTab, payrollYear, payrollMonth, empDept, empStatus, attYear, attMonth, attDept]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit payroll costs, workforce compensation, department allocations, and export CSV spreadsheets.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'payroll' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Monthly Payroll Report</span>
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'employees' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Employee Directory Report</span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'attendance' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CalendarCheck className="w-4 h-4" />
          <span>Attendance Report</span>
        </button>
        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'departments' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Department Budget Report</span>
        </button>
      </div>

      {/* TAB 1: MONTHLY PAYROLL REPORT */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-500">Period:</span>
              <select
                value={payrollMonth}
                onChange={(e) => setPayrollMonth(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={payrollYear}
                onChange={(e) => setPayrollYear(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                reportService.downloadCsv(
                  '/reports/payroll',
                  `Monthly-Payroll-Report-${payrollYear}-${String(payrollMonth).padStart(2, '0')}.csv`,
                  { year: payrollYear, month: payrollMonth }
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {payrollReport?.totals && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-slate-400">Total Basic</span>
                <p className="text-lg font-bold text-slate-800 mt-0.5">
                  {formatCurrency(payrollReport.totals.totalBasic)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-slate-400">Total Gross</span>
                <p className="text-lg font-bold text-slate-800 mt-0.5">
                  {formatCurrency(payrollReport.totals.totalGross)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-rose-500">Total Deductions</span>
                <p className="text-lg font-bold text-rose-600 mt-0.5">
                  -{formatCurrency(payrollReport.totals.totalDeductions)}
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-emerald-600">Net Disbursable</span>
                <p className="text-lg font-bold text-emerald-700 mt-0.5">
                  {formatCurrency(payrollReport.totals.totalNet)}
                </p>
              </div>
            </div>
          )}

          {payrollLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12">
              <LoadingSpinner text="Generating monthly report..." />
            </div>
          ) : payrollReport?.records?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-xs">
              No payroll entries generated for this period.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3 text-right">Basic</th>
                    <th className="px-5 py-3 text-right">Gross</th>
                    <th className="px-5 py-3 text-right text-rose-600">Deductions</th>
                    <th className="px-5 py-3 text-right text-emerald-700">Net Pay</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payrollReport?.records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono font-bold text-sky-700">{r.employeeId}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{r.fullName}</td>
                      <td className="px-5 py-3 text-slate-500">{r.department}</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(r.basicSalary)}</td>
                      <td className="px-5 py-3 text-right">{formatCurrency(r.grossSalary)}</td>
                      <td className="px-5 py-3 text-right text-rose-600">
                        -{formatCurrency(r.totalDeductions)}
                      </td>
                      <td className="px-5 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(r.netSalary)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold border bg-slate-50 text-slate-600">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: EMPLOYEE LIST REPORT */}
      {activeTab === 'employees' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-500">Dept:</span>
              <select
                value={empDept}
                onChange={(e) => setEmpDept(e.target.value)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
              >
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>

              <span className="text-xs font-bold uppercase text-slate-500">Status:</span>
              <select
                value={empStatus}
                onChange={(e) => setEmpStatus(e.target.value)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
              >
                <option value="All">All</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="On Leave">On Leave</option>
              </select>
            </div>

            <button
              onClick={() =>
                reportService.downloadCsv('/reports/employees', 'Employee-Roster-Report.csv', {
                  department: empDept !== 'All' ? empDept : undefined,
                  status: empStatus !== 'All' ? empStatus : undefined,
                })
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {employeeReport && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-slate-400">Total Headcount</span>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {employeeReport.totalEmployees} employees
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[11px] font-bold uppercase text-slate-400">Total Monthly Salary Budget</span>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {formatCurrency(employeeReport.totalMonthlyPayrollBudget)}
                </p>
              </div>
            </div>
          )}

          {empLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12">
              <LoadingSpinner text="Loading roster..." />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="px-5 py-3">ID</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Designation</th>
                    <th className="px-5 py-3">Joining Date</th>
                    <th className="px-5 py-3 text-right">Basic Salary</th>
                    <th className="px-5 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {employeeReport?.records?.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-mono font-bold text-sky-700">{r.employeeId}</td>
                      <td className="px-5 py-3 font-semibold text-slate-800">{r.fullName}</td>
                      <td className="px-5 py-3">{r.department}</td>
                      <td className="px-5 py-3 text-slate-500">{r.designation}</td>
                      <td className="px-5 py-3 text-slate-500">{formatDate(r.joiningDate)}</td>
                      <td className="px-5 py-3 text-right font-semibold">{formatCurrency(r.basicSalary)}</td>
                      <td className="px-5 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium border bg-slate-50">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ATTENDANCE REPORT */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-500">Period:</span>
              <select
                value={attMonth}
                onChange={(e) => setAttMonth(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                value={attYear}
                onChange={(e) => setAttYear(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold bg-white"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() =>
                reportService.downloadCsv(
                  '/reports/attendance',
                  `Attendance-Report-${attYear}-${String(attMonth).padStart(2, '0')}.csv`,
                  { year: attYear, month: attMonth }
                )
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {attLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12">
              <LoadingSpinner text="Computing attendance report..." />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="px-5 py-3">Employee</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3 text-center">Working Days</th>
                    <th className="px-5 py-3 text-center text-emerald-700">Present</th>
                    <th className="px-5 py-3 text-center text-amber-600">Half-Days</th>
                    <th className="px-5 py-3 text-center text-sky-600">Leaves</th>
                    <th className="px-5 py-3 text-center text-rose-600">Absents</th>
                    <th className="px-5 py-3 text-center font-bold">Payable Days</th>
                    <th className="px-5 py-3 text-right">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {attendanceReport?.records?.map((r) => (
                    <tr key={r.employeeId} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold">
                        {r.fullName} ({r.employeeId})
                      </td>
                      <td className="px-5 py-3 text-slate-500">{r.department}</td>
                      <td className="px-5 py-3 text-center">{r.standardWorkingDays}</td>
                      <td className="px-5 py-3 text-center font-semibold text-emerald-700">
                        {r.presentDays}
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-amber-600">
                        {r.halfDays}
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-sky-600">
                        {r.leaveDays}
                      </td>
                      <td className="px-5 py-3 text-center font-semibold text-rose-600">
                        {r.absentDays}
                      </td>
                      <td className="px-5 py-3 text-center font-bold text-slate-900">
                        {r.payableDays}
                      </td>
                      <td className="px-5 py-3 text-right font-bold">{r.attendancePercentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: DEPARTMENT REPORT */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() =>
                reportService.downloadCsv('/reports/departments', 'Department-Summary-Report.csv')
              }
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>

          {deptLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12">
              <LoadingSpinner text="Loading department summaries..." />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold">
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3 text-center">Active Headcount</th>
                    <th className="px-5 py-3 text-right">Total Monthly Budget</th>
                    <th className="px-5 py-3 text-right">Average Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {deptReport?.departments?.map((d) => (
                    <tr key={d.department} className="hover:bg-slate-50/50">
                      <td className="px-5 py-3 font-semibold text-slate-800">{d.department}</td>
                      <td className="px-5 py-3 text-center font-semibold text-sky-700">
                        {d.headcount}
                      </td>
                      <td className="px-5 py-3 text-right font-bold">
                        {formatCurrency(d.totalBasicSalary)}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">
                        {formatCurrency(d.averageSalary)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
