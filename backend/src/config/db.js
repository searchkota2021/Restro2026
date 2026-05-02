const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT || 3306,
    
    // Serverless optimization: lower limit prevents Vercel from exhausting Aiven connections
    connectionLimit: 5, 
    waitForConnections: true,
    queueLimit: 0,
    
    // CRITICAL FOR AIVEN CLOUD: Enforces secure connection
    ssl: {
        rejectUnauthorized: false // Allows connection to Aiven's managed certificates
    }
});

// Test the connection immediately so Vercel logs will show if it fails
pool.getConnection()
    .then(conn => {
        console.log("✅ Successfully connected to Aiven MySQL Database!");
        conn.release();
    })
    .catch(err => {
        console.error("❌ Failed to connect to MySQL Database:", err.message);
    });

module.exports = pool;
