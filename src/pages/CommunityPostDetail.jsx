import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../hooks/useAuth";
import ReactMarkdown from "react-markdown";
import {
  getCommunityPost, likeCommunityPost, dislikeCommunityPost,
  deleteCommunityPost, pinCommunityPost, lockCommunityPost,
  getPostComments, addPostComment, likePostComment, deletePostComment
} from "../services/communityService";
import {
  ThumbsUp, ThumbsDown, MessageSquare, Eye, Clock, ArrowLeft, Pin, Lock,
  Crown, Shield, Trash2, Edit3, MoreHorizontal, Send, Reply, Heart,
  ChevronDown, ChevronUp, Loader, AlertTriangle, Users
} from "lucide-react";

const CATEGORY_COLORS = {
  general: "bg-[#5865F2]/10 text-[#7289DA] border-[#5865F2]/30",
  anime: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  feedback: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  question: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  news: "bg-red-500/10 text-red-400 border-red-500/30",
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-wider rounded-md border border-red-500/20 shadow-sm select-none">
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
  const [showReplies, setShowReplies] = useState(depth < 2);

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
    const res = await likePostComment(comment._id);
    if (res.success) {
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
    <div className={`${depth > 0 ? 'ml-8 sm:ml-11 pl-4 border-l border-white/[0.07]' : ''}`}>
      <div className="py-3 group/comment">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Link to={`/user/${comment.author?.profileId || comment.author?.username}`} className="shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-white/10 hover:ring-white/20 transition-all">
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

            {/* Actions — plain text links */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1 text-[11px] font-medium transition-colors cursor-pointer ${
                  liked ? 'text-red-400' : 'text-white/35 hover:text-white/65'
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
                  className="flex items-center gap-1 text-[11px] font-medium text-white/20 hover:text-red-400 transition-colors cursor-pointer"
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
                  className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#5865F2]/40 transition-all"
                  autoFocus
                />
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white text-[11px] font-bold transition-all cursor-pointer"
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
          {!showReplies && (
            <button
              onClick={() => setShowReplies(true)}
              className="flex items-center gap-1.5 text-[11px] font-bold text-[#7289DA]/60 hover:text-[#7289DA] ml-10 mb-2 transition-colors"
            >
              <ChevronDown size={12} />
              Show {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {showReplies && (
            <>
              {comment.replies.length > 2 && (
                <button
                  onClick={() => setShowReplies(false)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-white/20 hover:text-white/40 ml-10 mb-1 transition-colors"
                >
                  <ChevronUp size={12} />
                  Hide replies
                </button>
              )}
              {comment.replies.map(reply => (
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
            </>
          )}
        </>
      )}
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
    const res = await likeCommunityPost(postId);
    if (res.success) {
      setUserLiked(res.userLiked);
      setUserDisliked(res.userDisliked);
      setScore(res.score);
    }
  };

  const handleDislike = async () => {
    if (!user) return;
    const res = await dislikeCommunityPost(postId);
    if (res.success) {
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
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader size={32} className="text-[#5865F2] animate-spin" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <MessageSquare size={48} className="text-white/10 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Post Not Found</h2>
          <p className="text-white/40 text-sm mb-6">This post may have been deleted.</p>
          <Link to="/community" className="px-5 py-2 bg-[#5865F2] text-white rounded-lg font-bold uppercase tracking-widest text-[10px] hover:bg-[#4752C4] transition-colors">
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white bg-[#0a0a0a] flex flex-col font-sans selection:bg-[#5865F2]/30">
      <Navbar />

      <div className="w-full pt-[72px] md:pt-[80px] px-4 md:px-8 pb-12 max-w-[900px] mx-auto flex-1">
        {/* Back Button */}
        <Link
          to="/community"
          className="inline-flex items-center gap-2 text-sm text-white/30 hover:text-white mb-6 transition-colors group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" />
          Back to Community
        </Link>

        {/* Post Card */}
        <article className="bg-[#141414] border border-white/[0.08] rounded-xl overflow-hidden">
          {/* Post Header */}
          <div className="p-5 md:p-7">
            {/* Category + Meta */}
            <div className="flex items-center gap-2 flex-wrap mb-5">
              <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general} select-none`}>
                {post.category}
              </span>
              {post.isPinned && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-amber-500/20 shadow-sm select-none animate-pulse">
                  <Pin size={10} /> Pinned
                </span>
              )}
              {post.isLocked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-md border border-red-500/20 shadow-sm select-none">
                  <Lock size={10} /> Locked
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-lg md:text-xl font-semibold text-white leading-snug mb-4">
              {post.title}
            </h1>

            {/* Author Info */}
            <div className="flex items-center gap-3.5 mb-6 pb-5 border-b border-white/[0.06]">
              <Link to={`/user/${post.author?.profileId || post.author?.username}`}>
                <div className="w-10 h-10 rounded-full overflow-hidden border border-white/15 bg-neutral-900 hover:border-white/30 transition-all shadow-sm">
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
                    className="text-sm font-bold text-white hover:text-[#7289DA] transition-colors"
                  >
                    {post.author?.displayName || post.author?.profileId || post.author?.username}
                  </Link>
                  <RoleBadge role={post.author?.role} />
                </div>
                <div className="flex items-center gap-2 text-[11px] text-white/45 mt-1">
                  <span className="flex items-center gap-1"><Clock size={10} /> {timeAgo(post.createdAt)}</span>
                  <span className="text-white/20">/</span>
                  <span className="flex items-center gap-1"><Eye size={10} /> {post.views} views</span>
                </div>
              </div>

              {/* Action Menu */}
              {(isAuthor || isAdminOrMod) && (
                <div className="ml-auto relative">
                  <button
                    onClick={() => setShowActions(!showActions)}
                    className="p-2 hover:bg-white/[0.05] rounded-lg text-white/50 hover:text-white transition-colors"
                  >
                    <MoreHorizontal size={18} />
                  </button>
                  {showActions && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-[#181818] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      {isAuthor && (
                        <Link
                          to={`/community/post/${post._id}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/[0.05] transition-colors"
                          onClick={() => setShowActions(false)}
                        >
                          <Edit3 size={14} /> Edit Post
                        </Link>
                      )}
                      {isAdminOrMod && (
                        <>
                          <button
                            onClick={() => { handlePin(); setShowActions(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/[0.05] transition-colors"
                          >
                            <Pin size={14} /> {post.isPinned ? 'Unpin' : 'Pin'} Post
                          </button>
                          <button
                            onClick={() => { handleLock(); setShowActions(false); }}
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/75 hover:text-white hover:bg-white/[0.05] transition-colors"
                          >
                            <Lock size={14} /> {post.isLocked ? 'Unlock' : 'Lock'} Post
                          </button>
                        </>
                      )}
                      {(isAuthor || isAdminOrMod) && (
                        <button
                          onClick={() => { handleDelete(); setShowActions(false); }}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/[0.05] transition-colors"
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
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-[#dfdfdf] leading-[1.75] tracking-wide
              prose-p:mb-4 prose-p:last:mb-0
              prose-headings:text-white prose-headings:font-extrabold prose-headings:tracking-tight
              prose-a:text-[#7289DA] prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white font-normal
              prose-code:text-[#99AAF5] prose-code:bg-white/[0.05] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-blockquote:border-[#5865F2]/30 prose-blockquote:text-white/60
              prose-li:text-white/70
            ">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mt-6 pt-4 border-t border-white/[0.04]">
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
          <div className="flex items-center justify-between px-5 md:px-7 py-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-1">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  userLiked ? "text-emerald-400" : "text-white/35 hover:text-white/70"
                }`}
                title="Like"
              >
                <ThumbsUp size={13} fill={userLiked ? "currentColor" : "none"} />
              </button>

              <span className={`text-xs font-bold min-w-[20px] text-center select-none ${
                score > 0 ? 'text-emerald-400' : score < 0 ? 'text-red-400' : 'text-white/30'
              }`}>
                {score > 0 ? `+${score}` : score}
              </span>

              <button
                onClick={handleDislike}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  userDisliked ? "text-red-400" : "text-white/35 hover:text-white/70"
                }`}
                title="Dislike"
              >
                <ThumbsDown size={13} fill={userDisliked ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="flex items-center gap-3 text-[11px] text-white/40">
              <span className="flex items-center gap-1"><MessageSquare size={12} /> {post.commentCount || 0}</span>
              <span className="flex items-center gap-1"><Eye size={12} /> {post.views || 0}</span>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-6">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
              Comments
            </h2>
            <span className="text-white/20 text-xs font-bold">({post.commentCount || 0})</span>
          </div>

          {/* Add Comment Box */}
          {user && !post.isLocked ? (
            <div className="flex items-start gap-2.5 mb-6 p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl transition-all duration-200">
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
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-30 disabled:cursor-not-allowed rounded-md text-white text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer"
                    >
                      {isSubmittingComment ? <Loader size={10} className="animate-spin" /> : <Send size={10} />}
                      Comment
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : post.isLocked ? (
            <div className="flex items-center gap-2 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl mb-6 text-white/25 text-sm">
              <Lock size={14} /> This post is locked. No new comments can be added.
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 p-4 bg-white/[0.02] border border-white/[0.05] rounded-xl mb-6">
              <Link to="/home?login=true" className="text-sm text-[#7289DA] hover:text-[#99AAF5] transition-colors font-medium">
                Sign in to comment
              </Link>
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="flex flex-col gap-0">
              {comments.map((comment, i) => (
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
    </div>
  );
}


