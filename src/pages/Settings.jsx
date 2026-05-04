import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../hooks/useAuth";
import { updateSettings } from "../services/settingsService";
import { User, Clock, Heart, Bell, Download, Settings as SettingsIcon, Shield, CheckCircle2 } from "lucide-react";

const getDefaults = (settings) => ({
  titleLanguage: settings?.titleLanguage || 'EN',
  videoLanguage: settings?.videoLanguage || 'Any',
  skipSeconds: settings?.skipSeconds || 5,
  bookmarksPerPage: settings?.bookmarksPerPage || 20,
  autoPlay: settings?.autoPlay ?? true,
  autoNext: settings?.autoNext ?? true
});

export default function Settings() {
  const { user, globalSettings, setGlobalSettings } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if not logged in
  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  // Key forces form remount when globalSettings loads/changes — no setState in effect needed
  const settingsKey = globalSettings?.updatedAt || globalSettings?._id || 'default';

  const [formData, setFormData] = useState(() => getDefaults(globalSettings));

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await updateSettings(formData);
    if (res.success) {
      setGlobalSettings(res.settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setIsSaving(false);
  };

  const navItems = [
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
    { id: "watching", label: "Continue Watching", icon: Clock, path: "/watching" },
    { id: "bookmarks", label: "Bookmarks", icon: Heart, path: "/watchlist" },
    { id: "notifications", label: "Notifications", icon: Bell, path: "/notifications" },
    { id: "import", label: "Import/Export", icon: Download, path: "/import" },
    { id: "settings", label: "Settings", icon: SettingsIcon, path: "/settings" }
  ];

  return (
    <div className="min-h-screen text-white flex flex-col font-sans selection:bg-red-500/30" key={settingsKey}>
      <Navbar />

      <div className="w-full pt-[80px] px-4 md:px-8 pb-12 max-w-[1200px] mx-auto flex-1">
        
        {/* Compact Navigation Tabs */}
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-10 w-full max-w-4xl mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.id === "settings" && location.pathname === "/settings");
            const Icon = item.icon;
            
            return (
              <Link
                key={item.id}
                to={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 border ${
                  isActive 
                  ? "bg-red-600 text-white border-red-600" 
                  : "bg-white/[0.02] border-white/5 text-white/30 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                <span className="hidden md:block text-[12px] font-bold tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Settings Form */}
        <div className="max-w-[700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
          <form onSubmit={handleSubmit} className="bg-[#111] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            
            <div className="p-8 space-y-10">
              
              {/* 1. Title Language */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-black uppercase tracking-tight text-white">Title language</h3>
                  <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest">Anime display preference</p>
                </div>
                <div className="flex items-center gap-6 bg-white/[0.02] p-3 rounded-2xl border border-white/5">
                  {['EN', 'JP'].map((lang) => (
                    <label key={lang} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="radio" 
                          name="titleLanguage" 
                          checked={formData.titleLanguage === lang} 
                          onChange={() => setFormData({...formData, titleLanguage: lang})}
                          className="peer appearance-none w-4 h-4 rounded-full border border-white/20 checked:border-red-600 transition-all"
                        />
                        <div className="absolute w-2 h-2 rounded-full bg-red-600 scale-0 peer-checked:scale-100 transition-transform" />
                      </div>
                      <span className={`text-[12px] font-black uppercase tracking-widest transition-colors ${formData.titleLanguage === lang ? 'text-white' : 'text-white/20'}`}>
                        {lang === 'EN' ? 'English' : 'Japanese'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 2. Video Language */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-1">
                <div className="space-y-1">
                  <h3 className="text-[14px] font-black uppercase tracking-tight text-white">Video language</h3>
                  <p className="text-[11px] font-bold text-white/20 uppercase tracking-widest">Default player source</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  {['Any', 'Hard Sub', 'Soft Sub', 'Dub'].map((lang) => (
                    <label key={lang} className="flex items-center gap-3 cursor-pointer">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="radio" 
                          name="videoLanguage" 
                          checked={formData.videoLanguage === lang} 
                          onChange={() => setFormData({...formData, videoLanguage: lang})}
                          className="peer appearance-none w-4 h-4 rounded-full border border-white/20 checked:border-red-600 transition-all"
                        />
                        <div className="absolute w-2 h-2 rounded-full bg-red-600 scale-0 peer-checked:scale-100 transition-transform" />
                      </div>
                      <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${formData.videoLanguage === lang ? 'text-white' : 'text-white/20'}`}>{lang}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. Skip & Bookmarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-[12px] font-black uppercase tracking-tight text-white">Skip Seconds</h3>
                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Forward/Backward</p>
                  </div>
                  <input 
                    type="number" 
                    value={formData.skipSeconds}
                    onChange={(e) => setFormData({...formData, skipSeconds: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:border-red-600/50 outline-none transition-all"
                  />
                </div>

                <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-[12px] font-black uppercase tracking-tight text-white">Grid Count</h3>
                    <p className="text-[10px] font-bold text-white/10 uppercase tracking-widest">Items per page</p>
                  </div>
                  <input 
                    type="number" 
                    value={formData.bookmarksPerPage}
                    onChange={(e) => setFormData({...formData, bookmarksPerPage: parseInt(e.target.value) || 20})}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 text-sm font-black text-white focus:border-red-600/50 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 4. Player Options */}
              <div className="bg-white/[0.01] p-6 rounded-2xl border border-white/5 space-y-4">
                <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/20">Playback Engine</h3>
                <div className="flex flex-col gap-4">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[12px] font-bold text-white/50 group-hover:text-white transition-colors">Auto-play next episode</span>
                    <input 
                      type="checkbox" 
                      checked={formData.autoNext} 
                      onChange={(e) => setFormData({...formData, autoNext: e.target.checked})}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-600 focus:ring-red-600/50"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-[12px] font-bold text-white/50 group-hover:text-white transition-colors">Auto-start video</span>
                    <input 
                      type="checkbox" 
                      checked={formData.autoPlay} 
                      onChange={(e) => setFormData({...formData, autoPlay: e.target.checked})}
                      className="w-4 h-4 rounded border-white/20 bg-white/5 text-red-600 focus:ring-red-600/50"
                    />
                  </label>
                </div>
              </div>

            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={isSaving}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black py-5 text-[11px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : saveSuccess ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Config Saved</span>
                </>
              ) : (
                <span>Push Updates</span>
              )}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
}
