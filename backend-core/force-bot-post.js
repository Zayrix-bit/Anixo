import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getRandomBot, createBotPost, getAllActiveBots, createBotReply } from './src/services/aiBotService.js';

dotenv.config();

const forceBotPost = async () => {
  try {
    console.log('🤖 Manual AI Bot Post Trigger...');

    // Connect to DB
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anime';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Get a random active bot
    const bot = await getRandomBot();
    if (!bot) {
      console.log('❌ No active bots found. Please run "npm run setup-bot" first.');
      process.exit(1);
    }

    console.log(`🤖 Selected Bot: ${bot.displayName} (@${bot.username})`);
    console.log('✍️  Generating post... (this might take a few seconds)');

    // Force the bot to post (This already adds 8-24 likes automatically!)
    const post = await createBotPost(bot);

    if (post) {
      console.log('🎉 Post created successfully!');
      console.log(`📌 Title: ${post.title}`);
      console.log(`🏷️  Category: ${post.category}`);
      console.log(`🔖 Tags: ${post.tags.join(', ')}`);
      
      // Post likes are already handled inside createBotPost()
      console.log(`❤️  Random Likes Automatically Added!`);
      
      // Generate immediate replies from OTHER bots
      console.log('\n💬 Generating immediate bot replies...');
      const allBots = await getAllActiveBots();
      const otherBots = allBots.filter(b => b.username !== bot.username);
      const shuffledBots = otherBots.sort(() => 0.5 - Math.random());
      const numReplies = Math.floor(Math.random() * 3) + 1; // 1 to 3 replies
      
      for (let i = 0; i < Math.min(numReplies, shuffledBots.length); i++) {
        const replyBot = shuffledBots[i];
        console.log(`   -> ${replyBot.displayName} is replying...`);
        // createBotReply also automatically adds likes to the comment itself
        await createBotReply(replyBot, post._id);
        await new Promise(r => setTimeout(r, 2000));
      }
      console.log(`✅ Added ${numReplies} instant replies!`);
      
    } else {
      console.log('⚠️ Bot failed to create a post (posting might be disabled).');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Force post failed:', error);
    process.exit(1);
  }
};

forceBotPost();