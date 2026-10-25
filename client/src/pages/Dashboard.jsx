import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  CreditCard,
  CalendarCheck,
  Clock,
  UserPlus,
  FileText,
  BarChart3,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import api from '../services/api.js';
import StatCard from '../components/StatCard.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import formatCurrency from '../utils/formatCurrency.js';
import formatDate from '../utils/formatDate.js';

export default function Dashboard() {
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.data?.success) {
        setStats(res.data.stats);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-16">
        <LoadingSpinner text="Computing real-time dashboard analytics..." />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-slate-700 font-semibold">{error || 'Could not load dashboard'}</p>
      </div>
    );
  }

  const { kpi, todayAttendance, payrollTrend, recentEmployees, recentPayrolls } = stats;

  return (
    <div className="space-y-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Workforce"
          value={kpi.totalEmployees}
          subtitle={`${kpi.activeEmployees} Active on payroll`}
          icon={Users}
          color="indigo"
        />

        <StatCard
          title="Active Employees"
          value={kpi.activeEmployees}
          subtitle={`${kpi.totalEmployees - kpi.activeEmployees} Inactive / On Leave`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Current Month Net Payroll"
          value={formatCurrency(kpi.currentMonthPayrollTotal)}
          subtitle="Net monthly disbursement"
          icon={CreditCard}
          color="sky"
        />

        <StatCard
          title="Pending Payroll Records"
          value={kpi.pendingPayrollCount}
          subtitle={`${kpi.paidPayrollCount} already disbursed`}
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-sky-600" />
          <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
            Quick Actions:
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => navigate('/employees/add')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 text-xs font-semibold border border-sky-100 transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Employee</span>
          </button>
          <button
            onClick={() => navigate('/attendance')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold border border-emerald-100 transition-colors"
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Mark Attendance</span>
          </button>
          <button
            onClick={() => navigate('/payroll')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold border border-indigo-100 transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Run Monthly Payroll</span>
          </button>
          <button
            onClick={() => navigate('/payslips')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 text-slate-700 hover:bg-slate-100 text-xs font-semibold border border-slate-200 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download Payslips</span>
          </button>
        </div>
      </div>

      {/* Grid: Chart (2 cols) & Today's Attendance Widget (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Payroll Recharts Bar Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Monthly Payroll Trends</h3>
              <p className="text-xs text-slate-400">Total Net vs Gross Payroll (Last 6 Months)</p>
            </div>
            <button
              onClick={() => navigate('/reports')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              <span>Full Analytics</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payrollTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => `₹${val / 1000}k`}
                />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="totalGross" name="Gross Payroll" fill="#93c5fd" radius={[6, 6, 0, 0]} />
                <Bar dataKey="totalNet" name="Net Payroll" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Attendance Widget */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-800 text-base">Today's Attendance</h3>
              <span className="text-[11px] font-semibold text-slate-400">
                {formatDate(new Date())}
              </span>
            </div>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-100 text-xs">
                <span className="font-semibold text-emerald-800">Present</span>
                <span className="font-bold text-emerald-900 text-sm">{todayAttendance.present}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-100 text-xs">
                <span className="font-semibold text-amber-800">Half-Day</span>
                <span className="font-bold text-amber-900 text-sm">{todayAttendance.halfDay}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-50/70 border border-sky-100 text-xs">
                <span className="font-semibold text-sky-800">On Approved Leave</span>
                <span className="font-bold text-sky-900 text-sm">{todayAttendance.leave}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50/70 border border-rose-100 text-xs">
                <span className="font-semibold text-rose-800">Absent</span>
                <span className="font-bold text-rose-900 text-sm">{todayAttendance.absent}</span>
              </div>
              {todayAttendance.notMarked > 0 && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs text-slate-500">
                  <span>Not Marked Yet</span>
                  <span className="font-bold text-slate-700">{todayAttendance.notMarked}</span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/attendance')}
            className="w-full mt-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>Open Attendance Tracker</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Two Column Bottom Row: Recent Employees & Recent Payroll Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Employees */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Recent Employees</h3>
            <button
              onClick={() => navigate('/employees')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              View Directory
            </button>
          </div>

          {recentEmployees.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No employee records yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentEmployees.map((emp) => (
                <div key={emp._id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-700 font-bold flex items-center justify-center text-xs">
                      {emp.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-slate-800">{emp.fullName}</p>
                      <p className="text-[11px] text-slate-400">
                        {emp.designation} • {emp.department}
                      </p>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {emp.employeeId}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payroll Activity */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 text-base">Recent Payroll Activity</h3>
            <button
              onClick={() => navigate('/payroll')}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700"
            >
              View Payroll
            </button>
          </div>

          {recentPayrolls.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No payroll records generated yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentPayrolls.map((p) => {
                const badgeColor =
                  p.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : p.status === 'Finalized'
                    ? 'bg-sky-50 text-sky-700 border-sky-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <div key={p._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-xs text-slate-800">
                        {p.employee?.fullName} ({p.period})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Net: <strong className="text-slate-700">{formatCurrency(p.netSalary)}</strong>
                      </p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeColor}`}>
                      ● {p.status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
