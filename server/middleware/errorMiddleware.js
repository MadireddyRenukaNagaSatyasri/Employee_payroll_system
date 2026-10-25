/**
 * 404 Not Found Middleware
 * Triggered when a requested endpoint does not match any registered routes.
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Resource Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

/**
 * Global Centralized Error Handler
 * Formats errors into standardized JSON responses and secures stack traces.
 */
export const errorHandler = (err, req, res, next) => {
  // If status is 200 (OK), default to 500 (Internal Server Error)
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'An unexpected internal server error occurred',
    errors: err.errors || null,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};