import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../hooks/useAuth";
import ReactMarkdown from "react-markdown";
import {
  getCommunityPost, likeCommunityPost, dislikeCommunityPost,
  deleteCommunityPost, pinCommunityPost, lockCommunityPost,
  getPostComments, addPostComment, likePostComment, deletePostComment,
  updateCommunityPost
} from "../services/communityService";
import {
  ThumbsUp, ThumbsDown, MessageSquare, Eye, Clock, ArrowLeft, Pin, Lock,
  Crown, Shield, Trash2, Edit3, MoreHorizontal, Send, Reply, Heart,
  ChevronDown, ChevronUp, Loader, AlertTriangle, Users, Tag, X
} from "lucide-react";

const CATEGORY_COLORS = {
  general: "bg-[#5865F2]/10 text-[#9fb1f0] border-[#9fb1f0]/30",
  anime: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  feedback: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  question: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  news: "bg-discord-500/10 text-discord-400 border-discord-500/30",
  poll: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
};

const timeAgo = (date) => {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
  return `${Math.floor(seconds / 2592000)}mo ago`;
};

const getAvatarUrl = (avatar, username) => {
  if (!avatar) return `https://ui-avatars.com/api/?name=${encodeURIComponent(username || 'User')}&background=random&color=fff&size=80`;
  return avatar.replace(/[`"]/g, '').trim();
};

const RoleBadge = ({ role }) => {
  if (role === 'admin') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-purple-500/20 shadow-sm select-none">
      <Crown size={9} fill="currentColor" className="shrink-0" /> Admin
    </span>
  );
  if (role === 'moderator') return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-discord-500/10 text-discord-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-discord-500/20 shadow-sm select-none">
      <Shield size={9} fill="currentColor" className="shrink-0" /> Mod
    </span>
  );
  return null;
};

// ==================== COMMENT COMPONENT ====================
function CommentItem({ comment, user, postId, onCommentAdded, onCommentDeleted, depth = 0 }) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const currentUserId = (user._id || user.id)?.toString();
  const [liked, setLiked] = useState(() => {
    if (user && comment.likes) {
      return comment.likes.some(id => id.toString() === currentUserId);
    }
    return false;
  });
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [showReplies, setShowReplies] = useState(false);
  const [visibleRepliesCount, setVisibleRepliesCount] = useState(3);

  const [prevComment, setPrevComment] = useState(comment);
  const [prevUser, setPrevUser] = useState(user);

  if (comment !== prevComment || user !== prevUser) {
    setPrevComment(comment);
    setPrevUser(user);
    setLiked(user && comment.likes ? comment.likes.some(id => id.toString() === currentUserId) : false);
    setLikesCount(comment.likesCount || 0);
  }

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!user) return;
    const wasLiked = liked;
    const prevCount = likesCount;

    setLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);

    const res = await likePostComment(comment._id);
    if (!res.success) {
      setLiked(wasLiked);
      setLikesCount(prevCount);
    } else {
      setLiked(res.userLiked);
      setLikesCount(res.likesCount);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const res = await addPostComment(postId, { content: replyContent, parentId: comment._id });
    setIsSubmitting(false);
    if (res.success) {
      onCommentAdded(res.comment, comment._id);
      setReplyContent("");
      setShowReplyBox(false);
      setShowReplies(true);
      setVisibleRepliesCount(prev => Math.max(prev + 1, (comment.replies?.length || 0) + 1));
    }
  };

  const handleDelete = async () => {
    const res = await deletePostComment(comment._id);
    if (res.success) {
      onCommentDeleted(comment._id);
    }
  };

  const isAuthor = user && comment.author?._id?.toString() === (user._id || user.id)?.toString();
  const isAdminOrMod = user && (user.role === 'admin' || user.role === 'moderator');
  const canDelete = isAuthor || isAdminOrMod;
  const maxDepth = 4;

  return (
    <div className={`${depth > 0 ? 'ml-5 sm:ml-8 md:ml-11 pl-3 md:pl-4 border-l border-white/[0.07]' : ''}`}>
      <div className="py-3 group/comment">
        <div className="flex items-start gap-2.5 md:gap-3">
          {/* Avatar */}
          <Link to={`/user/${comment.author?.profileId || comment.author?.username}`} className="shrink-0 mt-0.5">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-white/10 hover:ring-white/20 transition-all">
              <img
                src={getAvatarUrl(comment.author?.avatar, comment.author?.username)}
                alt={comment.author?.username}
                className="w-full h-full object-cover"
              />
            </div>
          </Link>

          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Link
                to={`/user/${comment.author?.profileId || comment.author?.username}`}
                className="text-[13px] font-semibold text-white/90 hover:text-white transition-colors leading-none"
              >
                {comment.author?.displayName || comment.author?.profileId || comment.author?.username}
              </Link>
              <RoleBadge role={comment.author?.role} />
              <span className="text-[11px] text-white/30">{timeAgo(comment.createdAt)}</span>
            </div>

            {/* Body */}
            <p className="text-[13px] text-white/70 leading-relaxed whitespace-pre-wrap break-words mb-2">
              {comment.content}
            </p>

            {/* Actions â€” plain text links */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  liked ? 'text-discord-400' : 'text-white/35 hover:text-white/65'
                }`}
              >
                <Heart size={11} fill={liked ? "currentColor" : "none"} />
                <span>{likesCount > 0 ? likesCount : 'Like'}</span>
              </button>

              {user && depth < maxDepth && (
                <button
                  onClick={() => setShowReplyBox(!showReplyBox)}
                  className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                    showReplyBox ? 'text-white/75' : 'text-white/35 hover:text-white/65'
                  }`}
                >
                  <Reply size={11} />
                  <span>Reply</span>
                </button>
              )}

              {canDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-1 text-[11px] font-medium text-white/20 hover:text-discord-400 transition-colors cursor-pointer"
                  title="Delete"
                >
                  <Trash2 size={10} />
                </button>
              )}
            </div>

            {/* Reply input */}
            {showReplyBox && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  placeholder="Write a reply..."
                  className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-md px-3 py-1.5 md:py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#9fb1f0]/40 transition-all"
                  autoFocus
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#5865F2] hover:bg-[#5b73c7] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white text-[11px] font-bold transition-all cursor-pointer"
                >
                  {isSubmitting ? <Loader size={11} className="animate-spin" /> : <Send size={11} />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <>
          {!showReplies ? (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#5865F2]/80 hover:text-[#5865F2] ml-9 sm:ml-12 md:ml-16 mb-2 transition-colors cursor-pointer"
            >
              <ChevronDown size={12} />
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          ) : (
            <button
              onClick={() => {
                setShowReplies(false);
                setVisibleRepliesCount(3);
              }}
              className="flex items-center gap-1.5 text-[11px] font-bold text-white/20 hover:text-white/40 ml-9 sm:ml-12 md:ml-16 mb-2 transition-colors cursor-pointer"
            >
              <ChevronUp size={12} />
              Hide replies
            </button>
          )}

          {showReplies && (
            <>
              {comment.replies.slice(0, visibleRepliesCount).map(reply => (
                <CommentItem
                  key={reply._id}
                  comment={reply}
                  user={user}
                  postId={postId}
                  onCommentAdded={onCommentAdded}
                  onCommentDeleted={onCommentDeleted}
                  depth={depth + 1}
                />
              ))}
              {comment.replies.length > visibleRepliesCount && (
                <button
                  onClick={() => setVisibleRepliesCount(prev => prev + 5)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-[#5865F2] hover:text-[#5b73c7] ml-9 sm:ml-12 md:ml-16 mt-1 mb-2 transition-colors cursor-pointer"
                >
                  <ChevronDown size={12} />
                  View More Replies ({comment.replies.length - visibleRepliesCount} remaining)
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ==================== EDIT POST MODAL ====================
const EDIT_CATEGORIES = [
  { id: "general", label: "General" },
  { id: "anime", label: "Anime" },
  { id: "feedback", label: "Feedback" },
  { id: "question", label: "Questions" },
  { id: "news", label: "News" },
  { id: "poll", label: "Polls" },
];

const RECOMMENDED_TAGS = ["discussion", "recommendation", "news", "review", "help", "meme", "theory", "question"];

function EditPostModal({ isOpen, onClose, onUpdated, post }) {
  const [title, setTitle] = useState(() => post?.title || "");
  const [content, setContent] = useState(() => post?.content || "");
  const [category, setCategory] = useState(() => post?.category || "general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState(() => post?.tags || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showPopularTags, setShowPopularTags] = useState(false);

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase().replace(/[^a-zA-Z0-9-]/g, "");
    if (tag && tags.length < 5 && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setError("");
    setIsSubmitting(true);
    const res = await updateCommunityPost(post._id, { title, content, category, tags });
    setIsSubmitting(false);
    if (res.success) {
      onUpdated(res.post);
      onClose();
    } else {
      setError(res.message || "Failed to update post");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-[#111111] border border-white/10 rounded-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Edit3 size={18} className="text-[#5865F2]" />
            Edit Post
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-4 max-h-[80vh] md:max-h-[70vh] overflow-y-auto mini-scrollbar text-left">
          {error && (
            <div className="px-4 py-2.5 bg-discord-500/10 border border-discord-500/20 rounded-lg text-discord-400 text-sm">
              {error}
            </div>
          )}

          {/* Title */}
          <div>
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's on your mind?"
              maxLength={200}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 md:px-4 py-2.5 md:py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#5865F2]/50 focus:ring-1 focus:ring-[#5865F2]/20 transition-all text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {EDIT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border cursor-pointer ${category === cat.id
                      ? "bg-[#5865F2] text-white border-[#5865F2]"
                      : "bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:border-white/20"
                    }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share your thoughts, discuss anime, ask questions..."
              maxLength={10000}
              rows={6}
              className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 md:px-4 py-2.5 md:py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#5865F2]/50 focus:ring-1 focus:ring-[#5865F2]/20 transition-all text-sm resize-none mini-scrollbar"
            />
            <p className="text-[10px] text-white/20 mt-1">Supports **bold**, *italic*, and markdown formatting</p>
          </div>

          {/* Tags */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider block">Tags (optional)</label>
              <span className="text-[10px] text-white/30">{tags.length}/5 tags</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag..."
                maxLength={30}
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-md px-3 md:px-4 py-2 md:py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#5865F2]/50 transition-all text-sm"
              />
              <button
                onClick={() => setShowPopularTags(prev => !prev)}
                className={`px-3 py-2 border rounded-md transition-all cursor-pointer ${showPopularTags
                    ? "bg-[#5865F2]/10 border-[#5865F2]/30 text-[#5865F2] hover:text-[#5865F2]"
                    : "bg-white/[0.05] border-white/10 text-white/50 hover:text-white"
                  }`}
              >
                <Tag size={14} />
              </button>
            </div>

            {/* Recommended Tags */}
            {showPopularTags && (
              <div className="mt-3 animate-in slide-in-from-top-2 fade-in duration-200">
                <span className="text-[10px] font-semibold text-white/35 uppercase tracking-wider block mb-1.5">Popular Tags:</span>
                <div className="flex flex-wrap gap-1.5">
                  {RECOMMENDED_TAGS.map(recTag => {
                    const isSelected = tags.includes(recTag);
                    return (
                      <button
                        key={recTag}
                        disabled={isSelected || tags.length >= 5}
                        onClick={() => setTags([...tags, recTag])}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer ${isSelected
                            ? "bg-[#5865F2]/10 border-[#5865F2]/20 text-[#5865F2]/50 cursor-not-allowed"
                            : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/12"
                          }`}
                      >
                        #{recTag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/[0.04]">
                {tags.map(tag => (
                  <span key={tag} className="px-2.5 py-1 bg-[#5865F2]/10 border border-[#5865F2]/25 text-[#5865F2] text-[11px] font-bold rounded-md flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                    #{tag}
                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-[#5865F2]/50 hover:text-[#5865F2] transition-colors cursor-pointer">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 md:px-6 py-4 border-t border-white/10 bg-white/[0.02] gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-white/10 hover:bg-white/[0.05] text-white text-xs font-bold uppercase tracking-widest rounded-md transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-5 py-2 bg-[#5865F2] hover:bg-[#5b73c7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSubmitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN POST DETAIL PAGE ====================
export default function CommunityPostDetail() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [score, setScore] = useState(0);
  const [showActions, setShowActions] = useState(false);
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [visibleCommentsCount, setVisibleCommentsCount] = useState(5);
  const [showEditModal, setShowEditModal] = useState(false);
  const actionsRef = useRef(null);

  // Close actions dropdown when clicking outside
  useEffect(() => {
    if (!showActions) return;
    const handleClickOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActions]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const [postRes, commentsRes] = await Promise.all([
        getCommunityPost(postId),
        getPostComments(postId)
      ]);

      if (postRes.success) {
        setPost(postRes.post);
        setScore(postRes.post.score || 0);
        if (user) {
          const currentUserId = (user._id || user.id)?.toString();
          setUserLiked(postRes.post.likes?.some(id => id.toString() === currentUserId) || false);
          setUserDisliked(postRes.post.dislikes?.some(id => id.toString() === currentUserId) || false);
        }
      }
      if (commentsRes.success) {
        setComments(commentsRes.comments);
      }
      setIsLoading(false);
    };

    fetchData();
  }, [postId, user]);

  const handleLike = async () => {
    if (!user) return;
    const wasLiked = userLiked;
    const wasDisliked = userDisliked;
    const prevScore = score;

    let newScore = score;
    if (wasLiked) {
      newScore -= 1;
      setUserLiked(false);
    } else {
      newScore += 1;
      setUserLiked(true);
      if (wasDisliked) {
        newScore += 1;
        setUserDisliked(false);
      }
    }
    setScore(newScore);

    const res = await likeCommunityPost(postId);
    if (!res.success) {
      setUserLiked(wasLiked);
      setUserDisliked(wasDisliked);
      setScore(prevScore);
    } else {
      setUserLiked(res.userLiked);
      setUserDisliked(res.userDisliked);
      setScore(res.score);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    const wasLiked = userLiked;
    const wasDisliked = userDisliked;
    const prevScore = score;

    let newScore = score;
    if (wasDisliked) {
      newScore += 1;
      setUserDisliked(false);
    } else {
      newScore -= 1;
      setUserDisliked(true);
      if (wasLiked) {
        newScore -= 1;
        setUserLiked(false);
      }
    }
    setScore(newScore);

    const res = await dislikeCommunityPost(postId);
    if (!res.success) {
      setUserLiked(wasLiked);
      setUserDisliked(wasDisliked);
      setScore(prevScore);
    } else {
      setUserLiked(res.userLiked);
      setUserDisliked(res.userDisliked);
      setScore(res.score);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    const res = await deleteCommunityPost(postId);
    if (res.success) {
      navigate("/community");
    }
  };

  const handlePin = async () => {
    const res = await pinCommunityPost(postId);
    if (res.success) {
      setPost(prev => ({ ...prev, isPinned: res.isPinned }));
    }
  };

  const handleLock = async () => {
    const res = await lockCommunityPost(postId);
    if (res.success) {
      setPost(prev => ({ ...prev, isLocked: res.isLocked }));
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || isSubmittingComment) return;
    setIsSubmittingComment(true);
    const res = await addPostComment(postId, { content: commentText });
    setIsSubmittingComment(false);
    if (res.success) {
      setComments(prev => [...prev, res.comment]);
      setCommentText("");
      setPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
      setVisibleCommentsCount(prev => Math.max(prev + 1, comments.length + 1));
    }
  };

  const handleCommentAdded = (newComment, parentId) => {
    if (parentId) {
      // Add reply to the correct parent in the tree
      const addReplyToTree = (commentsList) => {
        return commentsList.map(c => {
          if (c._id === parentId) {
            return { ...c, replies: [...(c.replies || []), newComment] };
          }
          if (c.replies?.length > 0) {
            return { ...c, replies: addReplyToTree(c.replies) };
          }
          return c;
        });
      };
      setComments(addReplyToTree(comments));
    } else {
      setComments(prev => [...prev, newComment]);
      setVisibleCommentsCount(prev => Math.max(prev + 1, comments.length + 1));
    }
    setPost(prev => ({ ...prev, commentCount: (prev.commentCount || 0) + 1 }));
  };

  const handleCommentDeleted = (commentId) => {
    const removeFromTree = (commentsList) => {
      return commentsList.filter(c => c._id !== commentId).map(c => ({
        ...c,
        replies: c.replies ? removeFromTree(c.replies) : []
      }));
    };
    setComments(removeFromTree(comments));
    setPost(prev => ({ ...prev, commentCount: Math.max(0, (prev.commentCount || 0) - 1) }));
  };

  const isAuthor = user && post?.author?._id?.toString() === (user._id || user.id)?.toString();
  const isAdminOrMod = user && (user.role === 'admin' || user.role === 'moderator');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={32} className="text-[#9fb1f0] animate-spin" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#080808] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <MessageSquare size={48} className="text-white/10 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Post Not Found</h2>
          <p className="text-white/40 text-sm mb-6">This post may have been deleted.</p>
          <Link to="/community" className="px-5 py-2 bg-[#5865F2] text-white rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-[#5b73c7] transition-colors">
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#080808] flex flex-col font-sans selection:bg-[#5865F2]/30">
      <Navbar />

      <div className="w-full pt-[64px] md:pt-[80px] px-3 md:px-8 pb-16 md:pb-12 max-w-[900px] mx-auto flex-1">
        {/* Back Button */}
        <Link
          to="/community"
          className="inline-flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-white/30 hover:text-white mb-4 md:mb-6 transition-colors group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          Back
        </Link>

        {/* Post Card */}
        <article className="bg-[#121212] border border-white/[0.08] rounded-md overflow-hidden">
          {/* Post Header */}
          <div className="p-4 md:p-7">
            {/* Category + Meta */}
            <div className="flex items-center gap-2 flex-wrap mb-4 md:mb-5">
              <span className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general} select-none`}>
                {post.category}
              </span>
              {post.isPinned && (
                <span className="flex items-center gap-1 text-[10px] text-amber-400/70 select-none">
                  <Pin size={10} />
                </span>
              )}
              {post.isLocked && (
                <span className="flex items-center gap-1 text-[10px] text-discord-400/60 select-none">
                  <Lock size={10} />
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-base md:text-xl font-semibold text-white leading-snug mb-3 md:mb-4">
              {post.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center gap-3 md:gap-3.5 mb-5 md:mb-6 pb-4 md:pb-5 border-b border-white/[0.08]">
              <Link to={`/user/${post.author?.profileId || post.author?.username}`}>
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-white/15 bg-neutral-900 hover:border-white/30 transition-all shadow-sm">
                  <img
                    src={getAvatarUrl(post.author?.avatar, post.author?.username)}
                    alt={post.author?.username}
                    className="w-full h-full object-cover"
                  />
                </div>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/user/${post.author?.profileId || post.author?.username}`}
                    className="text-sm font-bold text-white hover:text-[#9fb1f0] transition-colors"
                  >
                    {post.author?.displayName || post.author?.profileId || post.author?.username}
                  </Link>
                  <RoleBadge role={post.author?.role} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/45 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={10} /> {timeAgo(post.createdAt)}
                    {post.updatedAt && post.createdAt && new Date(post.updatedAt) - new Date(post.createdAt) > 1000 && (
                      <span className="text-white/25" title={`Edited ${timeAgo(post.updatedAt)}`}>(edited)</span>
                    )}
                  </span>
                  <span className="text-white/20">/</span>
                  <span className="flex items-center gap-1"><Eye size={10} /> {post.views} views</span>
                </div>
              </div>

              {/* Action Menu */}
              {(isAuthor || isAdminOrMod) && (
                <div className="ml-auto relative" ref={actionsRef}>
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 hover:bg-white/[0.05] rounded-lg text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showActions && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-[#181818] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {(isAuthor || isAdminOrMod) && (
                        <button
                          onClick={() => { setShowEditModal(true); setShowActions(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                        >
                          <Edit3 size={14} /> Edit Post
                        </button>
                      )}
                      {isAdminOrMod && (
                        <>
                          <button
                            onClick={() => { handlePin(); setShowActions(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                          >
                            <Pin size={14} /> {post.isPinned ? 'Unpin' : 'Pin'} Post
                          </button>
                          <button
                            onClick={() => { handleLock(); setShowActions(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                          >
                            <Lock size={14} /> {post.isLocked ? 'Unlock' : 'Lock'} Post
                          </button>
                        </>
                      )}
                      {(isAuthor || isAdminOrMod) && (
                        <button
                          onClick={() => { handleDelete(); setShowActions(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-discord-400 hover:text-discord-300 hover:bg-discord-500/[0.05] transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} /> Delete Post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Post Content */}
            <div className="prose prose-invert prose-sm sm:prose-base text-white/80 max-w-none
              prose-p:leading-relaxed prose-p:mb-3 md:prose-p:mb-4 prose-p:text-[13px] md:prose-p:text-base
              prose-headings:text-white prose-headings:font-extrabold prose-headings:tracking-tight
              prose-a:text-[#9fb1f0] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white font-normal
              prose-code:text-[#b8c5f7] prose-code:bg-white/[0.05] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[12px] md:prose-code:text-sm
              prose-blockquote:border-[#9fb1f0]/30 prose-blockquote:text-white/60
              prose-li:text-white/70
            ">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="flex items-center gap-1.5 md:gap-2 flex-wrap mt-5 md:mt-6 pt-3 md:pt-4 border-t border-white/[0.04]">
                {post.tags.map(tag => (
                  <Link
                    key={tag}
                    to={`/community?search=${tag}`}
                    className="px-2.5 py-1 bg-white/[0.03] text-white/45 text-[11px] font-medium rounded-md border border-white/[0.04] hover:text-white/75 hover:border-white/15 transition-all"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Vote Bar */}
          <div className="flex items-center justify-between px-4 md:px-7 py-2.5 md:py-3 border-t border-white/[0.08] bg-white/[0.01]">
            <div className="flex items-center bg-white/[0.02] border border-white/[0.08] rounded-md p-0.5">
              <button
                onClick={handleLike}
                className={`flex items-center justify-center w-7 h-7 rounded transition-all cursor-pointer ${
                  userLiked
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
                title="Like"
              >
                <ThumbsUp size={12} fill={userLiked ? "currentColor" : "none"} />
              </button>

              <span className={`text-[11px] font-bold px-2.5 select-none min-w-[28px] text-center ${
                score > 0 ? 'text-emerald-400' : score < 0 ? 'text-discord-400' : 'text-white/45'
              }`}>
                {score > 0 ? `+${score}` : score}
              </span>

              <button
                onClick={handleDislike}
                className={`flex items-center justify-center w-7 h-7 rounded transition-all cursor-pointer ${
                  userDisliked
                    ? "bg-discord-500/10 text-discord-400"
                    : "text-white/40 hover:text-white/70 hover:bg-white/[0.03]"
                }`}
                title="Dislike"
              >
                <ThumbsDown size={12} fill={userDisliked ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-white/40">
              <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.commentCount || 0}</span>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-6 md:mt-8">
          <div id="comments-section-header" className="flex items-center gap-2 mb-4 md:mb-6">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
              Comments
            </h2>
            <span className="text-white/20 text-xs font-bold">({post.commentCount || 0})</span>
          </div>

          {/* Add Comment Box */}
          {user && !post.isLocked ? (
            <div className="flex items-start gap-2.5 mb-6 p-3 bg-white/[0.02] border border-white/[0.08] rounded-md transition-all duration-200">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-white/10 shrink-0 mt-0.5 animate-fade-in">
                <img src={getAvatarUrl(user.avatar, user.username)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onFocus={() => setIsCommentExpanded(true)}
                  placeholder="Share your thoughts..."
                  rows={isCommentExpanded ? 3 : 1}
                  className="w-full bg-transparent border-none text-sm text-white placeholder-white/25 focus:outline-none resize-none transition-all duration-250 py-0.5"
                />
                {isCommentExpanded && (
                  <div className="flex justify-end gap-2 pt-2 mt-1.5 border-t border-white/[0.04] animate-in fade-in slide-in-from-top-1 duration-200">
                    <button
                      onClick={() => {
                        setIsCommentExpanded(false);
                        setCommentText("");
                      }}
                      type="button"
                      className="px-3 py-1.5 rounded-md text-white/35 hover:text-white/60 text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        await handleAddComment();
                        setIsCommentExpanded(false);
                      }}
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2] hover:bg-[#5b73c7] disabled:opacity-30 disabled:cursor-not-allowed rounded-md text-white text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer"
                    >
                      {isSubmittingComment ? <Loader size={10} className="animate-spin" /> : <Send size={10} />}
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : post.isLocked ? (
            <div className="flex items-center gap-2 p-4 bg-white/[0.02] border border-white/[0.08] rounded-md mb-6 text-white/25 text-sm">
              <Lock size={14} /> This post is locked. No new comments can be added.
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 p-4 bg-white/[0.02] border border-white/[0.08] rounded-md mb-6">
              <Link to="/home?login=true" className="text-sm text-[#9fb1f0] hover:text-[#b8c5f7] transition-colors font-medium">
                Sign in to comment
              </Link>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="flex flex-col gap-0">
              {comments.slice(0, visibleCommentsCount).map((comment, i) => (
                <div key={comment._id} className={i > 0 ? 'border-t border-white/[0.04]' : ''}>
                  <CommentItem
                    comment={comment}
                    user={user}
                    postId={postId}
                    onCommentAdded={handleCommentAdded}
                    onCommentDeleted={handleCommentDeleted}
                  />
                </div>
              ))}

              {(comments.length > visibleCommentsCount || visibleCommentsCount > 5) && (
                <div className="flex items-center justify-center gap-3 mt-6">
                  {comments.length > visibleCommentsCount && (
                    <button
                      onClick={() => setVisibleCommentsCount(prev => prev + 5)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/10 rounded-md text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronDown size={14} />
                      View More Comments ({comments.length - visibleCommentsCount} remaining)
                    </button>
                  )}
                  {visibleCommentsCount > 5 && (
                    <button
                      onClick={() => {
                        setVisibleCommentsCount(5);
                        const commentsHeaderEl = document.getElementById('comments-section-header');
                        if (commentsHeaderEl) {
                          commentsHeaderEl.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.06] hover:border-white/10 rounded-md text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronUp size={14} />
                      Show Less
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MessageSquare size={36} className="text-white/[0.05] mb-3" />
              <p className="text-sm text-white/15">No comments yet. Be the first to share your thoughts!</p>
            </div>
          )}
        </div>
      </div>

      <Footer />

      {showEditModal && (
        <EditPostModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updatedPost) => setPost(updatedPost)}
          post={post}
          key={post?._id}
        />
      )}
    </div>
  );
}




