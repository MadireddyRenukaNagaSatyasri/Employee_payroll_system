import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import connectDB, { disconnectDB } from '../config/db.js';
import Admin from '../models/Admin.js';
import Employee from '../models/Employee.js';
import Attendance from '../models/Attendance.js';
import Payroll from '../models/Payroll.js';
import Settings from '../models/Settings.js';
import { calculateEmployeePayroll } from '../services/payrollService.js';

dotenv.config();

/**
 * Seed realistic fictional test data for the Employee Payroll System
 * Run via: node utils/seedData.js (or: npm run seed)
 */
export const seedSampleData = async ({ shouldExit = true, shouldDisconnect = true } = {}) => {
  try {
    await connectDB();
    console.log('🌱 Checking / Seeding demonstration data...');

    // 1. Seed or preserve Admin
    let admin = await Admin.findOne({ email: 'admin@payroll.com' });
    if (!admin) {
      admin = await Admin.create({
        name: 'System Administrator',
        email: 'admin@payroll.com',
        password: 'Admin@12345',
        role: 'superadmin',
      });
      console.log('✅ Created Superadmin: admin@payroll.com / Admin@12345');
    } else {
      console.log('ℹ️ Admin account already exists (admin@payroll.com)');
    }

    // 2. Initialize default Settings
    await Settings.getSettings();
    console.log('✅ Company Settings initialized.');

    // 3. Seed Realistic Fictional Employees
    const sampleEmployees = [
      {
        employeeId: 'EMP-1001',
        fullName: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phone: '+91 98765 01001',
        department: 'Engineering',
        designation: 'Principal Software Architect',
        basicSalary: 120000,
        status: 'Active',
        joiningDate: new Date('2023-01-15'),
        bankDetails: {
          bankName: 'HDFC Bank',
          accountNumber: '50100123456789',
          ifscCode: 'HDFC0000123',
          panNumber: 'ABCDE1001A',
        },
      },
      {
        employeeId: 'EMP-1002',
        fullName: 'Priya Patel',
        email: 'priya.patel@example.com',
        phone: '+91 98765 01002',
        department: 'Human Resources',
        designation: 'HR Operations Lead',
        basicSalary: 65000,
        status: 'Active',
        joiningDate: new Date('2023-04-10'),
        bankDetails: {
          bankName: 'ICICI Bank',
          accountNumber: '00010123456789',
          ifscCode: 'ICIC0000001',
          panNumber: 'BCDEF1002B',
        },
      },
      {
        employeeId: 'EMP-1003',
        fullName: 'Rohan Verma',
        email: 'rohan.verma@example.com',
        phone: '+91 98765 01003',
        department: 'Finance',
        designation: 'Senior Financial Analyst',
        basicSalary: 80000,
        status: 'Active',
        joiningDate: new Date('2023-06-01'),
        bankDetails: {
          bankName: 'State Bank of India',
          accountNumber: '20100123456789',
          ifscCode: 'SBIN0001234',
          panNumber: 'CDEFG1003C',
        },
      },
      {
        employeeId: 'EMP-1004',
        fullName: 'Sneha Rao',
        email: 'sneha.rao@example.com',
        phone: '+91 98765 01004',
        department: 'Marketing',
        designation: 'Digital Marketing Strategist',
        basicSalary: 55000,
        status: 'Active',
        joiningDate: new Date('2023-09-15'),
        bankDetails: {
          bankName: 'Axis Bank',
          accountNumber: '91001012345678',
          ifscCode: 'UTIB0000123',
          panNumber: 'DEFGH1004D',
        },
      },
      {
        employeeId: 'EMP-1005',
        fullName: 'Vikram Singh',
        email: 'vikram.singh@example.com',
        phone: '+91 98765 01005',
        department: 'Operations',
        designation: 'Logistics & Supply Manager',
        basicSalary: 70000,
        status: 'Active',
        joiningDate: new Date('2024-02-01'),
        bankDetails: {
          bankName: 'Kotak Mahindra Bank',
          accountNumber: '40100123456789',
          ifscCode: 'KKBK0000123',
          panNumber: 'EFGHI1005E',
        },
      },
      {
        employeeId: 'EMP-1006',
        fullName: 'Ananya Deshmukh',
        email: 'ananya.deshmukh@example.com',
        phone: '+91 98765 01006',
        department: 'Design',
        designation: 'Product UI/UX Designer',
        basicSalary: 60000,
        status: 'Active',
        joiningDate: new Date('2024-05-15'),
        bankDetails: {
          bankName: 'HDFC Bank',
          accountNumber: '50100987654321',
          ifscCode: 'HDFC0000123',
          panNumber: 'FGHIJ1006F',
        },
      },
    ];

    const seededEmployees = [];
    for (const empData of sampleEmployees) {
      let emp = await Employee.findOne({ email: empData.email });
      if (!emp) {
        emp = await Employee.create(empData);
        console.log(`   + Created Employee: ${emp.fullName} (${emp.employeeId})`);
      }
      seededEmployees.push(emp);
    }

    // 4. Seed Attendance Records for Current Month
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const daysInCurMonth = Math.min(now.getDate(), 20); // up to current day or 20

    console.log(`📅 Seeding attendance records for ${curYear}-${curMonth}...`);
    for (const emp of seededEmployees) {
      for (let day = 1; day <= daysInCurMonth; day++) {
        const dateObj = new Date(Date.UTC(curYear, curMonth - 1, day, 0, 0, 0));
        const dayOfWeek = dateObj.getUTCDay();

        // Skip Sundays
        if (dayOfWeek === 0) continue;

        let status = 'Present';
        let notes = '';

        // Add realistic variance
        if (emp.employeeId === 'EMP-1002' && day === 5) {
          status = 'Leave';
          notes = 'Medical leave';
        } else if (emp.employeeId === 'EMP-1004' && day === 12) {
          status = 'Half-Day';
          notes = 'Client meeting morning only';
        } else if (emp.employeeId === 'EMP-1005' && day === 8) {
          status = 'Absent';
          notes = 'Unplanned absence';
        }

        await Attendance.findOneAndUpdate(
          { employee: emp._id, date: dateObj },
          { status, notes },
          { upsert: true, new: true }
        );
      }
    }
    console.log('✅ Attendance seeded.');

    // 5. Seed Payroll Records for Current Month and Prior Month
    console.log('💳 Generating and seeding sample payroll records...');

    // Prior Month (Finalized & Paid)
    const prevDate = new Date(curYear, curMonth - 2, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth() + 1;

    for (const emp of seededEmployees) {
      const existingPrev = await Payroll.findOne({
        employee: emp._id,
        year: prevYear,
        month: prevMonth,
      });

      if (!existingPrev) {
        const calc = await calculateEmployeePayroll(emp, prevYear, prevMonth);
        await Payroll.create({
          ...calc,
          status: 'Paid',
          finalizedAt: new Date(prevYear, prevMonth - 1, 28),
          paidAt: new Date(prevYear, prevMonth - 1, 30),
          paymentDetails: {
            paymentDate: new Date(prevYear, prevMonth - 1, 30),
            paymentMethod: 'Bank Transfer',
            transactionReference: `NEFT${prevYear}${prevMonth}${emp.employeeId}`,
          },
        });
      }
    }

    // Current Month (Mix of Draft and Finalized)
    for (let i = 0; i < seededEmployees.length; i++) {
      const emp = seededEmployees[i];
      const existingCur = await Payroll.findOne({
        employee: emp._id,
        year: curYear,
        month: curMonth,
      });

      if (!existingCur) {
        const calc = await calculateEmployeePayroll(emp, curYear, curMonth);
        const status = i < 3 ? 'Finalized' : 'Draft';
        await Payroll.create({
          ...calc,
          status,
          finalizedAt: status === 'Finalized' ? new Date() : null,
        });
      }
    }

    console.log('✅ Payroll records seeded.');
    console.log('==============================================');
    console.log('🎉 DEMONSTRATION SEED COMPLETED SUCCESSFULLY!');
    console.log('   Admin Login: admin@payroll.com / Admin@12345');
    console.log(`   Employees:   ${seededEmployees.length} Active Staff`);
    console.log('==============================================');

    if (shouldDisconnect) {
      await disconnectDB();
    }
    if (shouldExit) {
      process.exit(0);
    }
    return true;
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    if (shouldDisconnect) {
      await disconnectDB();
    }
    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};

// Execute if run directly from CLI
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  seedSampleData({ shouldExit: true, shouldDisconnect: true });
}
