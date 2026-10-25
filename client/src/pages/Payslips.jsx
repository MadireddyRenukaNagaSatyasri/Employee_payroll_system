import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Search,
  Filter,
  Eye,
  Calendar,
  CheckCircle,
  AlertCircle,
  Printer,
} from 'lucide-react';
import payrollService from '../services/payrollService.js';
import DataTable from '../components/DataTable.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import generatePayslipPdf from '../utils/generatePayslipPdf.js';

export default function Payslips() {
  const navigate = useNavigate();
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const fetchPayslips = async () => {
    try {
      setLoading(true);
      const params = {
        year: selectedYear,
        month: selectedMonth,
        search: search.trim() || undefined,
        status: selectedStatus !== 'All' ? selectedStatus : undefined,
      };

      const res = await payrollService.getPayrollList(params);
      if (res.success) {
        // Exclude unreviewed drafts from official payslips list by default unless explicitly chosen
        const officialPayrolls =
          selectedStatus === 'Draft'
            ? res.payrolls
            : res.payrolls.filter((p) => p.status !== 'Draft');
        setPayrolls(officialPayrolls);
      }
    } catch (err) {
      console.error('Error fetching payslips:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, [selectedYear, selectedMonth, selectedStatus]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayslips();
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
      header: 'Period',
      accessor: 'period',
      render: (row) => (
        <span className="font-mono text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded font-medium">
          {row.period}
        </span>
      ),
    },
    {
      header: 'Gross Earnings',
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
      header: 'Net Take-Home',
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => generatePayslipPdf(row)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
            title="Download Official PDF Payslip"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => navigate(`/payroll/${row._id}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Employee Payslips</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Download professional, authorized monthly PDF payslips for staff members.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="w-full md:w-72 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search employee name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Period:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-medium bg-white"
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
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-medium bg-white"
            >
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-medium bg-white"
            >
              <option value="All">Finalized & Paid</option>
              <option value="Finalized">Finalized</option>
              <option value="Paid">Paid</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payslips Table */}
      <DataTable
        columns={columns}
        data={payrolls}
        loading={loading}
        emptyMessage={`No finalized or paid payslips found for ${
          months.find((m) => m.value === selectedMonth)?.label
        } ${selectedYear}. Make sure payroll records are calculated and finalized.`}
      />
    </div>
  );
}
