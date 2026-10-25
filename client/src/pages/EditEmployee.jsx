import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Building2, User, CreditCard, Banknote } from 'lucide-react';
import employeeService from '../services/employeeService.js';
import { formatDateInput } from '../utils/formatDate.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';

export default function EditEmployee() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [formData, setFormData] = useState({
    employeeId: '',
    fullName: '',
    email: '',
    phone: '',
    department: 'Engineering',
    designation: '',
    joiningDate: '',
    status: 'Active',
    basicSalary: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    panNumber: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const departments = [
    'Engineering',
    'Human Resources',
    'Finance',
    'Marketing',
    'Sales',
    'Operations',
    'Design',
    'Other',
  ];

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await employeeService.getEmployeeById(id);
        if (res.success && res.employee) {
          const emp = res.employee;
          setFormData({
            employeeId: emp.employeeId,
            fullName: emp.fullName,
            email: emp.email,
            phone: emp.phone,
            department: emp.department,
            designation: emp.designation,
            joiningDate: formatDateInput(emp.joiningDate),
            status: emp.status,
            basicSalary: emp.basicSalary,
            bankName: emp.bankDetails?.bankName || '',
            accountNumber: emp.bankDetails?.accountNumber || '',
            ifscCode: emp.bankDetails?.ifscCode || '',
            panNumber: emp.bankDetails?.panNumber || '',
          });
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch employee details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [id]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) return setError('Please enter the employee full name.');
    if (!formData.email.trim()) return setError('Please enter a valid email address.');
    if (!formData.phone.trim()) return setError('Please enter a phone number.');
    if (!formData.designation.trim()) return setError('Please enter a designation/job title.');
    if (!formData.basicSalary || Number(formData.basicSalary) <= 0) {
      return setError('Please enter a valid positive basic salary.');
    }

    try {
      setSaving(true);
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        department: formData.department,
        designation: formData.designation.trim(),
        joiningDate: formData.joiningDate,
        status: formData.status,
        basicSalary: Number(formData.basicSalary),
        bankDetails: {
          bankName: formData.bankName.trim(),
          accountNumber: formData.accountNumber.trim(),
          ifscCode: formData.ifscCode.trim(),
          panNumber: formData.panNumber.trim(),
        },
      };

      await employeeService.updateEmployee(id, payload);
      navigate(`/employees/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update employee details.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12">
        <LoadingSpinner text="Loading employee profile..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/employees')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Employees</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <div className="mb-8 border-b border-slate-100 pb-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Edit Employee: {formData.fullName}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Update employment records and salary details.
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-100">
            {formData.employeeId}
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Personal Details */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-sky-600" />
              <span>Personal Information</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Employment Details */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-sky-600" />
              <span>Employment & Role</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Designation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="designation"
                  required
                  value={formData.designation}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Joining Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="joiningDate"
                  required
                  value={formData.joiningDate}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Employment Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Salary & Compensation */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              <Banknote className="w-4 h-4 text-sky-600" />
              <span>Salary & Compensation</span>
            </div>
            <div className="max-w-xs">
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Monthly Basic Salary (₹) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  name="basicSalary"
                  required
                  min="0"
                  step="0.01"
                  value={formData.basicSalary}
                  onChange={handleChange}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Bank Account Details */}
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-4 pb-2 border-b border-slate-100">
              <CreditCard className="w-4 h-4 text-sky-600" />
              <span>Bank & Tax Details (Optional)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Bank Name
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Account Number
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  IFSC Code
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  PAN Number
                </label>
                <input
                  type="text"
                  name="panNumber"
                  value={formData.panNumber}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-all shadow-sm disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Updating...' : 'Update Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
