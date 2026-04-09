class AppError extends Error {
  constructor(message, statusCode, errorCode, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.isOperational = true; // distinguishes known errors from unexpected crashes
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;