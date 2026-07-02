import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import { BOT_PROFILES } from './src/data/botProfiles.js';

dotenv.config();

const updateBotAvatars = async () => {
  try {
    console.log('🔄 Updating bot avatars...');
    
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anime';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    for (const profile of BOT_PROFILES) {
      const user = await User.findOne({ username: profile.username });
      if (user) {
        user.avatar = profile.avatar;
        user.bio = profile.bio;
        await user.save();
        console.log(`✅ Updated ${profile.displayName}`);
      }
    }

    console.log('🎉 All bot avatars updated!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

updateBotAvatars();
