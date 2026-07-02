import mongoose from 'mongoose';

const aiBotSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  persona: {
    type: String,
    enum: ['friendly', 'tsundere', 'hype'],
    default: 'friendly'
  },
  avatar: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
  },
  favoriteCategories: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  postFrequency: {
    type: Number, // in hours
    default: 12 // Each bot posts every 12 hours, so staggered
  },
  lastPostAt: {
    type: Date,
    default: null
  },
  lastReplyAt: {
    type: Date,
    default: null
  },
  replyChance: {
    type: Number, // 0-1
    default: 0.3
  },
  maxRepliesPerHour: {
    type: Number,
    default: 2
  },
  stats: {
    totalPosts: {
      type: Number,
      default: 0
    },
    totalReplies: {
      type: Number,
      default: 0
    },
    totalLikesReceived: {
      type: Number,
      default: 0
    }
  },
  configuration: {
    enablePosting: {
      type: Boolean,
      default: true
    },
    enableReplying: {
      type: Boolean,
      default: true
    },
    autoLikePosts: {
      type: Boolean,
      default: true
    }
  }
}, { timestamps: true });

const AIBot = mongoose.model('AIBot', aiBotSchema);
export default AIBot;
