import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { getAllActiveBots, createBotReply } from './src/services/aiBotService.js';
import CommunityPost from './src/models/CommunityPost.js';
import CommunityComment from './src/models/CommunityComment.js';

dotenv.config();

const forceBotNestedEngage = async () => {
  try {
    const postId = process.argv[2];
    if (!postId) {
      console.log('❌ Please provide a Post ID.');
      console.log('👉 Usage: node force-bot-nested-reply.js <POST_ID>');
      process.exit(1);
    }

    console.log(`🤖 Forcing AI Bots to reply to existing comments on post: ${postId}...`);

    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/anime';
    await mongoose.connect(mongoUri);

    const post = await CommunityPost.findById(postId).populate('author');
    if (!post) {
      console.log('❌ Post not found!');
      process.exit(1);
    }

    // 1. Get all top level comments
    const comments = await CommunityComment.find({ post: postId, parentId: null });
    
    if (comments.length === 0) {
      console.log('❌ No top-level comments found to reply to.');
      process.exit(1);
    }

    console.log(`\n💬 Generating bot replies to ${comments.length} comments...`);
    const allBots = await getAllActiveBots();

    let repliesAdded = 0;
    
    for (const comment of comments) {
      const shuffledBots = allBots.sort(() => 0.5 - Math.random());
      const numReplies = Math.floor(Math.random() * 2) + 1; // 1 to 2 replies per comment

      let commentRepliesAdded = 0;
      for (let i = 0; i < shuffledBots.length; i++) {
        if (commentRepliesAdded >= numReplies) break;
        const bot = shuffledBots[i];
        
        console.log(`   -> ${bot.displayName} is replying to comment ${comment._id}...`);
        try {
          await createBotReply(bot, post._id, comment._id);
          commentRepliesAdded++;
          repliesAdded++;
          await new Promise(r => setTimeout(r, 2000));
        } catch (err) {
          console.error(`   -> Failed for ${bot.displayName}:`, err.message);
        }
      }
    }
    
    console.log(`✅ Added ${repliesAdded} total nested replies!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Force nested engage failed:', error);
    process.exit(1);
  }
};

forceBotNestedEngage();
