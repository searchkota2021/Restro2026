/**
 * Custom Error class for operational errors.
 * Preserves the stack trace and standardizes status codes.
 */
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        // Capture the stack trace, excluding the constructor call from it
        Error.captureStackTrace(this, this.constructor);
    }
}
module.exports = AppError;
