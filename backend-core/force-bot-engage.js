import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getAllActiveBots, createBotReply, addRandomBotLikes } from './src/services/aiBotService.js';
import CommunityPost from './src/models/CommunityPost.js';

dotenv.config();

const forceBotEngage = async () => {
  try {
    const postId = process.argv[2];
    if (!postId) {
      console.log('❌ Please provide a Post ID.');
      console.log('👉 Usage: npm run force-engage <POST_ID>');
      process.exit(1);
    }

    console.log(`🤖 Forcing AI Bots to engage with post: ${postId}...`);

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anime';
    await mongoose.connect(mongoUri);

    const post = await CommunityPost.findById(postId).populate('author');
    if (!post) {
      console.log('❌ Post not found!');
      process.exit(1);
    }

    // 1. Add random likes to the post
    console.log('❤️  Adding random bot likes to the post...');
    await addRandomBotLikes(postId);
    console.log('✅ Likes added!');

    // 2. Add random replies
    console.log('\n💬 Generating immediate bot replies...');
    const allBots = await getAllActiveBots();
    const shuffledBots = allBots.sort(() => 0.5 - Math.random());
    const numReplies = Math.floor(Math.random() * 4) + 1; // 1 to 4 replies

    let repliesAdded = 0;
    for (let i = 0; i < shuffledBots.length; i++) {
      if (repliesAdded >= numReplies) break;
      const bot = shuffledBots[i];
      
      // Don't reply if it's the bot's own post
      if (post.author?.username === bot.username) continue;
      
      console.log(`   -> ${bot.displayName} is replying...`);
      try {
        await createBotReply(bot, post._id);
        repliesAdded++;
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        console.error(`   -> Failed for ${bot.displayName}:`, err.message);
      }
    }
    
    console.log(`✅ Added ${repliesAdded} instant replies!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Force engage failed:', error);
    process.exit(1);
  }
};

forceBotEngage();