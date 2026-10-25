import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  RotateCcw,
  Calendar,
  Building2,
  AlertCircle,
  Banknote,
  DollarSign,
  Clock,
  Printer,
  CreditCard,
} from 'lucide-react';
import payrollService from '../services/payrollService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import formatDate from '../utils/formatDate.js';

export default function SalaryDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [payroll, setPayroll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPayrollDetails = async () => {
    try {
      setLoading(true);
      const res = await payrollService.getPayrollById(id);
      if (res.success && res.payroll) {
        setPayroll(res.payroll);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch payroll breakdown.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrollDetails();
  }, [id]);

  const handleFinalize = async () => {
    if (window.confirm('Finalize this payroll record?')) {
      try {
        setActionLoading(true);
        await payrollService.finalizePayroll(id);
        fetchPayrollDetails();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to finalize');
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner text="Loading salary breakdown..." />
      </div>
    );
  }

  if (error || !payroll) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-slate-700 font-semibold mb-2">{error || 'Payroll record not found'}</p>
        <button
          onClick={() => navigate('/payroll')}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
        >
          Return to Payroll Overview
        </button>
      </div>
    );
  }

  const { employee, attendanceDetails, allowances, bonuses, overtime, deductions } = payroll;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/payroll')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Payroll Overview</span>
        </button>

        <div className="flex items-center gap-2">
          {payroll.status === 'Draft' && (
            <button
              onClick={handleFinalize}
              disabled={actionLoading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Finalize for Payment</span>
            </button>
          )}

          {payroll.status === 'Paid' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Paid on {formatDate(payroll.paymentDetails?.paymentDate)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Payslip Preview Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
        {/* Header Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Salary Breakdown • Period: {payroll.period}
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl font-bold text-slate-800">{employee?.fullName}</h1>
              <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                {employee?.employeeId}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {employee?.designation} • {employee?.department}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                payroll.status === 'Paid'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : payroll.status === 'Finalized'
                  ? 'bg-sky-50 text-sky-700 border-sky-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              Status: {payroll.status}
            </span>
            {payroll.correctionReason && (
              <p className="text-[11px] text-amber-700 mt-2 max-w-xs italic text-left bg-amber-50 p-2 rounded-lg border border-amber-200">
                {payroll.correctionReason}
              </p>
            )}
          </div>
        </div>

        {/* Attendance Summary Strip */}
        <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-center text-xs">
          <div>
            <span className="text-slate-400 font-medium block">Working Days</span>
            <span className="font-bold text-slate-700 text-sm">
              {attendanceDetails?.standardWorkingDays || 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Present</span>
            <span className="font-bold text-emerald-700 text-sm">
              {attendanceDetails?.presentDays || 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Half-Days</span>
            <span className="font-bold text-amber-600 text-sm">
              {attendanceDetails?.halfDays || 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Leaves</span>
            <span className="font-bold text-sky-600 text-sm">
              {attendanceDetails?.leaveDays || 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Unpaid Days</span>
            <span className="font-bold text-rose-600 text-sm">
              {attendanceDetails?.unpaidDays || 0}
            </span>
          </div>
          <div>
            <span className="text-slate-400 font-medium block">Payable Days</span>
            <span className="font-bold text-slate-800 text-sm">
              {attendanceDetails?.payableDays || 0}
            </span>
          </div>
        </div>

        {/* Earnings & Deductions Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Earnings Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-700 pb-2 border-b border-emerald-100 flex items-center justify-between">
              <span>Earnings & Allowances</span>
              <span>Amount</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-medium text-slate-600">Basic Salary</span>
                <span className="font-semibold">{formatCurrency(payroll.basicSalary)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">House Rent Allowance (HRA)</span>
                <span>{formatCurrency(allowances?.hra || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Dearness Allowance (DA)</span>
                <span>{formatCurrency(allowances?.da || 0)}</span>
              </div>
              {allowances?.specialAllowance > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Special Allowance</span>
                  <span>{formatCurrency(allowances.specialAllowance)}</span>
                </div>
              )}
              {bonuses?.totalBonuses > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Bonuses & Incentives</span>
                  <span>{formatCurrency(bonuses.totalBonuses)}</span>
                </div>
              )}
              {overtime?.totalOvertimePay > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Overtime ({overtime.hours} hrs)</span>
                  <span>{formatCurrency(overtime.totalOvertimePay)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between py-2.5 bg-emerald-50/70 px-3 rounded-xl border border-emerald-100 font-bold text-xs text-emerald-900">
              <span>Gross Earnings</span>
              <span>{formatCurrency(payroll.grossSalary)}</span>
            </div>
          </div>

          {/* Deductions Column */}
          <div className="space-y-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-rose-700 pb-2 border-b border-rose-100 flex items-center justify-between">
              <span>Deductions</span>
              <span>Amount</span>
            </h3>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">
                  Unpaid Leaves ({attendanceDetails?.unpaidDays || 0} days)
                </span>
                <span className="font-semibold text-rose-600">
                  {formatCurrency(deductions?.unpaidLeaveDeduction || 0)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Provident Fund (PF)</span>
                <span>{formatCurrency(deductions?.pf || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Employee State Insurance (ESI)</span>
                <span>{formatCurrency(deductions?.esi || 0)}</span>
              </div>
              {deductions?.taxTds > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Tax Deducted at Source (TDS)</span>
                  <span>{formatCurrency(deductions.taxTds)}</span>
                </div>
              )}
              {deductions?.otherDeductions > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500">Other Deductions</span>
                  <span>{formatCurrency(deductions.otherDeductions)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between py-2.5 bg-rose-50/70 px-3 rounded-xl border border-rose-100 font-bold text-xs text-rose-900">
              <span>Total Deductions</span>
              <span>{formatCurrency(deductions?.totalDeductions || 0)}</span>
            </div>
          </div>
        </div>

        {/* Total Net Pay Highlight */}
        <div className="bg-gradient-to-r from-sky-900 to-indigo-900 text-white p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-sky-200">
              Net Payable Take-Home Salary
            </span>
            <p className="text-3xl font-extrabold mt-0.5">{formatCurrency(payroll.netSalary)}</p>
            <p className="text-xs text-sky-300 mt-1">
              (Gross Salary {formatCurrency(payroll.grossSalary)} - Total Deductions{' '}
              {formatCurrency(deductions?.totalDeductions || 0)})
            </p>
          </div>

          <div className="text-right text-xs text-sky-200 space-y-1">
            <div>
              Bank: <span className="text-white font-medium">{employee?.bankDetails?.bankName || 'Not Set'}</span>
            </div>
            <div>
              Account: <span className="font-mono text-white font-medium">{employee?.bankDetails?.accountNumber || 'Not Set'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
