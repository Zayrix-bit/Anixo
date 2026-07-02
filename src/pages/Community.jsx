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
  general: "bg-[#5865F2]/15 text-[#9fb1f0] border-[#9fb1f0]/20",
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
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-[#111111] border border-white/10 rounded-md md:rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-white/10">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Plus size={18} className="text-[#9fb1f0]" />
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
              className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 md:px-4 py-2.5 md:py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#9fb1f0]/50 focus:ring-1 focus:ring-[#9fb1f0]/20 transition-all text-sm"
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
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${category === cat.id
                      ? "bg-[#5865F2] text-white border-[#9fb1f0]"
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
              className="w-full bg-white/[0.03] border border-white/10 rounded-md px-3 md:px-4 py-2.5 md:py-3 text-white placeholder-white/20 focus:outline-none focus:border-[#9fb1f0]/50 focus:ring-1 focus:ring-[#9fb1f0]/20 transition-all text-sm resize-none mini-scrollbar"
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
                className="flex-1 bg-white/[0.03] border border-white/10 rounded-md px-3 md:px-4 py-2 md:py-2.5 text-white placeholder-white/20 focus:outline-none focus:border-[#9fb1f0]/50 transition-all text-sm"
              />
              <button
                onClick={() => setShowPopularTags(prev => !prev)}
                className={`px-3 py-2 border rounded-md transition-all cursor-pointer ${showPopularTags
                    ? "bg-[#5865F2]/10 border-[#9fb1f0]/30 text-[#9fb1f0] hover:text-[#9fb1f0]"
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
                        className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all ${isSelected
                            ? "bg-[#5865F2]/10 border-[#9fb1f0]/20 text-[#9fb1f0]/50 cursor-not-allowed"
                            : "bg-white/[0.02] border-white/[0.08] text-white/40 hover:text-white/80 hover:bg-white/[0.06] hover:border-white/12 cursor-pointer"
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
                  <span key={tag} className="px-2.5 py-1 bg-[#5865F2]/10 border border-[#9fb1f0]/25 text-[#9fb1f0] text-[11px] font-bold rounded-md flex items-center gap-1.5 animate-in fade-in zoom-in-95 duration-100">
                    #{tag}
                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="text-[#9fb1f0]/50 hover:text-[#9fb1f0] transition-colors cursor-pointer">
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
            className="px-5 py-2 bg-[#5865F2] hover:bg-[#5b73c7] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-widest rounded-md transition-all flex items-center gap-2"
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
    <div className="min-h-screen text-white bg-[#080808] flex flex-col font-sans selection:bg-[#5865F2]/30">
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 max-w-[1200px] mx-auto w-full px-3 md:px-6 pt-[72px] md:pt-[100px] pb-20 md:pb-12">
        <div className="flex flex-col lg:flex-row gap-8 items-start">

          {/* Left Column: Categories Sidebar */}
          <div className="w-full lg:w-[180px] lg:sticky lg:top-[100px] shrink-0">
            <div className="flex lg:flex-col gap-1.5 md:gap-2 overflow-x-auto scrollbar-hide pb-2 lg:pb-0 -mx-3 px-3 md:mx-0 md:px-0">
              {CATEGORIES.map(cat => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`flex items-center justify-start gap-2 md:gap-2.5 px-3 md:px-3.5 py-2 md:py-2.5 rounded-md text-[11px] md:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border cursor-pointer ${activeCategory === cat.id
                        ? "bg-[#5865F2]/10 text-[#9fb1f0] border-[#9fb1f0]/45"
                        : "bg-transparent border-white/[0.08] text-white/45 hover:text-white/75 hover:border-white/12"
                      }`}
                  >
                    <Icon size={12} className={activeCategory === cat.id ? "text-[#9fb1f0]" : "text-white/25"} />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Vertical Separator Line */}
          <div className="hidden lg:block w-[1px] bg-white/[0.06] self-stretch min-h-[500px] shrink-0" />

          {/* Right Column: Search, Sort and Feed */}
          <div className="flex-1 min-w-0 w-full">
            {/* Top Toolbar: Search & Sort */}
            <div className="flex items-center justify-between gap-3 mb-4 md:mb-6">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search posts..."
                  className="w-full bg-white/[0.02] border border-white/[0.08] rounded-md pl-9 pr-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-[#9fb1f0]/40 transition-all"
                />
              </div>

              {/* Sort Buttons (always visible) + Create Post (desktop only, FAB on mobile) */}
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                {user && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[#5865F2] hover:bg-[#5b73c7] rounded-md text-white text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    <Plus size={12} />
                    <span>Create Post</span>
                  </button>
                )}

                <div className="flex items-center bg-white/[0.02] border border-white/[0.08] rounded-md p-0.5">
                  {SORT_OPTIONS.map((opt, idx) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => { setIsLoading(true); setActiveSort(opt.id); setCurrentPage(1); }}
                        className={`flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1.5 rounded text-[10px] md:text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${activeSort === opt.id
                            ? "bg-white/10 text-white"
                            : "text-white/40 hover:text-white/70"
                          } ${idx > 0 ? "border-l border-white/[0.08]" : ""}`}
                      >
                        <Icon size={11} className="text-white/25" />
                        <span className="hidden sm:inline">{opt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Posts Feed */}
            <div className="space-y-2 md:space-y-3">
              {isLoading ? (
                // Skeleton Loaders
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="bg-[#121212] border border-white/[0.08] rounded-md p-5 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/[0.03]" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 bg-white/[0.03] rounded" />
                        <div className="h-3 w-1/2 bg-white/[0.02] rounded" />
                        <div className="h-3 w-full bg-white/[0.02] rounded" />
                      </div>
                    </div>
                  </div>
                ))
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-[#121212] border border-white/[0.08] rounded-md">
                  <MessageSquare size={36} className="text-white/[0.06] mb-3" />
                  <h3 className="text-sm font-bold text-white/30 mb-1">No Posts Yet</h3>
                  <p className="text-xs text-white/15 mb-4">Be the first to start a discussion!</p>
                  {user && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-[#5865F2] hover:bg-[#5b73c7] rounded-lg text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
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
                    className="group block bg-[#121212] border border-white/[0.08] hover:border-white/12 rounded-md p-3 md:p-4 transition-all duration-200"
                  >
                    <div className="flex items-start gap-2.5 md:gap-3">
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-800 ring-1 ring-white/10 shrink-0">
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
                          <span className="text-xs font-bold text-white/90 group-hover:text-white transition-colors">
                            {post.author?.displayName || post.author?.profileId || post.author?.username}
                          </span>
                          <RoleBadge role={post.author?.role} />
                          <span className="text-[10px] text-white/20">/</span>
                          <span className="text-[10px] text-white/40">{timeAgo(post.createdAt)}</span>
                          {post.isPinned && (
                            <span className="inline-flex items-center text-amber-400 ml-1" title="Pinned">
                              <Pin size={9} />
                            </span>
                          )}
                          {post.isLocked && (
                            <span className="inline-flex items-center gap-0.5 text-[9px] text-[#9fb1f0] font-bold uppercase ml-1">
                              <Lock size={9} /> Locked
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-semibold text-white/90 group-hover:text-[#9fb1f0] mb-1 leading-snug transition-colors">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-[13px] text-white/50 line-clamp-2 leading-relaxed mb-3">
                          {post.content?.substring(0, 200)}
                        </p>

                        {/* Footer */}
                        <div className="flex items-center gap-4 flex-wrap">
                          {/* Category Badge */}
                          <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border ${CATEGORY_COLORS[post.category] || CATEGORY_COLORS.general}`}>
                            {post.category}
                          </span>

                          {/* Stats */}
                          <div className="flex items-center gap-3 text-white/40 text-[11px]">
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
                            <div className="hidden sm:flex items-center gap-1.5 ml-auto">
                              {post.tags.slice(0, 3).map(tag => (
                                <span key={tag} className="text-[10px] text-white/35 font-medium">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Arrow */}
                      <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors shrink-0 mt-1" />
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
                    className={`w-9 h-9 rounded-md text-xs font-bold transition-all cursor-pointer ${currentPage === page
                        ? "bg-[#5865F2]"
                        : "bg-white/[0.03] text-white/30 hover:bg-white/[0.06] border border-white/[0.04]"
                      }`}
                  >
                    {page}
                  </button>
                ))}
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
          className="fixed bottom-6 right-6 z-[90] md:hidden flex items-center justify-center w-12 h-12 bg-[#5865F2] active:bg-[#5b73c7] text-white rounded-full shadow-lg shadow-[#5865F2]/25 active:scale-95 transition-all cursor-pointer"
          aria-label="Create Post"
        >
          <Plus size={22} />
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




