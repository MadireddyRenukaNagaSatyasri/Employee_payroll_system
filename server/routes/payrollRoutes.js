import express from 'express';
import {
  generateMonthlyPayroll,
  getPayrollList,
  getPayrollById,
  updateDraftPayroll,
  finalizePayroll,
  reopenPayroll,
  markPayrollPaid,
  deletePayroll,
} from '../controllers/payrollController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All payroll routes require admin authentication
router.use(protect);

router.post('/generate', generateMonthlyPayroll);
router.get('/', getPayrollList);

router.route('/:id')
  .get(getPayrollById)
  .put(updateDraftPayroll)
  .delete(deletePayroll);

router.patch('/:id/finalize', finalizePayroll);
router.patch('/:id/reopen', reopenPayroll);
router.patch('/:id/pay', markPayrollPaid);

export default router;
