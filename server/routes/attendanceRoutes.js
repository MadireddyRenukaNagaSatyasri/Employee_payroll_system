import express from 'express';
import {
  recordAttendance,
  recordBatchAttendance,
  getAttendanceByDate,
  getMonthlyAttendanceSummary,
  getEmployeeAttendanceHistory,
  updateAttendance,
  deleteAttendance,
} from '../controllers/attendanceController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All attendance routes require admin authentication
router.use(protect);

router.post('/', recordAttendance);
router.post('/batch', recordBatchAttendance);
router.get('/date', getAttendanceByDate);
router.get('/summary', getMonthlyAttendanceSummary);
router.get('/employee/:employeeId', getEmployeeAttendanceHistory);

router.route('/:id')
  .put(updateAttendance)
  .delete(deleteAttendance);

export default router;
