import { Activity } from "../types.js";
import { Upload, CheckCircle2, Star, Archive, Share2, Trash2, Clock } from "lucide-react";

interface ActivityTimelineProps {
  activities: Activity[];
  loading?: boolean;
}

const getActivityIcon = (type: Activity["type"]) => {
  switch (type) {
    case "upload":
      return Upload;
    case "verify":
      return CheckCircle2;
    case "favorite":
      return Star;
    case "archive":
      return Archive;
    case "share":
      return Share2;
    case "delete":
      return Trash2;
    default:
      return Clock;
  }
};

const getActivityColor = (type: Activity["type"]) => {
  switch (type) {
    case "upload":
      return "text-blue-500";
    case "verify":
      return "text-green-500";
    case "favorite":
      return "text-amber-500";
    case "archive":
      return "text-gray-500";
    case "share":
      return "text-violet-500";
    case "delete":
      return "text-red-500";
    default:
      return "text-gray-400";
  }
};

const getActivityBg = (type: Activity["type"]) => {
  switch (type) {
    case "upload":
      return "bg-blue-500/10";
    case "verify":
      return "bg-green-500/10";
    case "favorite":
      return "bg-amber-500/10";
    case "archive":
      return "bg-gray-500/10";
    case "share":
      return "bg-violet-500/10";
    case "delete":
      return "bg-red-500/10";
    default:
      return "bg-gray-500/10";
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

export function ActivityTimeline({ activities, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-10 h-10 bg-[var(--bg-tertiary)] rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-[var(--bg-tertiary)] rounded w-3/4 mb-2 animate-pulse" />
                <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/2 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h3>
        <div className="text-center py-8">
          <Clock size={48} className="mx-auto text-[var(--text-muted)] mb-3" />
          <p className="text-[var(--text-secondary)]">No recent activity</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity) => {
          const Icon = getActivityIcon(activity.type);
          const colorClass = getActivityColor(activity.type);
          const bgClass = getActivityBg(activity.type);
          
          return (
            <div key={activity.id} className="flex gap-3 items-start">
              <div className={`w-10 h-10 ${bgClass} rounded-full flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className={colorClass} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {activity.userName}
                </p>
                <p className="text-sm text-[var(--text-secondary)] truncate">
                  {activity.details || activity.type}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  {formatRelativeTime(activity.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
