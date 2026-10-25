import express from 'express';
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  toggleEmployeeStatus,
  deleteEmployee,
} from '../controllers/employeeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All employee routes require admin authentication
router.use(protect);

router.route('/')
  .post(createEmployee)
  .get(getEmployees);

router.route('/:id')
  .get(getEmployeeById)
  .put(updateEmployee)
  .delete(deleteEmployee);

router.patch('/:id/status', toggleEmployeeStatus);

export default router;
