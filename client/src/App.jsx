import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';
import Login from './pages/Login.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import Employees from './pages/Employees.jsx';
import AddEmployee from './pages/AddEmployee.jsx';
import EditEmployee from './pages/EditEmployee.jsx';
import EmployeeDetails from './pages/EmployeeDetails.jsx';
import Attendance from './pages/Attendance.jsx';
import Payroll from './pages/Payroll.jsx';
import SalaryDetails from './pages/SalaryDetails.jsx';
import Payslips from './pages/Payslips.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import NotFound from './pages/NotFound.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* Employee Management Routes */}
              <Route path="/employees" element={<Employees />} />
              <Route path="/employees/add" element={<AddEmployee />} />
              <Route path="/employees/:id" element={<EmployeeDetails />} />
              <Route path="/employees/:id/edit" element={<EditEmployee />} />

              {/* Attendance Management Route */}
              <Route path="/attendance" element={<Attendance />} />

              {/* Payroll Management Routes */}
              <Route path="/payroll" element={<Payroll />} />
              <Route path="/payroll/:id" element={<SalaryDetails />} />

              {/* Payslips & Reports Routes */}
              <Route path="/payslips" element={<Payslips />} />
              <Route path="/reports" element={<Reports />} />

              {/* System Settings Route */}
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* 404 Route */}
          <Route path="/404" element={<NotFound />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
