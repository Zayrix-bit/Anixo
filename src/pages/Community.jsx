import { useState, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { useAuth } from "../hooks/useAuth";
import { getCommunityPosts, createCommunityPost } from "../services/communityService";
import {
  MessageSquare, ThumbsUp, Eye, Clock, TrendingUp, Flame, Plus, X,
  Search, Pin, Lock, Crown, Shield, ChevronRight, Users, BookOpen,
  AlertTriangle, Send, Tag, Filter, ChevronDown, Loader
} from "lucide-react";

const CATEGORIES = [
  { id: "all", label: "All", icon: Filter },
  { id: "general", label: "General", icon: MessageSquare },
  { id: "anime", label: "Anime", icon: BookOpen },
  { id: "feedback", label: "Feedback", icon: Send },
  { id: "question", label: "Questions", icon: AlertTriangle },
  { id: "news", label: "News", icon: TrendingUp },
  { id: "poll", label: "Polls", icon: Users },
];

const SORT_OPTIONS = [
  { id: "newest", label: "Newest", icon: Clock },
  { id: "hot", label: "Hot", icon: Flame },
  { id: "top", label: "Top", icon: TrendingUp },
];

const CATEGORY_COLORS = {
  general: "bg-[#5865F2]/15 text-[#7289DA] border-[#5865F2]/20",
  anime: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  feedback: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
  question: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  news: "bg-red-500/15 text-red-400 border-red-500/20",
  poll: "bg-cyan-500/15 text-cyan-400 border-cyan-500/20",
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
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-500/20 text-purple-400 text-[9px] font-bold uppercase tracking-wider rounded border border-purple-500/30">
      <Crown size={9} fill="currentColor" /> Admin
    </span>
  );
  if (role === 'moderator') return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[9px] font-bold uppercase tracking-wider rounded border border-red-500/30">
      <Shield size={9} fill="currentColor" /> Mod
    </span>
  );
  return null;
};

const RECOMMENDED_TAGS = [
  "recommendation",
  "discussion",
  "spoilers",
  "theory",
  "review",
  "meme",
  "fanart",
  "amv",
  "news",
  "help"
];

