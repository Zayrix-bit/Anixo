import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../hooks/useAuth";
import { updateMe } from "../services/authService";
import { User, Clock, Heart, Bell, Download, Settings, Key, CheckCircle, Pencil, Eye, EyeOff, BarChart2, Shield, Ban, Crown } from "lucide-react";
import AvatarModal from "../components/user/AvatarModal";
import { updateMetaTags } from "../utils/seo";

const getAccountAge = (dateString) => {
  if (!dateString) return null;
  const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
  if (days < 30) {
    const d = Math.max(1, days);
    return `${d} DAY${d === 1 ? '' : 'S'} OLD`;
  }
  if (days < 365) {
    const m = Math.floor(days / 30);
    return `${m} MONTH${m === 1 ? '' : 'S'} OLD`;
  }
  const y = Math.floor(days / 365);
  return `${y} YEAR${y === 1 ? '' : 'S'} OLD`;
};

export default function Profile() {
  const { t } = useTranslation();
  const { user, triggerAuthToast, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    username: user?.username || "",
    email: user?.email || "",
    displayName: user?.displayName || user?.username || "",
    currentPassword: "",
    password: "",
    confirmPassword: ""
  });
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    updateMetaTags({
      title: t('profile.settingsTitle'),
      description: t('profile.settingsDesc'),
      url: "/profile",
      noindex: true
    });

    return () => {
      updateMetaTags({ title: "", description: "", url: "", noindex: false });
    };
  }, []);

  // Error is cleared inline via onChange handlers below (avoids cascading render warning)

  useEffect(() => {
    if (!user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (showPasswordFields) {
      if (formData.password !== formData.confirmPassword) {
        setError(t('profile.passwordsMismatch'));
        return;
      }
      if (formData.password.length < 6) {
        setError(t('profile.passwordTooShort'));
        return;
      }
    }

    try {
      setIsSaving(true);
      const updatePayload = {
        username: formData.username,
        email: formData.email,
        displayName: formData.displayName,
      };

      if (showPasswordFields && formData.password) {
        updatePayload.currentPassword = formData.currentPassword;
        updatePayload.password = formData.password;
      }

      const res = await updateMe(updatePayload);
      if (res.success) {
        updateUser(res.user);
        setFormData(prev => ({ ...prev, currentPassword: "", password: "", confirmPassword: "" }));
        setShowPasswordFields(false);
        triggerAuthToast(t('profile.updatedSuccess'));
      }
    } catch (err) {
      setError(err?.response?.data?.message || t('profile.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarSave = async (newAvatarUrl) => {
    try {
      setIsSaving(true);
      const res = await updateMe({ avatar: newAvatarUrl });
      if (res.success) {
        updateUser(res.user);
        triggerAuthToast(t('profile.avatarUpdated'));
      }
    } catch (error) {
      alert(error?.response?.data?.message || t('profile.avatarUpdateFailed'));
    } finally {
      setIsSaving(false);
      setShowAvatarModal(false);
    }
  };

  const navItems = [
    { id: "profile", label: t('nav.profile'), icon: User, path: "/profile" },
    { id: "watching", label: t('nav.continueWatching'), icon: Clock, path: "/watching" },
    { id: "bookmarks", label: t('nav.bookmarks'), icon: Heart, path: "/watchlist" },
    { id: "notifications", label: t('nav.notifications'), icon: Bell, path: "/notifications" },
    { id: "stats", label: t('nav.stats'), icon: BarChart2, path: "/stats" },
    { id: "import", label: t('nav.importExport'), icon: Download, path: "/import" },
    ...(user?.role === 'admin' ? [{ id: "admin", label: "Admin", icon: User, path: "/admin" }] : []),
    { id: "settings", label: t('nav.settings'), icon: Settings, path: "/settings" }
  ];

  if (!user) return null;

  return (
    <>
      <div key={user?.id || 'profile'} className="min-h-screen text-white flex flex-col font-sans selection:bg-discord-500/30">
        <Navbar />

        <div className="w-full pt-[80px] px-4 md:px-8 pb-12 max-w-[1200px] mx-auto flex flex-col items-center">

          {/* Compact Navigation Tabs - No Glow */}
          <div className="flex flex-wrap sm:flex-nowrap justify-center gap-1.5 sm:gap-2 md:gap-3 mb-8 w-full max-w-4xl px-1 sm:px-0">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.id === "profile" && location.pathname === "/profile");
              const Icon = item.icon;

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center justify-center gap-2 px-2.5 sm:px-3 md:px-4 py-2 sm:py-2 rounded-xl transition-all duration-300 border shrink-0 ${isActive
                      ? "bg-discord-600 text-white border-discord-600"
                      : "bg-white/[0.02] border-white/15 text-white/50 hover:text-white hover:bg-white/[0.05]"
                    }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0 w-[18px] h-[18px] md:w-4 md:h-4" />
                  <span className="hidden md:block text-[12px] font-medium tracking-tight whitespace-nowrap">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* BAN BANNER */}
          {user?.banUntil && new Date(user.banUntil) > new Date() && (
            <div className="w-full max-w-xl mb-6 p-4 rounded-2xl bg-discord-500/10 border border-discord-500/20 text-discord-400 flex items-start gap-3">
              <div className="mt-0.5"><Ban size={18} /></div>
              <div>
                <h4 className="font-bold text-sm">Account Restricted</h4>
                <p className="text-xs text-discord-400/80 mt-1">
                  You are currently banned from commenting until {new Date(user.banUntil).toLocaleString()} 
                  {user.bannedByRole ? ` by ${user.bannedByRole}.` : '.'}
                </p>
              </div>
            </div>
          )}

          {/* Profile Content - Compact Card */}
          <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="bg-[#111] border border-white/15 rounded-2xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">

              {/* Avatar Section - No Glow */}
              <div className="flex flex-col items-center gap-3 shrink-0">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border border-white/10 bg-[#181818] flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 duration-300">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-medium text-white/80">
                        {user.username?.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  {/* Pencil Edit Icon */}
                  <button 
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute -bottom-1 -right-1 bg-discord-600 p-2 rounded-full border-2 border-[#111] text-white hover:bg-discord-700 hover:scale-110 transition-all shadow-xl shadow-discord-600/20"
                    title={t('profile.changeAvatar')}
                  >
                    <Pencil size={12} strokeWidth={3} />
                  </button>
                  {/* Crown for Admin/Mod */}
                  {(user.role === 'admin' || user.role === 'moderator') && (
                    <div className={`absolute -top-1 -left-1 p-1 rounded-full shadow-lg ${
                      user.role === 'admin' ? 'bg-purple-600' : 'bg-discord-600'
                    } border-2 border-[#111]`}>
                      {user.role === 'admin' ? (
                        <Crown size={14} fill="currentColor" />
                      ) : (
                        <Shield size={14} fill="currentColor" />
                      )}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center">
                  <h2 className="text-lg font-medium tracking-tight">
                    {user.profileId || user.username}
                  </h2>
                  <span className="text-[9px] text-white/40 uppercase tracking-[0.2em]">{t('profile.verifiedUser')}</span>
                  {user.createdAt && (
                    <span className="text-[8px] text-white/30 uppercase tracking-widest mt-1">
                      {getAccountAge(user.createdAt)} &bull; SINCE {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Form Section */}
              <form onSubmit={handleSave} className="flex-1 flex flex-col gap-5 w-full">

                <div className="grid grid-cols-1 gap-5">
                  {/* Profile ID (Disabled) */}
                  <div className="flex flex-col gap-1.5 group">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest ml-1">PROFILE ID</label>
                    <input
                      type="text"
                      value={user?.profileId || user?.username || ""}
                      disabled
                      className="bg-white/[0.02] text-white/60 px-4 py-2.5 rounded-xl border border-white/15 outline-none text-[13px] w-full cursor-not-allowed opacity-80"
                    />
                    <p className="text-white/30 text-[10px] ml-1 mt-0.5">This is your unique Profile ID used in your public URL.</p>
                  </div>

                  {/* Email */}
                  <div className="flex flex-col gap-1.5 group">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-discord-500/50">{t('profile.emailAddress')}</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => { setFormData({ ...formData, email: e.target.value }); if (error) setError(null); }}
                      className="bg-white/[0.02] text-white px-4 py-2.5 rounded-xl border border-white/15 focus:border-discord-600/30 focus:bg-white/[0.04] outline-none text-[13px] w-full transition-all"
                    />
                  </div>

                  {/* Display Name */}
                  <div className="flex flex-col gap-1.5 group">
                    <label className="text-[10px] font-medium text-white/40 uppercase tracking-widest ml-1 group-focus-within:text-discord-500/50">{t('profile.displayName')}</label>
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => { setFormData({ ...formData, displayName: e.target.value }); if (error) setError(null); }}
                      className="bg-white/[0.02] text-white px-4 py-2.5 rounded-xl border border-white/15 focus:border-discord-600/30 focus:bg-white/[0.04] outline-none text-[13px] w-full transition-all"
                    />
                  </div>
                </div>

                {/* Password Section */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPasswordFields(!showPasswordFields)}
                    className="flex items-center gap-2 text-[11px] font-medium text-white/50 hover:text-white/60 transition-colors ml-1"
                  >
                    <Key size={12} className={showPasswordFields ? "text-discord-500" : ""} />
                    <span>{showPasswordFields ? t('profile.discardPassword') : t('profile.changePassword')}</span>
                  </button>

                  {showPasswordFields && (
                    <div className="mt-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-300">
                      {/* Current Password */}
                      <div className="relative group">
                        <input
                          type={showPasswords ? "text" : "password"}
                          placeholder={t('profile.currentPasswordPlaceholder')}
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                          className={`bg-white/[0.02] text-white px-4 py-2.5 rounded-xl border outline-none text-[13px] w-full transition-all ${error && error.toLowerCase().includes("current password") ? "border-discord-500 animate-shake" : "border-white/15 focus:border-discord-600/30"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(!showPasswords)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/60 transition-colors"
                        >
                          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      <div className="flex justify-start px-1 -mt-2">
                        <Link 
                          to="/forgot-password"
                          className="text-discord-500 hover:text-discord-400 text-[10px] font-medium transition-colors"
                        >
                          {t('profile.forgotPassword')}
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* New Password */}
                        <div className="relative group">
                          <input
                            type={showPasswords ? "text" : "password"}
                            placeholder={t('profile.newPasswordPlaceholder')}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="bg-white/[0.02] text-white px-4 py-2.5 rounded-xl border border-white/15 focus:border-discord-600/30 outline-none text-[13px] w-full"
                          />
                        </div>

                        {/* Confirm Password */}
                        <div className="relative group">
                          <input
                            type={showPasswords ? "text" : "password"}
                            placeholder={t('profile.confirmPasswordPlaceholder')}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className={`bg-white/[0.02] text-white px-4 py-2.5 rounded-xl border outline-none text-[13px] w-full transition-all ${error && error.toLowerCase().includes("match") ? "border-discord-500 animate-shake" : "border-white/15 focus:border-discord-600/30"}`}
                          />
                        </div>
                      </div>

                      {/* Password Strength Indicator */}
                      {formData.password && (
                        <div className="px-1 flex flex-col gap-1.5">
                          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-medium">
                            <span className="text-white/40">{t('profile.strength')}</span>
                            <span className={
                              formData.password.length < 6 ? "text-discord-500" :
                              formData.password.length < 10 ? "text-yellow-500" : "text-emerald-500"
                            }>
                              {formData.password.length < 6 ? t('profile.weak') :
                               formData.password.length < 10 ? t('profile.medium') : t('profile.strong')}
                            </span>
                          </div>
                          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${
                                formData.password.length < 6 ? "bg-discord-500 w-1/3" :
                                formData.password.length < 10 ? "bg-yellow-500 w-2/3" : "bg-emerald-500 w-full"
                              }`}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Save Button - No Shadow */}
                <button
                  type="submit"
                  disabled={isSaving}
                  className="mt-2 bg-discord-600 hover:bg-discord-700 disabled:opacity-50 text-white font-medium text-[11px] uppercase tracking-[0.2em] py-3.5 rounded-xl transition-all active:scale-[0.98]"
                >
                  {isSaving ? t('profile.saving') : t('profile.saveChanges')}
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>


      <AvatarModal 
        isOpen={showAvatarModal}
        onClose={() => setShowAvatarModal(false)}
        onSave={handleAvatarSave}
        currentAvatar={user?.avatar}
      />
    </>
  );
}
