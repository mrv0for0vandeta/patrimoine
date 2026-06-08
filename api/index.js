// Vercel Serverless Function Entry Point
require('dotenv').config();

// Import the Express app
const app = require('../backend/server');

// Export handler for Vercel serverless
module.exports = async (req, res) => {
    // Let Express handle the request
    return app(req, res);
};
