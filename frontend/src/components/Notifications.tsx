import { AppNotification } from "../types.js";
import { Info, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface NotificationsProps {
  notifications: AppNotification[];
  loading?: boolean;
  onDismiss?: (id: string) => void;
}

const getNotificationIcon = (type: AppNotification["type"]) => {
  switch (type) {
    case "info":
      return Info;
    case "success":
      return CheckCircle;
    case "warning":
      return AlertTriangle;
    case "error":
      return X;
    default:
      return Info;
  }
};

const getNotificationColor = (type: AppNotification["type"]) => {
  switch (type) {
    case "info":
      return "text-blue-500";
    case "success":
      return "text-green-500";
    case "warning":
      return "text-amber-500";
    case "error":
      return "text-red-500";
    default:
      return "text-gray-400";
  }
};

const getNotificationBg = (type: AppNotification["type"]) => {
  switch (type) {
    case "info":
      return "bg-blue-500/10 border-blue-500/20";
    case "success":
      return "bg-green-500/10 border-green-500/20";
    case "warning":
      return "bg-amber-500/10 border-amber-500/20";
    case "error":
      return "bg-red-500/10 border-red-500/20";
    default:
      return "bg-gray-500/10 border-gray-500/20";
  }
};

const formatRelativeTime = (timestamp: string) => {
  const date = new Date(timestamp);
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

export function Notifications({ notifications, loading, onDismiss }: NotificationsProps) {
  const navigate = useNavigate();

  const handleNotificationClick = (notification: AppNotification) => {
    if (notification.documentId) {
      navigate(`/documents/${notification.documentId}`);
    }
  };

  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Notifications</h3>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3 bg-[var(--bg-tertiary)] rounded-lg animate-pulse">
              <div className="h-4 bg-[var(--bg-secondary)] rounded w-3/4 mb-2" />
              <div className="h-3 bg-[var(--bg-secondary)] rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Notifications</h3>
        <div className="text-center py-8">
          <CheckCircle size={48} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)]">All caught up! No new notifications.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Notifications</h3>
        <span className="text-xs font-medium px-2 py-1 bg-blue-500/10 text-blue-500 rounded-full">
          {notifications.filter(n => !n.read).length} unread
        </span>
      </div>
      <div className="space-y-3">
        {notifications.map((notification) => {
          const Icon = getNotificationIcon(notification.type);
          const colorClass = getNotificationColor(notification.type);
          const bgClass = getNotificationBg(notification.type);
          
          return (
            <div
              key={notification.id}
              className={`p-3 rounded-lg border ${bgClass} ${!notification.read ? 'border-l-4 border-l-blue-500' : ''} cursor-pointer transition-all hover:opacity-80`}
              onClick={() => handleNotificationClick(notification)}
            >
              <div className="flex gap-3 items-start">
                <Icon size={18} className={colorClass} style={{ flexShrink: 0, marginTop: 2 }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {notification.title}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-[var(--text-muted)]">
                      {formatRelativeTime(notification.timestamp)}
                    </p>
                    {onDismiss && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(notification.id);
                        }}
                        className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        Dismiss
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
