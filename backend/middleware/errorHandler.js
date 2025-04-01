// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Default error status and message
  let status = 500;
  let message = 'Internal Server Error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized: Invalid or missing authentication token';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden: You do not have permission to perform this action';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = err.message || 'Resource not found';
  }

  // Custom error response
  res.status(status).json({
    error: {
      status,
      message,
      // Include stack trace only in development
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
};

// Custom error classes
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

module.exports = {
  errorHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};