// ==================== CREATE POST MODAL ====================
function CreatePostModal({ isOpen, onClose, onCreated, user }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
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
    const res = await createCommunityPost({ title, content, category, tags });
    setIsSubmitting(false);
    if (res.success) {
      onCreated(res.post);
      setTitle("");
      setContent("");
      setCategory("general");
      setTags([]);
      onClose();
    } else {
      setError(res.message || "Failed to create post");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-[#111111] border border-white/10 rounded-xl md:rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-[#5865F2]" />
            Create Post
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 md:p-6 space-y-4 max-h-[80vh] md:max-h-[70vh] overflow-y-auto mini-scrollbar">
          {error && (
            <div className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
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
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#5865F2]/50 focus:ring-1 focus:ring-[#5865F2]/20 transition-all text-base md:text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label className="text-[11px] font-bold text-white/40 uppercase tracking-wider mb-1.5 block">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    category === cat.id
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
              rows={8}
              className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#5865F2]/50 focus:ring-1 focus:ring-[#5865F2]/20 transition-all text-base md:text-sm resize-none mini-scrollbar"
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
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#5865F2]/50 transition-all text-base md:text-sm"
              />
              <button
                onClick={() => setShowPopularTags(prev => !prev)}
                className={`px-3 py-2 border rounded-xl transition-all cursor-pointer ${
                  showPopularTags
                    ? "bg-[#5865F2]/10 border-[#5865F2]/30 text-[#5865F2] hover:text-[#7289DA]"
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
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                          isSelected
                            ? "bg-[#5865F2]/10 border-[#5865F2]/20 text-[#7289DA]/50 cursor-not-allowed"
                            : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/12 cursor-pointer"
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
                  <span key={tag} className="px-2.5 py-1 bg-[#5865F2]/10 border border-[#5865F2]/25 text-[#7289DA] text-[11px] font-bold rounded-lg flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                    #{tag}
                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-[#7289DA]/50 hover:text-[#7289DA] transition-colors cursor-pointer">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full overflow-hidden border border-white/10 bg-neutral-800">
              <img src={getAvatarUrl(user?.avatar, user?.username)} alt="" className="w-full h-full object-cover" />
            </div>
            <span className="text-xs text-white/40">{user?.displayName || user?.username}</span>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752C4] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2"
          >
            {isSubmitting ? <Loader size={14} className="animate-spin" /> : <Send size={14} />}
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN COMMUNITY PAGE ====================
export default function Community() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [activeCategory, setActiveCategory] = useState(searchParams.get("category") || "all");
  const [activeSort, setActiveSort] = useState(searchParams.get("sort") || "newest");
  const [currentPage, setCurrentPage] = useState(1);
  const searchTimeout = useRef(null);

  const fetchPosts = async (page = 1) => {
    const res = await getCommunityPosts({
      page,
      limit: 20,
      category: activeCategory,
      sort: activeSort,
      search: searchQuery.trim() || undefined,
    });
    if (res.success) {
      setPosts(res.posts);
      setPagination(res.pagination);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPosts(currentPage);
  }, [activeCategory, activeSort, currentPage]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setIsLoading(true);
      setCurrentPage(1);
      fetchPosts(1);
    }, 400);
    return () => clearTimeout(searchTimeout.current);
  }, [searchQuery]);

  const handleCategoryChange = (catId) => {
    setIsLoading(true);
    setActiveCategory(catId);
    setCurrentPage(1);
  };

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  return (
    <div className="min-h-screen text-white bg-[#0a0a0a] flex flex-col font-sans selection:bg-[#5865F2]/30">
      <Navbar />

      {/* Hero Banner */}
      <div className="relative w-full pt-[56px]">
        <div className="relative overflow-hidden">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1c4a]/50 via-[#0a0a0a] to-[#1a1c4a]/20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.15),transparent_60%)]" />

          <div className="relative max-w-[1720px] mx-auto px-4 md:px-6 py-10 md:py-16">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="w-[3.5px] h-8 bg-[#5865F2] rounded-full" />
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter leading-none">
                    Community
                  </h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-widest select-none animate-pulse">
                    Beta
                  </span>
                </div>
                <p className="text-white/60 text-sm md:text-base max-w-xl leading-relaxed ml-5">
                  Discuss anime, share recommendations, ask questions, and connect with fellow otakus.
                </p>
                <div className="flex items-center gap-2 mt-3.5 ml-5 px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-amber-400 text-[11px] font-semibold max-w-fit shadow-sm">
                  <AlertTriangle size={12} className="shrink-0 text-amber-500" />
                  <span>Note: The community system is currently in testing (Beta version).</span>
                </div>
              </div>

              {user && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="group hidden md:flex items-center gap-2.5 px-5 py-3 bg-[#5865F2] hover:bg-[#4752C4] rounded-xl text-white font-bold text-xs uppercase tracking-widest transition-all hover:shadow-lg hover:shadow-[#5865F2]/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus size={16} className="group-hover:rotate-90 transition-transform duration-200" />
                  Create Post
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-[1720px] mx-auto w-full px-4 md:px-6 pb-12">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Left Content */}
          <div className="flex-1 min-w-0">
            {/* Filters Bar */}
            <div className="sticky top-[56px] z-40 bg-[#0a0a0a]/95 backdrop-blur-md pb-4 pt-2 -mx-4 px-4 md:-mx-6 md:px-6 border-b border-white/[0.04]">
              {/* Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-3">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryChange(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap border ${
                        activeCategory === cat.id
                          ? "bg-[#5865F2] text-white border-[#5865F2] shadow-lg shadow-[#5865F2]/10"
                          : "bg-white/[0.03] border-white/[0.06] text-white/35 hover:text-white/60 hover:border-white/10"
                      }`}
                    >
                      <Icon size={12} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>

              {/* Search + Sort Row */}
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-9 pr-4 py-2.5 text-base md:text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#5865F2]/40 transition-all"
                  />
                </div>

                {/* Sort Buttons */}
                <div className="flex items-center justify-between sm:justify-start gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-0.5 w-full sm:w-auto shrink-0">
                  {SORT_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => { setIsLoading(true); setActiveSort(opt.id); setCurrentPage(1); }}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all ${
                          activeSort === opt.id
                            ? "bg-white/15 text-white"
                            : "text-white/55 hover:text-white"
                        }`}
                      >
                        <Icon size={11} />
                        <span>{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="mt-4 space-y-2">
              {isLoading ? (
                // Skeleton Loaders
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-5 animate-shimmer">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/[0.05]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-white/[0.05] rounded" />
                        <div className="h-3 w-1/2 bg-white/[0.03] rounded" />
                        <div className="h-3 w-full bg-white/[0.03] rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageSquare size={48} className="text-white/[0.06] mb-4" />
                  <h3 className="text-lg font-bold text-white/20 mb-2">No Posts Yet</h3>
                  <p className="text-sm text-white/10 mb-6">Be the first to start a discussion!</p>
                  {user && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg text-white text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Create Post
                    </button>
                  )}
                </div>
              ) : (
                posts.map(post => (
                  <Link
                    key={post._id}
                    to={`/community/post/${post._id}`}
                    className="group block bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.1] rounded-xl p-4 md:p-5 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border border-white/10 bg-neutral-800 shrink-0">
                        <img
                          src={getAvatarUrl(post.author?.avatar, post.author?.username)}
                          alt={post.author?.username}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {/* Author + Meta */}
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-bold text-white group-hover:text-white transition-colors">
                            {post.author?.displayName || post.author?.profileId || post.author?.username}
                          </span>
                          <RoleBadge role={post.author?.role} />
                          <span className="text-[10px] text-white/20">/</span>
                          <span className="text-[10px] text-white/40">{timeAgo(post.createdAt)}</span>
                          {post.isPinned && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-400 font-bold uppercase">
                              <Pin size={9} /> Pinned
                            </span>
                          )}
                          {post.isLocked && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-[#7289DA] font-bold uppercase">
                              <Lock size={9} /> Locked
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-[15px] md:text-base font-bold text-white group-hover:text-white mb-1.5 line-clamp-2 leading-snug transition-colors">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-sm text-white/55 line-clamp-2 leading-relaxed mb-3">
                          {post.content?.substring(0, 200)}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Category Badge */}
                          <span className={`px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}>
                            {post.category}
                          </span>

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-white/45 text-[11px]">
                            <span className="flex items-center gap-1">
                              <ThumbsUp size={11} />
                              {post.score || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare size={11} />
                              {post.commentCount || 0}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye size={11} />
                              {post.views || 0}
                            </span>
                          </div>

                          {/* Tags */}
                          {post.tags?.length > 0 && (
                            <div className="flex items-center gap-1.5 ml-auto">
                              {post.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[10px] text-white/35 font-medium">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight size={16} className="text-white/20 group-hover:text-white/40 transition-colors shrink-0 mt-1" />
                    </div>
                  </Link>
                ))
              )}
            </div>

            {/* Pagination */}
            {!isLoading && pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: Math.min(pagination.totalPages, 10) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => {
                      setIsLoading(true);
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                      currentPage === page
                        ? "bg-[#5865F2] text-white"
                        : "bg-white/[0.03] text-white/30 hover:text-white hover:bg-white/[0.06] border border-white/[0.04]"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-[320px] shrink-0 space-y-4 pt-2">
            {/* Community Stats */}
            <div className="bg-white/[0.04] border border-white/[0.05] rounded-xl p-5">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Users size={12} /> Community
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/50">Total Posts</span>
                  <span className="text-sm font-bold text-white/80">{pagination.total || 0}</span>
                </div>
              </div>
            </div>

            {/* Rules */}
            <div className="bg-white/[0.04] border border-white/[0.05] rounded-xl p-5">
              <h3 className="text-xs font-bold text-white/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                <AlertTriangle size={12} /> Community Rules
              </h3>
              <ol className="space-y-2.5 text-[12px] text-white/55 leading-relaxed list-decimal list-inside">
                <li>Be respectful to all community members</li>
                <li>No spoilers without proper tags</li>
                <li>No spam or self-promotion</li>
                <li>Keep discussions related to anime</li>
                <li>No NSFW content outside designated areas</li>
                <li>Follow the site's Terms of Service</li>
              </ol>
            </div>

            {/* Quick Links */}
            {!user && (
              <div className="bg-gradient-to-br from-[#1a1c4a]/30 to-transparent border border-[#5865F2]/10 rounded-xl p-5 text-center">
                <h3 className="text-sm font-bold text-white mb-2">Join the Discussion</h3>
                <p className="text-[12px] text-white/30 mb-4">Sign in to create posts, comment, and interact with the community.</p>
                <Link
                  to="/home?login=true"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#5865F2] hover:bg-[#4752C4] rounded-lg text-white text-xs font-bold uppercase tracking-widest transition-all"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Floating Action Button for Mobile */}
      {user && (
        <button
          onClick={() => setShowCreateModal(true)}
          className="fixed bottom-6 right-6 z-[90] md:hidden flex items-center justify-center w-14 h-14 bg-[#5865F2] active:bg-[#4752C4] text-white rounded-full shadow-lg shadow-[#5865F2]/30 active:scale-95 transition-all cursor-pointer border border-[#5865F2]/20"
          aria-label="Create Post"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handlePostCreated}
        user={user}
      />
    </div>
  );
}


