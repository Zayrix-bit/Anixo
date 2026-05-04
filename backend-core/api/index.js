import app from '../src/app.js';
import connectDB from '../src/config/db.js';

// Initialize DB connection
connectDB().catch(err => console.error("Database connection failed:", err));

export default app;
