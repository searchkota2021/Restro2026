const AppError = require('../utils/AppError');

module.exports = (err, req, res, next) => {
    console.error(`[Error] ${err.stack || err.message || err}`);

    let status = 500;
    let message = "Internal Server Error";

    if (err instanceof AppError) {
        status = err.statusCode;
        message = err.message;
    } else if (err.status) {
        status = err.status;
        message = err.message;
    }

    res.status(status).json({ 
        success: false, 
        error: message, 
        code: status 
    });
};

