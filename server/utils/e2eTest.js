import http from 'http';
import dotenv from 'dotenv';
import connectDB, { disconnectDB } from '../config/db.js';
import app from '../app.js';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Settings from '../models/Settings.js';
import formatPayslipData from './generatePayslip.js';

dotenv.config();

const PORT = 5007;

const runE2ETests = async () => {
  console.log('🧪 Starting End-to-End System Integration Tests...');
  const startTime = Date.now();
  let passedTests = 0;
  let totalTests = 0;

  const assert = (condition, testName) => {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      throw new Error(`Assertion failed: ${testName}`);
    }
  };

  await connectDB();

  // Reset database to known test state
  await Admin.deleteMany({});
  await Employee.deleteMany({});
  await Attendance.deleteMany({});
  await Payroll.deleteMany({});
  await Settings.deleteMany({});

  const server = http.createServer(app).listen(PORT, async () => {
    try {
      const baseUrl = `http://localhost:${PORT}/api`;

      // ==========================================
      // TEST SUITE 1: ADMIN AUTHENTICATION
      // ==========================================
      console.log('\n--- 1. Admin Authentication Tests ---');

      // 1.1 Seed Admin
      await Admin.create({
        name: 'Super Admin',
        email: 'admin@payroll.com',
        password: 'Admin@12345',
        role: 'superadmin',
      });

      // 1.2 Failed Login
      const failLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@payroll.com', password: 'BadPassword' }),
      });
      assert(failLogin.status === 401, 'Rejects invalid password with 401');

      // 1.3 Successful Login
      const successLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@payroll.com', password: 'Admin@12345' }),
      });
      assert(successLogin.status === 200, 'Authenticates valid credentials with 200');
      const loginData = await successLogin.json();
      assert(!!loginData.token, 'Issues signed JWT Bearer token');
      assert(!loginData.admin.password, 'Does not leak hashed or plain password in response');
      const token = loginData.token;
      const authHeader = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      // 1.4 Protected Profile Endpoint
      const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeader });
      const meData = await meRes.json();
      assert(meRes.status === 200 && meData.admin.email === 'admin@payroll.com', 'Returns admin profile for authorized token');

      // ==========================================
      // TEST SUITE 2: EMPLOYEE MANAGEMENT (CRUD)
      // ==========================================
      console.log('\n--- 2. Employee Management Tests ---');

      // 2.1 Create Employee 1
      const emp1Res = await fetch(`${baseUrl}/employees`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          fullName: 'Vikram Malhotra',
          email: 'vikram.m@example.com',
          phone: '+91 98765 11111',
          department: 'Engineering',
          designation: 'Staff Engineer',
          basicSalary: 95000,
          bankDetails: {
            bankName: 'HDFC Bank',
            accountNumber: '501001111111',
            ifscCode: 'HDFC0001234',
            panNumber: 'ABCDE1111M',
          },
        }),
      });
      assert(emp1Res.status === 201, 'Creates new employee with 201 Created');
      const emp1Data = await emp1Res.json();
      const emp1 = emp1Data.employee;
      assert(emp1.employeeId === 'EMP-1001', 'Auto-assigns sequential ID EMP-1001');

      // 2.2 Create Employee 2
      const emp2Res = await fetch(`${baseUrl}/employees`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          fullName: 'Neha Kapoor',
          email: 'neha.k@example.com',
          phone: '+91 98765 22222',
          department: 'Marketing',
          designation: 'Growth Lead',
          basicSalary: 70000,
        }),
      });
      const emp2Data = await emp2Res.json();
      const emp2 = emp2Data.employee;
      assert(emp2.employeeId === 'EMP-1002', 'Auto-assigns sequential ID EMP-1002');

      // 2.3 Prevent Duplicate Email
      const dupRes = await fetch(`${baseUrl}/employees`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          fullName: 'Duplicate User',
          email: 'vikram.m@example.com',
          phone: '+91 98765 00000',
          department: 'Finance',
          designation: 'Analyst',
          basicSalary: 50000,
        }),
      });
      assert(dupRes.status === 400, 'Rejects duplicate employee email with 400 Bad Request');

      // 2.4 Query Employees with Search and Filter
      const listEmpRes = await fetch(`${baseUrl}/employees?department=Engineering`, { headers: authHeader });
      const listEmpData = await listEmpRes.json();
      assert(listEmpData.total === 1 && listEmpData.employees[0].fullName === 'Vikram Malhotra', 'Filters employees by department correctly');

      // ==========================================
      // TEST SUITE 3: ATTENDANCE MANAGEMENT
      // ==========================================
      console.log('\n--- 3. Attendance Management Tests ---');

      // 3.1 Record Attendance
      const attRes = await fetch(`${baseUrl}/attendance`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          employeeId: emp1._id,
          date: '2026-10-25',
          status: 'Present',
          notes: 'On time',
        }),
      });
      assert(attRes.status === 200, 'Logs employee daily attendance with 200 OK');

      // 3.2 Upsert / Prevent Duplicate on Same Date
      const attDupRes = await fetch(`${baseUrl}/attendance`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          employeeId: emp1._id,
          date: '2026-10-25',
          status: 'Half-Day',
          notes: 'Updated to half day',
        }),
      });
      assert(attDupRes.status === 200, 'Upserts existing attendance without creating duplicate document');
      const countAtt = await Attendance.countDocuments({ employee: emp1._id });
      assert(countAtt === 1, 'Maintains exact 1 attendance document per employee per date');

      // 3.3 Batch Attendance
      const batchRes = await fetch(`${baseUrl}/attendance/batch`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          date: '2026-10-26',
          records: [
            { employeeId: emp1._id, status: 'Present' },
            { employeeId: emp2._id, status: 'Leave', notes: 'Sick leave approved' },
          ],
        }),
      });
      assert(batchRes.status === 200, 'Logs batch attendance for multiple employees in single request');

      // ==========================================
      // TEST SUITE 4: PAYROLL CALCULATION & LIFECYCLE
      // ==========================================
      console.log('\n--- 4. Payroll Calculation & Lifecycle Tests ---');

      // 4.1 Generate Monthly Payroll
      const genRes = await fetch(`${baseUrl}/payroll/generate`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ year: 2026, month: 10 }),
      });
      assert(genRes.status === 200, 'Calculates and generates monthly payroll for all employees');

      // 4.2 Inspect Generated Draft
      const payrollListRes = await fetch(`${baseUrl}/payroll?year=2026&month=10`, { headers: authHeader });
      const payrollListData = await payrollListRes.json();
      const p1 = payrollListData.payrolls.find((p) => p.employee.employeeId === 'EMP-1001');
      assert(p1 && p1.status === 'Draft', 'New payroll records default to Draft status for review');
      assert(p1.grossSalary > p1.basicSalary, 'Computes gross salary including HRA/DA allowances');
      assert(p1.netSalary === p1.grossSalary - p1.deductions.totalDeductions, 'Computes net take-home salary accurately');

      // 4.3 Finalize Payroll
      const finalizeRes = await fetch(`${baseUrl}/payroll/${p1._id}/finalize`, {
        method: 'PATCH',
        headers: authHeader,
      });
      assert(finalizeRes.status === 200, 'Finalizes payroll record for payout');
      const finalData = await finalizeRes.json();
      assert(finalData.payroll.status === 'Finalized', 'Status transitions to Finalized');

      // 4.4 Prevent Accidental Edits on Finalized
      const badEditRes = await fetch(`${baseUrl}/payroll/${p1._id}`, {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({ allowances: { hra: 99999 } }),
      });
      assert(badEditRes.status === 400, 'Blocks edits on Finalized records with 400 Bad Request');

      // 4.5 Authorized Reopening
      const reopenRes = await fetch(`${baseUrl}/payroll/${p1._id}/reopen`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify({ reason: 'Audit allowance review adjustment' }),
      });
      assert(reopenRes.status === 200, 'Reopens finalized record to Draft with reason');

      // 4.6 Re-finalize and Mark Paid
      await fetch(`${baseUrl}/payroll/${p1._id}/finalize`, { method: 'PATCH', headers: authHeader });
      const payRes = await fetch(`${baseUrl}/payroll/${p1._id}/pay`, {
        method: 'PATCH',
        headers: authHeader,
        body: JSON.stringify({
          paymentMethod: 'Bank Transfer',
          transactionReference: 'NEFT20261025999',
        }),
      });
      assert(payRes.status === 200, 'Marks payroll record as Paid with transaction reference');
      const paidData = await payRes.json();
      assert(paidData.payroll.status === 'Paid', 'Status transitions to Paid');

      // ==========================================
      // TEST SUITE 5: PAYSLIPS & REPORTING (CSV)
      // ==========================================
      console.log('\n--- 5. Payslips & Reporting Tests ---');

      // 5.1 Format Payslip Data
      const fullPayrollDoc = await Payroll.findById(p1._id).populate('employee');
      const formattedPayslip = formatPayslipData(fullPayrollDoc);
      assert(!!formattedPayslip.payslipNumber && formattedPayslip.employee.id === 'EMP-1001', 'Formats complete payslip object with earnings, deductions, and bank details');

      // 5.2 Monthly Payroll CSV Export
      const csvRes = await fetch(`${baseUrl}/reports/payroll?year=2026&month=10&format=csv`, { headers: authHeader });
      assert(csvRes.status === 200 && csvRes.headers.get('content-type').includes('text/csv'), 'Generates streaming text/csv response for payroll report');
      const csvText = await csvRes.text();
      assert(csvText.includes('Employee ID') && csvText.includes('Vikram Malhotra'), 'CSV contains proper column headers and records');

      // 5.3 Employee Roster CSV Export
      const empCsvRes = await fetch(`${baseUrl}/reports/employees?format=csv`, { headers: authHeader });
      const empCsvText = await empCsvRes.text();
      assert(empCsvText.includes('Neha Kapoor'), 'Generates employee roster CSV');

      // ==========================================
      // TEST SUITE 6: DASHBOARD & SETTINGS
      // ==========================================
      console.log('\n--- 6. Dashboard Analytics & System Settings Tests ---');

      // 6.1 Dashboard Analytics
      const dashRes = await fetch(`${baseUrl}/reports/dashboard`, { headers: authHeader });
      const dashData = await dashRes.json();
      assert(dashData.stats.kpi.totalEmployees === 2, 'Dashboard reports correct live total employees');
      assert(dashData.stats.payrollTrend.length === 6, 'Dashboard computes 6-month historical payroll trends');

      // 6.2 Settings
      const setRes = await fetch(`${baseUrl}/settings`, { headers: authHeader });
      const setData = await setRes.json();
      assert(!!setData.settings.companyName, 'Retrieves company settings');

      const updateSetRes = await fetch(`${baseUrl}/settings`, {
        method: 'PUT',
        headers: authHeader,
        body: JSON.stringify({ companyName: 'Global Tech Corp Ltd.' }),
      });
      const updateSetData = await updateSetRes.json();
      assert(updateSetData.settings.companyName === 'Global Tech Corp Ltd.', 'Persists updated system settings to MongoDB');

      // ==========================================
      // FINAL TEST SUMMARY
      // ==========================================
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log('\n==============================================');
      console.log(`🎉 ALL ${passedTests}/${totalTests} END-TO-END TESTS PASSED! (${duration}s)`);
      console.log('==============================================\n');
    } catch (err) {
      console.error('\n❌ E2E TEST FAILED:', err.message);
      process.exitCode = 1;
    } finally {
      server.close();
      await disconnectDB();
      process.exit(process.exitCode || 0);
    }
  });
};

runE2ETests();
