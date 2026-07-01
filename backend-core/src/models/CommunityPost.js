import mongoose from 'mongoose';

const communityPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    maxlength: 10000
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    enum: ['general', 'anime', 'feedback', 'question', 'news', 'poll'],
    default: 'general'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  commentCount: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for efficient querying
communityPostSchema.index({ createdAt: -1 });
communityPostSchema.index({ category: 1, createdAt: -1 });
communityPostSchema.index({ author: 1 });
communityPostSchema.index({ isPinned: -1, createdAt: -1 });

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);
export default CommunityPost;
