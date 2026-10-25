import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Power,
  AlertCircle,
  Building2,
} from 'lucide-react';
import employeeService from '../services/employeeService.js';
import DataTable from '../components/DataTable.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import formatDate from '../utils/formatDate.js';

export default function Employees() {
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState('All');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

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

  const statuses = ['All', 'Active', 'Inactive', 'On Leave', 'Terminated'];

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      const params = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        department: department !== 'All' ? department : undefined,
        status: status !== 'All' ? status : undefined,
      };

      const res = await employeeService.getEmployees(params);
      if (res.success) {
        setEmployees(res.employees);
        setPagination({
          page: res.page,
          totalPages: res.totalPages,
          total: res.total,
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load employees.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [department, status]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchEmployees(1);
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    try {
      await employeeService.toggleStatus(id, newStatus);
      fetchEmployees(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to permanently delete ${name}?`)) {
      try {
        await employeeService.deleteEmployee(id);
        fetchEmployees(pagination.page);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  const columns = [
    {
      header: 'Employee ID',
      accessor: 'employeeId',
      render: (row) => (
        <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
          {row.employeeId}
        </span>
      ),
    },
    {
      header: 'Full Name',
      accessor: 'fullName',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-800">{row.fullName}</div>
          <div className="text-xs text-slate-400">{row.email}</div>
        </div>
      ),
    },
    {
      header: 'Department & Role',
      accessor: 'department',
      render: (row) => (
        <div>
          <div className="font-medium text-slate-700">{row.designation}</div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3" />
            <span>{row.department}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Basic Salary',
      accessor: 'basicSalary',
      render: (row) => (
        <span className="font-semibold text-slate-800">
          {formatCurrency(row.basicSalary)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => {
        const statusColors = {
          Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          Inactive: 'bg-slate-100 text-slate-600 border-slate-200',
          'On Leave': 'bg-amber-50 text-amber-700 border-amber-200',
          Terminated: 'bg-rose-50 text-rose-700 border-rose-200',
        };
        return (
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              statusColors[row.status] || 'bg-slate-50 text-slate-600'
            }`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/employees/${row._id}`)}
            title="View Profile"
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/employees/${row._id}/edit`)}
            title="Edit Details"
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row._id, row.status)}
            title={`Set to ${row.status === 'Active' ? 'Inactive' : 'Active'}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row._id, row.fullName)}
            title="Delete Record"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Employees Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage staff members, roles, salaries, and employment records.
          </p>
        </div>
        <button
          onClick={() => navigate('/employees/add')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm rounded-xl shadow-sm transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Employee</span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="w-full md:w-80 relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
          />
        </form>

        {/* Filters */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Dept:</span>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>Status:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-medium bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <DataTable
        columns={columns}
        data={employees}
        loading={loading}
        pagination={pagination}
        onPageChange={(page) => fetchEmployees(page)}
        emptyMessage="No employees found matching the specified criteria."
      />
    </div>
  );
}
