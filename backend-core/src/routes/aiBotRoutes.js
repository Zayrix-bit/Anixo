import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getBotConfig,
  updateBotConfig,
  manualCreatePost,
  manualCreateReply,
  testPostGeneration
} from '../controllers/aiBotController.js';

const router = express.Router();

// Get all bot configs (public)
router.get('/config', getBotConfig);

// Test post generation with random bot (admin only)
router.get('/test-post', protect, testPostGeneration);

// Manual trigger a random bot to post (admin only)
router.post('/manual-post', protect, manualCreatePost);

// Manual trigger a random bot to reply (admin only)
router.post('/manual-reply/:postId', protect, manualCreateReply);

// Update a specific bot config (admin only)
router.put('/config/:username', protect, updateBotConfig);

export default router;
