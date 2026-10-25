import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  PlusCircle,
  Filter,
  CheckCircle,
  Clock,
  DollarSign,
  Eye,
  Lock,
  RotateCcw,
  AlertCircle,
  Calendar,
  X,
  Banknote,
} from 'lucide-react';
import payrollService from '../services/payrollService.js';
import DataTable from '../components/DataTable.jsx';
import formatCurrency from '../utils/formatCurrency.js';

export default function Payroll() {
  const navigate = useNavigate();
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [payrolls, setPayrolls] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal States
  const [payModalItem, setPayModalItem] = useState(null);
  const [reopenModalItem, setReopenModalItem] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'Bank Transfer',
    transactionReference: '',
  });
  const [reopenReason, setReopenReason] = useState('');

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

  const fetchPayroll = async () => {
    try {
      setLoading(true);
      const params = {
        year: selectedYear,
        month: selectedMonth,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      };
      const res = await payrollService.getPayrollList(params);
      if (res.success) {
        setPayrolls(res.payrolls);
        setSummary(res.summary);
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to fetch payroll records.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [selectedYear, selectedMonth, selectedStatus]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setFeedback({ type: '', message: '' });
      const res = await payrollService.generatePayroll(selectedYear, selectedMonth);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message,
        });
        fetchPayroll();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.message || 'Failed to generate payroll.',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleFinalize = async (id) => {
    if (window.confirm('Finalize this payroll? Once finalized, edits will be locked for payout review.')) {
      try {
        await payrollService.finalizePayroll(id);
        fetchPayroll();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to finalize');
      }
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payModalItem) return;

    try {
      await payrollService.markPayrollPaid(payModalItem._id, paymentData);
      setPayModalItem(null);
      setPaymentData({ paymentMethod: 'Bank Transfer', transactionReference: '' });
      fetchPayroll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record payment');
    }
  };

  const handleReopenSubmit = async (e) => {
    e.preventDefault();
    if (!reopenModalItem || !reopenReason.trim()) return;

    try {
      await payrollService.reopenPayroll(reopenModalItem._id, reopenReason);
      setReopenModalItem(null);
      setReopenReason('');
      fetchPayroll();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reopen');
    }
  };

  const columns = [
    {
      header: 'Employee',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.employee?.fullName}</div>
          <div className="font-mono text-xs text-sky-600 font-bold">{row.employee?.employeeId}</div>
        </div>
      ),
    },
    {
      header: 'Department',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-700">{row.employee?.department}</div>
          <div className="text-xs text-slate-400">{row.employee?.designation}</div>
        </div>
      ),
    },
    {
      header: 'Basic Salary',
      render: (row) => <span>{formatCurrency(row.basicSalary)}</span>,
    },
    {
      header: 'Gross Salary',
      render: (row) => <span>{formatCurrency(row.grossSalary)}</span>,
    },
    {
      header: 'Deductions',
      render: (row) => (
        <span className="text-rose-600 font-medium">
          -{formatCurrency(row.deductions?.totalDeductions || 0)}
        </span>
      ),
    },
    {
      header: 'Net Salary',
      render: (row) => (
        <span className="font-bold text-slate-900 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-md border border-emerald-200">
          {formatCurrency(row.netSalary)}
        </span>
      ),
    },
    {
      header: 'Status',
      render: (row) => {
        const badges = {
          Draft: 'bg-amber-50 text-amber-700 border-amber-200',
          Finalized: 'bg-sky-50 text-sky-700 border-sky-200',
          Paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        };
        return (
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${badges[row.status]}`}>
            ● {row.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/payroll/${row._id}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
            title="View Salary Breakdown"
          >
            <Eye className="w-4 h-4" />
          </button>

          {row.status === 'Draft' && (
            <button
              onClick={() => handleFinalize(row._id)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Finalize Payroll"
            >
              <Lock className="w-4 h-4" />
            </button>
          )}

          {row.status === 'Finalized' && (
            <>
              <button
                onClick={() => setPayModalItem(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                title="Mark as Paid"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => setReopenModalItem(row)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                title="Reopen for Corrections"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Monthly Payroll Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Calculate salaries, review deductions, finalize records, and record salary disbursements.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all disabled:opacity-50"
        >
          <CreditCard className="w-4 h-4" />
          <span>{generating ? 'Calculating Payroll...' : 'Calculate Monthly Payroll'}</span>
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-slate-400">Total Net Payroll</span>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {formatCurrency(summary.totalNet)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Gross: {formatCurrency(summary.totalGross)}
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-emerald-600">Disbursed (Paid)</span>
            <p className="text-2xl font-bold text-emerald-700 mt-1">
              {summary.paidCount} records
            </p>
            <p className="text-xs text-slate-400 mt-1">Payments confirmed</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-sky-600">Finalized (Ready)</span>
            <p className="text-2xl font-bold text-sky-700 mt-1">
              {summary.finalizedCount} records
            </p>
            <p className="text-xs text-slate-400 mt-1">Approved & locked for payout</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold uppercase text-amber-600">Drafts in Review</span>
            <p className="text-2xl font-bold text-amber-700 mt-1">
              {summary.draftCount} records
            </p>
            <p className="text-xs text-slate-400 mt-1">Awaiting admin review</p>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-500">Period:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase text-slate-500">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Finalized">Finalized</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      {/* Payroll Records Table */}
      <DataTable
        columns={columns}
        data={payrolls}
        loading={loading}
        emptyMessage={`No payroll records found for ${
          months.find((m) => m.value === selectedMonth)?.label
        } ${selectedYear}. Click 'Calculate Monthly Payroll' above to generate.`}
      />

      {/* MARK AS PAID MODAL */}
      {payModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800">Record Salary Payment</h3>
                <p className="text-xs text-slate-500">
                  {payModalItem.employee?.fullName} ({payModalItem.employee?.employeeId})
                </p>
              </div>
              <button onClick={() => setPayModalItem(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaySubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/60 text-xs">
                <span className="text-emerald-800 font-medium">Net Disbursed Amount:</span>{' '}
                <strong className="text-emerald-900 font-bold text-sm">
                  {formatCurrency(payModalItem.netSalary)}
                </strong>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) =>
                    setPaymentData((prev) => ({ ...prev, paymentMethod: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Bank Transfer">Bank Transfer (NEFT/RTGS/IMPS)</option>
                  <option value="UPI">UPI</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Transaction / Reference ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. UTR20261025000123"
                  value={paymentData.transactionReference}
                  onChange={(e) =>
                    setPaymentData((prev) => ({ ...prev, transactionReference: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPayModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REOPEN PAYROLL MODAL */}
      {reopenModalItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800">Reopen Finalized Payroll</h3>
                <p className="text-xs text-slate-500">
                  {reopenModalItem.employee?.fullName} ({reopenModalItem.employee?.employeeId})
                </p>
              </div>
              <button onClick={() => setReopenModalItem(null)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReopenSubmit} className="space-y-4">
              <p className="text-xs text-slate-600">
                Reopening reverts the payroll record to <strong>Draft</strong> status, allowing salary and deduction adjustments. An authorized reason is required for audit logs.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                  Reason for Correction <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="e.g. Leave adjustments requested by HR, retroactive bonus update"
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setReopenModalItem(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium"
                >
                  Reopen as Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
