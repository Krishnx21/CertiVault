import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell, ChevronDown, LogOut, Menu, Search,
  User, Settings, HelpCircle, Keyboard, Moon, Sun,
  Camera, Upload, Clock,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext.js";
import { api } from "../api.js";
import { NotificationCenter } from "./NotificationCenter.js";
import { GlobalSearch } from "./GlobalSearch.js";

interface TopbarProps {
  search?: string;
  setSearch?: (v: string) => void;
  setMobileNav: (open: boolean) => void;
}

export function Topbar({ setMobileNav }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [avatar, setAvatar] = useState(user?.avatar || "");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setAvatar(user?.avatar || "");
    loadUnreadCount();
  }, [user]);

  useEffect(() => {
    const id = window.setInterval(loadUnreadCount, 30_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
      if (e.key === "Escape") {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const r = await api.getUnreadCount();
      setUnreadCount(r.count);
    } catch { /* silent */ }
  };

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5 MB"); return; }
    const reader = new FileReader();
    reader.onloadend = async () => {
      const b64 = reader.result as string;
      setAvatar(b64);
      try { await api.updateProfile({ avatar: b64 }); } catch { /* silent */ }
    };
    reader.readAsDataURL(file);
  };

  const generateAvatar = async () => {
    try {
      const r = await api.generateAvatar(user?.name || "User");
      setAvatar(r.data.avatarUrl);
      await api.updateProfile({ avatar: r.data.avatarUrl });
    } catch { /* silent */ }
  };

  const roleBadgeClass = (role?: string) => {
    if (role === "admin")    return "role-admin";
    if (role === "verifier") return "role-verifier";
    return "role-user";
  };

  const formatLastLogin = () => {
    const lastLogin = (user as any)?.lastLoginAt;
    if (!lastLogin) return "First session";
    const d = new Date(lastLogin);
    return `Last login ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
  };

  return (
    <header className="topbar">
      {/* Mobile hamburger */}
      <button
        className="icon-button menu-button"
        onClick={() => setMobileNav(true)}
        aria-label="Open navigation"
      >
        <Menu size={20} />
      </button>

      {/* Global search trigger */}
      <div className="global-search">
        <button
          className="global-search-button"
          onClick={() => setShowGlobalSearch(true)}
          aria-label="Open global search"
        >
          <Search size={16} aria-hidden="true" />
          <span>Search documents, tags, owners…</span>
          <kbd>⌘K</kbd>
        </button>
      </div>

      {/* Right actions */}
      <div className="top-actions">
        {/* Notifications */}
        <button
          className="icon-button notification"
          onClick={() => setShowNotifications(!showNotifications)}
          aria-label={unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}
        >
          <Bell size={19} />
          {unreadCount > 0 && (
            <span className="notification-badge-top" aria-hidden="true">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* Profile */}
        <div className="relative" ref={menuRef}>
          <button
            className="profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            aria-expanded={showProfileMenu}
            aria-haspopup="menu"
            aria-label="User menu"
          >
            <div className="avatar avatar-sm avatar-circle">
              {avatar
                ? <img src={avatar} alt={user?.name || "avatar"} />
                : getUserInitials()
              }
            </div>
            <span>{user?.name || "User"}</span>
            <ChevronDown size={14} aria-hidden="true" />
          </button>

          {/* Dropdown */}
          <div
            className={`profile-dropdown ${showProfileMenu ? "show" : ""}`}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="profile-header">
              <div className="profile-avatar-container">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="profile-avatar" />
                ) : (
                  <div className="profile-avatar-initials">{getUserInitials()}</div>
                )}
                <button
                  className="avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload photo"
                  aria-label="Upload avatar photo"
                >
                  <Camera size={13} />
                </button>
                <button
                  className="avatar-generate-btn"
                  onClick={generateAvatar}
                  title="Generate avatar"
                  aria-label="Generate initials avatar"
                >
                  <Upload size={13} />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="visually-hidden"
                  aria-hidden="true"
                />
              </div>
              <div className="profile-info">
                <div className="profile-name">{user?.name || "User"}</div>
                <div className="profile-email">{user?.email}</div>
                <div className="profile-meta">
                  <span className={`profile-role ${roleBadgeClass(user?.role)}`}>
                    {user?.role || "user"}
                  </span>
                  <span className="profile-last-login">
                    <Clock size={11} aria-hidden="true" />
                    {formatLastLogin()}
                  </span>
                </div>
              </div>
            </div>

            {/* Menu items */}
            <div className="profile-menu" role="none">
              <button
                role="menuitem"
                onClick={() => { setShowProfileMenu(false); navigate("/settings"); }}
                className="profile-menu-item"
              >
                <User size={16} aria-hidden="true" /><span>Profile</span>
              </button>
              <button
                role="menuitem"
                onClick={() => { setShowProfileMenu(false); navigate("/settings"); }}
                className="profile-menu-item"
              >
                <Settings size={16} aria-hidden="true" /><span>Settings</span>
              </button>
              <button
                role="menuitem"
                onClick={() => { setShowProfileMenu(false); setShowNotifications(true); }}
                className="profile-menu-item"
              >
                <Bell size={16} aria-hidden="true" /><span>Notifications</span>
              </button>
              <button
                role="menuitem"
                className="profile-menu-item"
              >
                <HelpCircle size={16} aria-hidden="true" /><span>Help &amp; docs</span>
              </button>
              <button
                role="menuitem"
                className="profile-menu-item"
              >
                <Keyboard size={16} aria-hidden="true" /><span>Keyboard shortcuts</span>
              </button>

              <div className="profile-menu-divider" role="separator" />

              <button
                role="menuitem"
                onClick={toggleTheme}
                className="profile-menu-item"
              >
                {theme === "dark"
                  ? <Sun size={16} aria-hidden="true" />
                  : <Moon size={16} aria-hidden="true" />
                }
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
              </button>

              <div className="profile-menu-divider" role="separator" />

              <button
                role="menuitem"
                onClick={handleLogout}
                className="profile-menu-item profile-menu-item-danger"
              >
                <LogOut size={16} aria-hidden="true" /><span>Log out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Panels */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
      <GlobalSearch
        isOpen={showGlobalSearch}
        onClose={() => setShowGlobalSearch(false)}
      />
    </header>
  );
}
