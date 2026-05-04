import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import app from '../src/app.js';
import connectDB from '../src/config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Connect to MongoDB (uses cached connection after first call)
connectDB();

export default app;
