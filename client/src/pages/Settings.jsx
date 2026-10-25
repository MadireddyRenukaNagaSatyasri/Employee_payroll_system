import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Building2,
  Lock,
  Save,
  CheckCircle2,
  AlertCircle,
  Percent,
  Calendar,
} from 'lucide-react';
import api from '../services/api.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import authService from '../services/authService.js';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('company'); // 'company' | 'rules' | 'security'

  // Settings State
  const [settings, setSettings] = useState({
    companyName: '',
    companyAddress: '',
    taxId: '',
    contactEmail: '',
    currency: 'INR',
    currencySymbol: '₹',
    standardWorkingDays: 26,
    defaultHraPercent: 20,
    defaultDaPercent: 10,
    defaultPfPercent: 12,
    defaultEsiPercent: 0.75,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwFeedback, setPwFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        if (res.data?.success && res.data.settings) {
          setSettings(res.data.settings);
        }
      } catch (err) {
        setFeedback({
          type: 'error',
          text: err.response?.data?.message || 'Failed to fetch settings.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    setSettings((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (feedback.text) setFeedback({ type: '', text: '' });
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setFeedback({ type: '', text: '' });
      const res = await api.put('/settings', settings);
      if (res.data?.success) {
        setFeedback({
          type: 'success',
          text: 'Company and payroll configuration saved successfully!',
        });
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwFeedback({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return setPwFeedback({ type: 'error', text: 'New passwords do not match.' });
    }

    if (passwordData.newPassword.length < 6) {
      return setPwFeedback({
        type: 'error',
        text: 'New password must be at least 6 characters long.',
      });
    }

    try {
      setPwSaving(true);
      const res = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      if (res.success) {
        setPwFeedback({
          type: 'success',
          text: 'Admin password changed successfully!',
        });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      setPwFeedback({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password. Check your current password.',
      });
    } finally {
      setPwSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16">
        <LoadingSpinner text="Loading system settings..." />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure company profile, payroll calculation rates, and admin security credentials.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/80 p-1 rounded-2xl text-xs font-semibold">
        <button
          onClick={() => setActiveTab('company')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'company'
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Company Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'rules'
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Payroll & Attendance Rules</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
            activeTab === 'security'
              ? 'bg-white text-sky-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Admin Security</span>
        </button>
      </div>

      {/* TAB 1: COMPANY PROFILE */}
      {activeTab === 'company' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Company Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details appear on payslips, invoices, and exported reports.
            </p>
          </div>

          {feedback.text && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSettingsSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Company Legal Name
                </label>
                <input
                  type="text"
                  name="companyName"
                  value={settings.companyName}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Tax Identification Number (GSTIN/PAN)
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={settings.taxId}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Official Address
              </label>
              <input
                type="text"
                name="companyAddress"
                value={settings.companyAddress}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  HR / Contact Email
                </label>
                <input
                  type="email"
                  name="contactEmail"
                  value={settings.contactEmail}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Currency Code
                </label>
                <input
                  type="text"
                  name="currency"
                  value={settings.currency}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  name="currencySymbol"
                  value={settings.currencySymbol}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Company Details'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: RULES */}
      {activeTab === 'rules' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Payroll & Calculation Rules</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure baseline working days and default salary allowance/deduction rates.
            </p>
          </div>

          <form onSubmit={handleSettingsSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Standard Monthly Working Days (Days)
                </label>
                <input
                  type="number"
                  name="standardWorkingDays"
                  min="1"
                  max="31"
                  value={settings.standardWorkingDays}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Used to compute daily salary deduction rate.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Default HRA Allowance (% of Basic)
                </label>
                <input
                  type="number"
                  name="defaultHraPercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.defaultHraPercent}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Default DA Allowance (% of Basic)
                </label>
                <input
                  type="number"
                  name="defaultDaPercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.defaultDaPercent}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                  Default Employee PF (% of Basic)
                </label>
                <input
                  type="number"
                  name="defaultPfPercent"
                  min="0"
                  max="100"
                  step="0.1"
                  value={settings.defaultPfPercent}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Calculation Rules'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: ADMIN SECURITY */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-800">Change Admin Password</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Ensure you use a strong, unique password with at least 6 characters.
            </p>
          </div>

          {pwFeedback.text && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
                pwFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {pwFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{pwFeedback.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                placeholder="At least 6 characters"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-600 mb-1.5">
                Confirm New Password <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                placeholder="Repeat new password"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={pwSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{pwSaving ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
