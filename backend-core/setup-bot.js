import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { initAllBots } from './src/services/aiBotService.js';

dotenv.config();

const setupBot = async () => {
  try {
    console.log('🔧 Setting up AI Community Bots (10 unique profiles)...');

    // Connect to DB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anime';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Initialize all bots
    await initAllBots();

    console.log('🎉 All 10 AI Bots setup complete!');
    console.log('📌 To start the worker: npm run worker');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
};

setupBot();
