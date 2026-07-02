import AIBot from '../models/AIBot.js';
import { 
  initAllBots, 
  createBotPost, 
  createBotReply,
  generatePost, 
  getAllActiveBots,
  getRandomBot
} from '../services/aiBotService.js';

// Get all bot configs (public)
export const getBotConfig = async (req, res) => {
  try {
    await initAllBots();
    const bots = await getAllActiveBots();
    res.status(200).json({ success: true, bots });
  } catch (error) {
    console.error('[AI Bots] Get config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update a bot config (admin only)
export const updateBotConfig = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { username } = req.params;
    const updates = req.body;
    
    const bot = await AIBot.findOne({ username });
    if (!bot) {
      return res.status(404).json({ success: false, message: 'Bot not found' });
    }

    // Update fields
    Object.keys(updates).forEach(key => {
      if (key === 'configuration') {
        bot.configuration = { ...bot.configuration, ...updates[key] };
      } else if (key !== 'username') {
        bot[key] = updates[key];
      }
    });

    await bot.save();
    res.status(200).json({ success: true, bot });
  } catch (error) {
    console.error('[AI Bots] Update config error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Manual trigger a random bot to post
export const manualCreatePost = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const bot = await getRandomBot();
    if (!bot) {
      return res.status(500).json({ success: false, message: 'No active bots' });
    }

    const post = await createBotPost(bot);
    res.status(200).json({ success: true, post });
  } catch (error) {
    console.error('[AI Bots] Manual post error:', error);
    res.status(500).json({ success: false, message: 'Failed to create post' });
  }
};

// Manual trigger a random bot to reply
export const manualCreateReply = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const { postId } = req.params;
    const bot = await getRandomBot();
    if (!bot) {
      return res.status(500).json({ success: false, message: 'No active bots' });
    }

    const comment = await createBotReply(bot, postId);
    res.status(200).json({ success: true, comment });
  } catch (error) {
    console.error('[AI Bots] Manual reply error:', error);
    res.status(500).json({ success: false, message: 'Failed to create reply' });
  }
};

// Test post generation with random bot
export const testPostGeneration = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const bot = await getRandomBot();
    const postData = await generatePost(bot);
    res.status(200).json({ success: true, postData, bot: bot.username });
  } catch (error) {
    console.error('[AI Bots] Test post error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate test post' });
  }
};
