require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import the dynamic routes we defined above
const apiRoutes = require('./src/routes/api');

const app = express();

// Basic Middleware
app.use(cors()); // Allow cross-origin requests from your frontend
app.use(express.json()); // Parse JSON request bodies

// Mount the API Routes
app.use('/api', apiRoutes);

// Global Error Handler (Catches errors thrown by 'nxt(e)' in the routes)
app.use((err, req, res, next) => {
    console.error(`[Error]: ${err.message || err}`);
    const status = err.status || 500;
    res.status(status).json({
        success: false,
        error: err.message || 'Internal Server Error'
    });
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 RestroOS API Server running on http://localhost:${PORT}`);
});

