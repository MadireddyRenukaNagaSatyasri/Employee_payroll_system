import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import Navbar from '../components/Navbar.jsx';

export default function AdminLayout() {
  const location = useLocation();

  // Map route path to human-readable titles
  const getPageTitle = (pathname) => {
    if (pathname.startsWith('/dashboard')) return 'Dashboard Overview';
    if (pathname.startsWith('/employees/add')) return 'Add New Employee';
    if (pathname.includes('/edit')) return 'Edit Employee Profile';
    if (pathname.startsWith('/employees/')) return 'Employee Profile Details';
    if (pathname.startsWith('/employees')) return 'Employee Management';
    if (pathname.startsWith('/attendance')) return 'Attendance Tracking';
    if (pathname.startsWith('/payroll')) return 'Monthly Payroll';
    if (pathname.startsWith('/payslips')) return 'Employee Payslips';
    if (pathname.startsWith('/reports')) return 'Reports & Analytics';
    if (pathname.startsWith('/settings')) return 'System Settings';
    return 'Admin Portal';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar title={getPageTitle(location.pathname)} />
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
