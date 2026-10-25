import express from 'express';
import rateLimit from 'express-rate-limit';
import { login, getMe, changePassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rate limiter for login endpoint (strict to prevent brute force)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Authentication routes
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

export default router;
