import express from 'express';
import {
  getDashboardAnalytics,
  getMonthlyPayrollReport,
  getEmployeeListReport,
  getDepartmentSummaryReport,
  getAttendanceReport,
  getSalaryBreakdownReport,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All reporting endpoints require admin authentication
router.use(protect);

router.get('/dashboard', getDashboardAnalytics);
router.get('/payroll', getMonthlyPayrollReport);
router.get('/employees', getEmployeeListReport);
router.get('/departments', getDepartmentSummaryReport);
router.get('/attendance', getAttendanceReport);
router.get('/salary-breakdown', getSalaryBreakdownReport);

export default router;
