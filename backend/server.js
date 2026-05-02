require('dotenv').config();
const express = require('express');

// Import the dynamic API routes
const apiRoutes = require('./src/routes/api');

// Initialize Express App
const app = express();

// ==========================================
// 1. MIDDLEWARE
// ==========================================

// Add manual CORS headers to all responses
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, DELETE, OPTIONS'
    );
    // Added 'Cookie' to allow Vercel SSO tokens to pass through
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie');
    
    // Handle browser preflight requests successfully
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Parse incoming JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// 2. ROUTES
// ==========================================
// Root health-check endpoint (Verifies Vercel deployment is awake)
app.get('/', (req, res) => {
    res.status(200).json({ 
        success: true, 
        message: '🚀 RestroOS API is actively running on Vercel!' 
    });
});

// Mount all our SOLID architecture API routes
app.use('/api', apiRoutes);

// ==========================================
// 3. GLOBAL ERROR HANDLER
// ==========================================
// Catches all errors thrown by controllers or services
app.use((err, req, res, next) => {
    console.error(`[Server Error]: ${err.stack || err.message || err}`);
    
    let status = 500;
    let message = "Internal Server Error";

    // Handle our custom AppError or passed status codes
    if (err.statusCode) {
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
});

// ==========================================
// 4. VERCEL SERVERLESS EXPORT
// ==========================================
/**
 * CRITICAL FOR VERCEL: 
 * Vercel Serverless functions require the Express app to be EXPORTED.
 * We only use app.listen() if we are running the code locally.
 */
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`💻 Local Development Server running on http://localhost:${PORT}`);
    });
}

// Export the app for Vercel Serverless execution
module.exports = app;
