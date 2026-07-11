import { useState } from "react";
import { Bell, ChevronDown, LogOut, Menu, Search, User, Settings } from "lucide-react";
import { useAuth } from "../contexts/AuthContext.js";

interface TopbarProps {
  search: string;
  setSearch: (search: string) => void;
  setMobileNav: (open: boolean) => void;
}

export function Topbar({ search, setSearch, setMobileNav }: TopbarProps) {
  const { user, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowProfileMenu(false);
  };

  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="topbar">
      <button className="icon-button menu-button" onClick={() => setMobileNav(true)}>
        <Menu />
      </button>
      <div className="global-search">
        <Search size={18} />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search documents, tags, or owners…"
        />
        <kbd>⌘ K</kbd>
      </div>
      <div className="top-actions">
        <button className="icon-button notification">
          <Bell size={19} />
          <i />
        </button>
        <div className="relative">
          <button
            className="profile"
            onClick={() => setShowProfileMenu(!showProfileMenu)}
          >
            <div className="avatar small">{getUserInitials()}</div>
            <span>{user?.name || "User"}</span>
            <ChevronDown size={15} />
          </button>
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">{user?.name || "User"}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={() => setShowProfileMenu(false)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <User size={16} />
                Profile
              </button>
              <button
                onClick={() => setShowProfileMenu(false)}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              >
                <Settings size={16} />
                Settings
              </button>
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
