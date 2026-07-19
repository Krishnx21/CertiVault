import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Check,
  X,
  Trash2,
  CheckCheck,
  Upload,
  ShieldCheck,
  ShieldAlert,
  UserPlus,
  AlertTriangle,
  Share2,
  Loader2,
} from "lucide-react";
import { api } from "../api.js";
import { Notification } from "../types.js";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
      loadUnreadCount();
    }
  }, [isOpen, filter]);

  useEffect(() => {
    let pollInterval: number;
    if (isOpen) {
      pollInterval = window.setInterval(() => {
        loadUnreadCount();
      }, 30000); // Poll every 30 seconds
    }
    return () => {
      if (pollInterval) window.clearInterval(pollInterval);
    };
  }, [isOpen]);

  const loadNotifications = async (pageNum = 1) => {
    if (pageNum === 1) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await api.getNotifications(
        pageNum,
        20,
        filter === "unread"
      );
      
      if (pageNum === 1) {
        setNotifications(response.notifications);
      } else {
        setNotifications([...notifications, ...response.notifications]);
      }
      
      setPage(response.page);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.getUnreadCount();
      setUnreadCount(response.count);
    } catch (error) {
      console.error("Failed to load unread count:", error);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollHeight - scrollTop <= clientHeight + 100 && !isLoadingMore && page < totalPages) {
      loadNotifications(page + 1);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await api.markAsRead(notificationId);
      setNotifications(
        notifications.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllAsRead();
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await api.deleteNotification(notificationId);
      setNotifications(notifications.filter((n) => n._id !== notificationId));
      loadUnreadCount();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const deleteReadNotifications = async () => {
    try {
      await api.deleteReadNotifications();
      setNotifications(notifications.filter((n) => !n.isRead));
      loadUnreadCount();
    } catch (error) {
      console.error("Failed to delete read notifications:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "upload_completed":
        return <Upload size={20} className="text-green-500" />;
      case "verification_completed":
      case "document_verified":
        return <ShieldCheck size={20} className="text-green-500" />;
      case "verification_rejected":
        return <ShieldAlert size={20} className="text-red-500" />;
      case "share_accepted":
        return <Check size={20} className="text-green-500" />;
      case "share_revoked":
        return <X size={20} className="text-red-500" />;
      case "new_member":
        return <UserPlus size={20} className="text-blue-500" />;
      case "storage_warning":
        return <AlertTriangle size={20} className="text-amber-500" />;
      case "document_shared":
        return <Share2 size={20} className="text-purple-500" />;
      default:
        return <Bell size={20} className="text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    if (notification.data?.actionUrl) {
      navigate(notification.data.actionUrl);
      onClose();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="notification-backdrop" onClick={onClose}>
      <div
        className="notification-center"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
        onScroll={handleScroll}
      >
        <div className="notification-header">
          <div className="notification-header-left">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
          <div className="notification-header-right">
            <button
              className="notification-filter-btn"
              onClick={() => setFilter(filter === "all" ? "unread" : "all")}
            >
              {filter === "all" ? "All" : "Unread"}
            </button>
            <button className="icon-button" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="notification-actions">
          {unreadCount > 0 && (
            <button
              className="notification-action-btn"
              onClick={markAllAsRead}
            >
              <CheckCheck size={16} />
              Mark all as read
            </button>
          )}
          {notifications.some((n) => n.isRead) && (
            <button
              className="notification-action-btn"
              onClick={deleteReadNotifications}
            >
              <Trash2 size={16} />
              Delete read
            </button>
          )}
        </div>

        <div className="notification-list">
          {isLoading && page === 1 ? (
            <div className="notification-loading">
              <Loader2 size={24} className="animate-spin" />
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <Bell size={48} className="text-[var(--text-muted)]" />
              <p>No notifications</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.isRead ? "unread" : ""}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatDate(notification.createdAt)}</div>
                </div>
                <div className="notification-actions-item">
                  {!notification.isRead && (
                    <button
                      className="icon-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAsRead(notification._id);
                      }}
                      title="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                  <button
                    className="icon-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification._id);
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}

          {isLoadingMore && (
            <div className="notification-loading-more">
              <Loader2 size={20} className="animate-spin" />
              <span>Loading more...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
