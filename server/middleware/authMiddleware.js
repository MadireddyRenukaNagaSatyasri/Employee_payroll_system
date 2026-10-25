import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

/**
 * JWT Authentication Protection Middleware
 * Verifies Bearer token in Authorization header and populates req.admin.
 */
export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_characters_long_123456'
      );

      // Attach admin to request object (excluding password)
      const admin = await Admin.findById(decoded.id).select('-password');
      if (!admin) {
        return res.status(401).json({
          success: false,
          message: 'Not authorized: Admin account no longer exists',
        });
      }

      req.admin = admin;
      next();
    } catch (error) {
      console.error(`Auth Middleware error: ${error.message}`);
      return res.status(401).json({
        success: false,
        message:
          error.name === 'TokenExpiredError'
            ? 'Session expired. Please log in again.'
            : 'Not authorized: Invalid token',
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: No token provided',
    });
  }
};
