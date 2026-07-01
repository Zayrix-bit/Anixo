import CommunityPost from '../models/CommunityPost.js';
import CommunityComment from '../models/CommunityComment.js';
import Notification from '../models/Notification.js';

// @desc    Get community posts (paginated, filterable, sortable)
// @route   GET /community/posts
// @access  Public
export const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20, category, sort = 'newest', search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = { isDeleted: { $ne: true } };
    if (category && category !== 'all') filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOption = { isPinned: -1 };
    switch (sort) {
      case 'top':
        // Sort by net likes (likes.length - dislikes.length is hard in mongo, use likes count)
        sortOption = { isPinned: -1, likes: -1, createdAt: -1 };
        break;
      case 'hot':
        // Hot = combination of recent + engagement
        sortOption = { isPinned: -1, commentCount: -1, createdAt: -1 };
        break;
      case 'newest':
      default:
        sortOption = { isPinned: -1, createdAt: -1 };
    }

    const [posts, total] = await Promise.all([
      CommunityPost.find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit))
        .populate('author', 'username displayName profileId avatar role')
        .lean(),
      CommunityPost.countDocuments(filter)
    ]);

    // Add computed fields
    const enrichedPosts = posts.map(post => ({
      ...post,
      likesCount: post.likes?.length || 0,
      dislikesCount: post.dislikes?.length || 0,
      score: (post.likes?.length || 0) - (post.dislikes?.length || 0)
    }));

    res.json({
      success: true,
      posts: enrichedPosts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + posts.length < total
      }
    });
  } catch (error) {
    console.error('[Community] getPosts error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Get single post by ID
// @route   GET /community/posts/:postId
// @access  Public
export const getPostById = async (req, res) => {
  try {
    const post = await CommunityPost.findOneAndUpdate(
      { _id: req.params.postId, isDeleted: { $ne: true } },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'username displayName profileId avatar role').lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({
      success: true,
      post: {
        ...post,
        likesCount: post.likes?.length || 0,
        dislikesCount: post.dislikes?.length || 0,
        score: (post.likes?.length || 0) - (post.dislikes?.length || 0)
      }
    });
  } catch (error) {
    console.error('[Community] getPostById error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Create a new post
// @route   POST /community/posts
// @access  Private
export const createPost = async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }

    const post = await CommunityPost.create({
      title: title.trim(),
      content: content.trim(),
      author: req.user._id,
      category: category || 'general',
      tags: Array.isArray(tags) ? tags.slice(0, 5).map(t => t.trim().toLowerCase()) : []
    });

    const populatedPost = await CommunityPost.findById(post._id)
      .populate('author', 'username displayName profileId avatar role')
      .lean();

    res.status(201).json({
      success: true,
      post: {
        ...populatedPost,
        likesCount: 0,
        dislikesCount: 0,
        score: 0
      }
    });
  } catch (error) {
    console.error('[Community] createPost error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Update a post
// @route   PUT /community/posts/:postId
// @access  Private (author or admin/mod)
export const updatePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdminOrMod = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isAuthor && !isAdminOrMod) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const { title, content, category, tags } = req.body;
    if (title) post.title = title.trim();
    if (content) post.content = content.trim();
    if (category) post.category = category;
    if (tags) post.tags = Array.isArray(tags) ? tags.slice(0, 5).map(t => t.trim().toLowerCase()) : post.tags;

    await post.save();

    const updated = await CommunityPost.findById(post._id)
      .populate('author', 'username displayName profileId avatar role')
      .lean();

    res.json({
      success: true,
      post: {
        ...updated,
        likesCount: updated.likes?.length || 0,
        dislikesCount: updated.dislikes?.length || 0,
        score: (updated.likes?.length || 0) - (updated.dislikes?.length || 0)
      }
    });
  } catch (error) {
    console.error('[Community] updatePost error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a post (soft delete)
// @route   DELETE /community/posts/:postId
// @access  Private (author or admin/mod)
export const deletePost = async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const isAuthor = post.author.toString() === req.user._id.toString();
    const isAdminOrMod = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isAuthor && !isAdminOrMod) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    post.isDeleted = true;
    await post.save();

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('[Community] deletePost error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Like or unlike a post
// @route   POST /community/posts/:postId/like
// @access  Private
export const likePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    const post = await CommunityPost.findOne({ _id: postId, isDeleted: { $ne: true } });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const alreadyLiked = post.likes.some(id => id.toString() === userId.toString());

    let update;
    if (alreadyLiked) {
      update = {
        $pull: { likes: userId }
      };
    } else {
      update = {
        $addToSet: { likes: userId },
        $pull: { dislikes: userId }
      };
    }

    const updatedPost = await CommunityPost.findByIdAndUpdate(
      postId,
      update,
      { new: true }
    );

    res.json({
      success: true,
      likesCount: updatedPost.likes.length,
      dislikesCount: updatedPost.dislikes.length,
      score: updatedPost.likes.length - updatedPost.dislikes.length,
      userLiked: !alreadyLiked,
      userDisliked: false
    });
  } catch (error) {
    console.error('[Community] likePost error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Dislike or un-dislike a post
// @route   POST /community/posts/:postId/dislike
// @access  Private
export const dislikePost = async (req, res) => {
  try {
    const userId = req.user._id;
    const postId = req.params.postId;

    const post = await CommunityPost.findOne({ _id: postId, isDeleted: { $ne: true } });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    const alreadyDisliked = post.dislikes.some(id => id.toString() === userId.toString());

    let update;
    if (alreadyDisliked) {
      update = {
        $pull: { dislikes: userId }
      };
    } else {
      update = {
        $addToSet: { dislikes: userId },
        $pull: { likes: userId }
      };
    }

    const updatedPost = await CommunityPost.findByIdAndUpdate(
      postId,
      update,
      { new: true }
    );

    res.json({
      success: true,
      likesCount: updatedPost.likes.length,
      dislikesCount: updatedPost.dislikes.length,
      score: updatedPost.likes.length - updatedPost.dislikes.length,
      userLiked: false,
      userDisliked: !alreadyDisliked
    });
  } catch (error) {
    console.error('[Community] dislikePost error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Pin/Unpin a post (admin/mod only)
// @route   POST /community/posts/:postId/pin
// @access  Private (admin/mod)
export const togglePinPost = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const post = await CommunityPost.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    res.json({ success: true, isPinned: post.isPinned });
  } catch (error) {
    console.error('[Community] togglePinPost error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Lock/Unlock a post (admin/mod only)
// @route   POST /community/posts/:postId/lock
// @access  Private (admin/mod)
export const toggleLockPost = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const post = await CommunityPost.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    post.isLocked = !post.isLocked;
    await post.save();

    res.json({ success: true, isLocked: post.isLocked });
  } catch (error) {
    console.error('[Community] toggleLockPost error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ==================== COMMENTS ====================

// @desc    Get comments for a post
// @route   GET /community/posts/:postId/comments
// @access  Public
export const getComments = async (req, res) => {
  try {
    const comments = await CommunityComment.find({
      post: req.params.postId,
      isDeleted: { $ne: true }
    })
      .sort({ createdAt: 1 })
      .populate('author', 'username displayName profileId avatar role')
      .lean();

    // Build threaded structure
    const commentMap = {};
    const rootComments = [];

    comments.forEach(c => {
      c.likesCount = c.likes?.length || 0;
      c.replies = [];
      commentMap[c._id.toString()] = c;
    });

    comments.forEach(c => {
      if (c.parentId && commentMap[c.parentId.toString()]) {
        commentMap[c.parentId.toString()].replies.push(c);
      } else {
        rootComments.push(c);
      }
    });

    res.json({ success: true, comments: rootComments, total: comments.length });
  } catch (error) {
    console.error('[Community] getComments error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Add a comment to a post
// @route   POST /community/posts/:postId/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }

    const post = await CommunityPost.findById(req.params.postId);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    if (post.isLocked) {
      return res.status(403).json({ success: false, message: 'This post is locked' });
    }

    // Validate parent comment if provided
    if (parentId) {
      const parentComment = await CommunityComment.findById(parentId);
      if (!parentComment || parentComment.post.toString() !== post._id.toString()) {
        return res.status(400).json({ success: false, message: 'Invalid parent comment' });
      }
    }

    const comment = await CommunityComment.create({
      post: post._id,
      author: req.user._id,
      content: content.trim(),
      parentId: parentId || null
    });

    // Increment comment count on post
    post.commentCount = (post.commentCount || 0) + 1;
    await post.save();

    // Send notification to post author (if commenter is not the author)
    if (post.author.toString() !== req.user._id.toString()) {
      try {
        await Notification.create({
          user: post.author,
          title: `New reply on "${post.title.substring(0, 50)}"`,
          message: `${req.user.displayName || req.user.username} commented on your post`,
          type: 'REPLY',
          targetUrl: `/community/post/${post._id}`
        });
      } catch (notifErr) {
        console.warn('[Community] Notification creation failed:', notifErr.message);
      }
    }

    const populated = await CommunityComment.findById(comment._id)
      .populate('author', 'username displayName profileId avatar role')
      .lean();

    res.status(201).json({
      success: true,
      comment: {
        ...populated,
        likesCount: 0,
        replies: []
      }
    });
  } catch (error) {
    console.error('[Community] addComment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Like/unlike a comment
// @route   POST /community/comments/:commentId/like
// @access  Private
export const likeComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user._id;

    const comment = await CommunityComment.findOne({ _id: commentId, isDeleted: { $ne: true } });
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const alreadyLiked = comment.likes.some(id => id.toString() === userId.toString());

    const update = alreadyLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedComment = await CommunityComment.findByIdAndUpdate(
      commentId,
      update,
      { new: true }
    );

    res.json({
      success: true,
      likesCount: updatedComment.likes.length,
      userLiked: !alreadyLiked
    });
  } catch (error) {
    console.error('[Community] likeComment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// @desc    Delete a comment (soft delete)
// @route   DELETE /community/comments/:commentId
// @access  Private (author or admin/mod)
export const deleteComment = async (req, res) => {
  try {
    const comment = await CommunityComment.findById(req.params.commentId);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const isAuthor = comment.author.toString() === req.user._id.toString();
    const isAdminOrMod = req.user.role === 'admin' || req.user.role === 'moderator';

    if (!isAuthor && !isAdminOrMod) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    comment.isDeleted = true;
    await comment.save();

    // Decrement comment count on post
    await CommunityPost.findByIdAndUpdate(comment.post, { $inc: { commentCount: -1 } });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('[Community] deleteComment error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
