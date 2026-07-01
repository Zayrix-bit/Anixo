import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
  togglePinPost,
  toggleLockPost,
  getComments,
  addComment,
  likeComment,
  deleteComment
} from '../controllers/communityController.js';

const router = express.Router();

// Post routes
router.get('/posts', getPosts);
router.get('/posts/:postId', getPostById);
router.post('/posts', protect, createPost);
router.put('/posts/:postId', protect, updatePost);
router.delete('/posts/:postId', protect, deletePost);
router.post('/posts/:postId/like', protect, likePost);
router.post('/posts/:postId/dislike', protect, dislikePost);
router.post('/posts/:postId/pin', protect, togglePinPost);
router.post('/posts/:postId/lock', protect, toggleLockPost);

// Comment routes
router.get('/posts/:postId/comments', getComments);
router.post('/posts/:postId/comments', protect, addComment);
router.post('/comments/:commentId/like', protect, likeComment);
router.delete('/comments/:commentId', protect, deleteComment);

export default router;
