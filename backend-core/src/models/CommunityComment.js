import mongoose from 'mongoose';

const communityCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 3000
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityComment',
    default: null
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Indexes for efficient querying
communityCommentSchema.index({ post: 1, createdAt: -1 });
communityCommentSchema.index({ parentId: 1 });
communityCommentSchema.index({ author: 1 });

const CommunityComment = mongoose.model('CommunityComment', communityCommentSchema);
export default CommunityComment;
