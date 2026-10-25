import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Power,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Building2,
  Briefcase,
  Banknote,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import employeeService from '../services/employeeService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import formatDate from '../utils/formatDate.js';

export default function EmployeeDetails() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchEmployee = async () => {
    try {
      setLoading(true);
      const res = await employeeService.getEmployeeById(id);
      if (res.success && res.employee) {
        setEmployee(res.employee);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch employee details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployee();
  }, [id]);

  const handleToggleStatus = async () => {
    const newStatus = employee.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await employeeService.toggleStatus(employee._id, newStatus);
      fetchEmployee();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Permanently delete ${employee.fullName}?`)) {
      try {
        await employeeService.deleteEmployee(employee._id);
        navigate('/employees');
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to delete employee');
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner text="Loading employee profile..." />
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <p className="text-slate-700 font-semibold mb-2">{error || 'Employee not found'}</p>
        <button
          onClick={() => navigate('/employees')}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 underline"
        >
          Return to Employee Directory
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Back & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/employees/${employee._id}/edit`)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl shadow-sm transition-all"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl shadow-sm transition-all ${
              employee.status === 'Active'
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{employee.status === 'Active' ? 'Deactivate' : 'Activate'}</span>
          </button>
          <button
            onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 text-xs font-medium rounded-xl shadow-sm transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Main Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-sky-100 text-sky-700 font-bold text-2xl flex items-center justify-center shadow-inner">
              {employee.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-800">{employee.fullName}</h1>
                <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                  {employee.employeeId}
                </span>
              </div>
              <p className="text-slate-500 font-medium text-sm mt-0.5">
                {employee.designation} • {employee.department}
              </p>
            </div>
          </div>

          <div>
            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
                employee.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              ● {employee.status}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          {/* Contact & Personal */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Contact & Joining
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500 w-28">Email:</span>
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500 w-28">Phone:</span>
                <span>{employee.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500 w-28">Joining Date:</span>
                <span>{formatDate(employee.joiningDate)}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Building2 className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500 w-28">Department:</span>
                <span>{employee.department}</span>
              </div>
            </div>
          </div>

          {/* Compensation & Bank */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Salary & Financial Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <Banknote className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500 w-28">Basic Salary:</span>
                <span className="font-bold text-slate-800 text-base">
                  {formatCurrency(employee.basicSalary)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <CreditCard className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-500 w-28">Bank Name:</span>
                <span>{employee.bankDetails?.bankName || 'Not Provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-4" />
                <span className="font-medium text-slate-500 w-28">Account No:</span>
                <span className="font-mono">{employee.bankDetails?.accountNumber || 'Not Provided'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <span className="w-4" />
                <span className="font-medium text-slate-500 w-28">IFSC / PAN:</span>
                <span className="font-mono">
                  {employee.bankDetails?.ifscCode || '-'} / {employee.bankDetails?.panNumber || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
