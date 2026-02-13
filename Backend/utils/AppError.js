class AppError extends Error {
    constructor(message, statusCode, errorCode = "INTERNAL_ERROR", field = null) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
        this.errorCode = errorCode; // e.g., VALIDATION_ERROR, NOT_FOUND
        this.field = field; // Optional: field causing the error
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;
