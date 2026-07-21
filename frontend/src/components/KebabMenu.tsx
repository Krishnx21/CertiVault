import React, { useState, useRef, useEffect } from "react";
import { MoreVertical } from "lucide-react";
import { createPortal } from "react-dom";

interface MenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

interface KebabMenuProps {
  items: MenuItem[];
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
}

const KebabMenu: React.FC<KebabMenuProps> = ({ items, position = "bottom-right" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const getPositionStyles = () => {
    const baseStyles = "absolute z-50 min-w-[180px] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg shadow-xl py-1";
    
    switch (position) {
      case "bottom-right":
        return `${baseStyles} right-0 top-full mt-1`;
      case "bottom-left":
        return `${baseStyles} left-0 top-full mt-1`;
      case "top-right":
        return `${baseStyles} right-0 bottom-full mb-1`;
      case "top-left":
        return `${baseStyles} left-0 bottom-full mb-1`;
      default:
        return `${baseStyles} right-0 top-full mt-1`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = (index + 1) % items.length;
      const nextButton = menuRef.current?.querySelector(`[data-index="${nextIndex}"]`) as HTMLButtonElement;
      nextButton?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = (index - 1 + items.length) % items.length;
      const prevButton = menuRef.current?.querySelector(`[data-index="${prevIndex}"]`) as HTMLButtonElement;
      prevButton?.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      items[index].onClick();
      setIsOpen(false);
    }
  };

  const MenuContent = () => (
    <div className={getPositionStyles()} ref={menuRef} role="menu">
      {items.map((item, index) => (
        <button
          key={index}
          data-index={index}
          onClick={() => {
            if (!item.disabled) {
              item.onClick();
              setIsOpen(false);
            }
          }}
          disabled={item.disabled}
          className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left transition-colors ${
            item.danger
              ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          } ${item.disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          onKeyDown={(e) => handleKeyDown(e, index)}
          role="menuitem"
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div className="relative" ref={triggerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="icon-button"
        aria-label="More options"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <MoreVertical size={16} />
      </button>
      {isOpen && createPortal(<MenuContent />, document.body)}
    </div>
  );
};

export default KebabMenu;
