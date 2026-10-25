import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Save,
  Users,
  BarChart3,
  Search,
  History,
  X,
  FileCheck,
} from 'lucide-react';
import attendanceService from '../services/attendanceService.js';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import { formatDate, formatDateInput } from '../utils/formatDate.js';

export default function Attendance() {
  const [activeTab, setActiveTab] = useState('daily'); // 'daily' | 'summary'

  // Daily State
  const [selectedDate, setSelectedDate] = useState(formatDateInput(new Date()));
  const [dailyRecords, setDailyRecords] = useState([]);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [dailySaving, setDailySaving] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState({ type: '', text: '' });

  // Monthly Summary State
  const now = new Date();
  const [summaryMonth, setSummaryMonth] = useState(now.getMonth() + 1);
  const [summaryYear, setSummaryYear] = useState(now.getFullYear());
  const [summaryData, setSummaryData] = useState([]);
  const [summaryWorkingDays, setSummaryWorkingDays] = useState(26);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // History Modal State
  const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch Daily Attendance
  const fetchDailyAttendance = async (date) => {
    try {
      setDailyLoading(true);
      setFeedbackMsg({ type: '', text: '' });
      const res = await attendanceService.getAttendanceByDate(date);
      if (res.success) {
        setDailyRecords(
          res.attendance.map((item) => ({
            employeeId: item.employee._id,
            employeeCode: item.employee.employeeId,
            fullName: item.employee.fullName,
            department: item.employee.department,
            designation: item.employee.designation,
            status: item.status === 'Not Marked' ? 'Present' : item.status,
            notes: item.notes || '',
          }))
        );
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to fetch attendance for date.',
      });
    } finally {
      setDailyLoading(false);
    }
  };

  // Fetch Monthly Summary
  const fetchMonthlySummary = async (year, month) => {
    try {
      setSummaryLoading(true);
      const res = await attendanceService.getMonthlySummary(year, month);
      if (res.success) {
        setSummaryData(res.summary);
        setSummaryWorkingDays(res.standardWorkingDays);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to load monthly summary.');
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyAttendance(selectedDate);
    } else {
      fetchMonthlySummary(summaryYear, summaryMonth);
    }
  }, [activeTab, selectedDate, summaryYear, summaryMonth]);

  // Handle Daily Attendance change
  const handleStatusChange = (index, newStatus) => {
    setDailyRecords((prev) => {
      const updated = [...prev];
      updated[index].status = newStatus;
      return updated;
    });
  };

  const handleNotesChange = (index, notes) => {
    setDailyRecords((prev) => {
      const updated = [...prev];
      updated[index].notes = notes;
      return updated;
    });
  };

  const handleMarkAll = (status) => {
    setDailyRecords((prev) =>
      prev.map((rec) => ({
        ...rec,
        status,
      }))
    );
  };

  const handleSaveDaily = async () => {
    try {
      setDailySaving(true);
      setFeedbackMsg({ type: '', text: '' });

      const recordsToSave = dailyRecords.map((r) => ({
        employeeId: r.employeeId,
        status: r.status,
        notes: r.notes,
      }));

      const res = await attendanceService.recordBatchAttendance(selectedDate, recordsToSave);
      if (res.success) {
        setFeedbackMsg({
          type: 'success',
          text: `Attendance successfully saved for ${recordsToSave.length} employees on ${formatDate(selectedDate)}!`,
        });
      }
    } catch (err) {
      setFeedbackMsg({
        type: 'error',
        text: err.response?.data?.message || 'Failed to save attendance.',
      });
    } finally {
      setDailySaving(false);
    }
  };

  // Open History Modal
  const openHistory = async (employee) => {
    setSelectedEmployeeForHistory(employee);
    try {
      setHistoryLoading(true);
      const res = await attendanceService.getEmployeeHistory(employee._id || employee.employeeId);
      if (res.success) {
        setHistoryList(res.records);
      }
    } catch (err) {
      alert('Failed to load history.');
    } finally {
      setHistoryLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Attendance Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log daily employee check-ins and track monthly working attendance summaries.
          </p>
        </div>

        <div className="flex bg-slate-200/80 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'daily'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily Check-In
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'summary'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Monthly Summary
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY ATTENDANCE */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold uppercase text-slate-500">Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
              />
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                ({formatDate(selectedDate)})
              </span>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => handleMarkAll('Absent')}
                className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors"
              >
                Mark All Absent
              </button>
              <button
                type="button"
                onClick={handleSaveDaily}
                disabled={dailySaving || dailyRecords.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-medium text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{dailySaving ? 'Saving...' : 'Save Records'}</span>
              </button>
            </div>
          </div>

          {/* Feedback Alert */}
          {feedbackMsg.text && (
            <div
              className={`p-4 rounded-xl text-sm flex items-center gap-3 border ${
                feedbackMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {feedbackMsg.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{feedbackMsg.text}</span>
            </div>
          )}

          {/* Daily Table */}
          {dailyLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12">
              <LoadingSpinner text="Fetching attendance records..." />
            </div>
          ) : dailyRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              No active employees found to record attendance. Please add employees first.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5">Attendance Status</th>
                      <th className="px-6 py-3.5">Notes</th>
                      <th className="px-6 py-3.5 text-right">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {dailyRecords.map((row, idx) => (
                      <tr key={row.employeeId} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{row.fullName}</div>
                          <div className="font-mono text-xs text-sky-600 font-bold">
                            {row.employeeCode}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-700">{row.department}</div>
                          <div className="text-xs text-slate-400">{row.designation}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {[
                              { label: 'Present', val: 'Present', color: 'emerald' },
                              { label: 'Half-Day', val: 'Half-Day', color: 'amber' },
                              { label: 'Leave', val: 'Leave', color: 'blue' },
                              { label: 'Absent', val: 'Absent', color: 'rose' },
                            ].map((s) => {
                              const isSelected = row.status === s.val;
                              return (
                                <button
                                  key={s.val}
                                  type="button"
                                  onClick={() => handleStatusChange(idx, s.val)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                                    isSelected
                                      ? s.color === 'emerald'
                                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                                        : s.color === 'amber'
                                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                                        : s.color === 'blue'
                                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                                        : 'bg-rose-600 text-white border-rose-600 shadow-sm'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {s.label}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="Optional note..."
                            value={row.notes}
                            onChange={(e) => handleNotesChange(idx, e.target.value)}
                            className="w-full max-w-xs px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => openHistory({ _id: row.employeeId, fullName: row.fullName, employeeId: row.employeeCode })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                            title="View Employee Attendance Log"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MONTHLY SUMMARY */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Controls */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase text-slate-500">Period:</span>
              <select
                value={summaryMonth}
                onChange={(e) => setSummaryMonth(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {months.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <select
                value={summaryYear}
                onChange={(e) => setSummaryYear(parseInt(e.target.value, 10))}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/60">
              Standard Working Days in Period:{' '}
              <span className="font-bold text-slate-800">{summaryWorkingDays} days</span>
            </div>
          </div>

          {/* Summary Table */}
          {summaryLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12">
              <LoadingSpinner text="Computing attendance analytics..." />
            </div>
          ) : summaryData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500 text-sm">
              No employee records found.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                      <th className="px-6 py-3.5">Employee</th>
                      <th className="px-6 py-3.5">Department</th>
                      <th className="px-6 py-3.5 text-center text-emerald-700">Present</th>
                      <th className="px-6 py-3.5 text-center text-amber-600">Half-Days</th>
                      <th className="px-6 py-3.5 text-center text-sky-600">Leaves</th>
                      <th className="px-6 py-3.5 text-center text-rose-600">Absents</th>
                      <th className="px-6 py-3.5 text-center">Payable Days</th>
                      <th className="px-6 py-3.5 text-right">Attendance %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                    {summaryData.map((row) => (
                      <tr key={row.employee._id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-800">{row.employee.fullName}</div>
                          <div className="font-mono text-xs text-sky-600 font-bold">
                            {row.employee.employeeId}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-700">{row.employee.department}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-emerald-700">
                          {row.presentDays}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-amber-600">
                          {row.halfDays}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-sky-600">
                          {row.leaveDays}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold text-rose-600">
                          {row.absentDays}
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-800">
                          {row.payableDays}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span
                            className={`font-semibold px-2.5 py-1 rounded-full text-xs ${
                              row.attendancePercentage >= 90
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : row.attendancePercentage >= 75
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {row.attendancePercentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* EMPLOYEE HISTORY MODAL */}
      {selectedEmployeeForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800">Attendance Log</h3>
                <p className="text-xs text-slate-500">
                  {selectedEmployeeForHistory.fullName} ({selectedEmployeeForHistory.employeeId})
                </p>
              </div>
              <button
                onClick={() => setSelectedEmployeeForHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {historyLoading ? (
              <div className="p-8">
                <LoadingSpinner text="Loading log..." />
              </div>
            ) : historyList.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No attendance logs found for this employee.
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 pr-2">
                {historyList.map((log) => (
                  <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-800">{formatDate(log.date)}</div>
                      {log.notes && <div className="text-slate-400 italic mt-0.5">{log.notes}</div>}
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full font-semibold border ${
                        log.status === 'Present'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : log.status === 'Half-Day'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : log.status === 'Leave'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
