import React from "react";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";

interface TopbarProps {
  search: string;
  setSearch: (search: string) => void;
  setMobileNav: (open: boolean) => void;
}

export function Topbar({ search, setSearch, setMobileNav }: TopbarProps) {
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
        <button className="profile">
          <div className="avatar small">KK</div>
          <span>Krishna</span>
          <ChevronDown size={15} />
        </button>
      </div>
    </header>
  );
}
