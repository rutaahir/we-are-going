import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckCircle, Cake, Briefcase, Calendar, Bell, Info, Loader2, Trash2 } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";
import { api } from "@/lib/api";
import { NOTIFICATIONS } from "@/data/mock";

const ICONS: any = { 
  approval: CheckCircle, 
  event: Calendar, 
  birthday: Cake, 
  job: Briefcase, 
  info: Info 
};

const COLOR_MAP: Record<string, string> = {
  approval: "emerald",
  event: "blue",
  birthday: "pink",
  job: "amber",
  info: "slate"
};

const getTypeKey = (type: string) => {
  if (!type) return "info";
  const t = type.toLowerCase();
  if (t === "approval" || t === "community_registration" || t === "rejection") return "approval";
  if (t === "event") return "event";
  if (t === "birthday") return "birthday";
  if (t.includes("job")) return "job";
  return "info";
};

export const Route = createFileRoute("/dashboard/notifications")({
  component: NotificationsPage,
});

function NotificationsPage() {
  const [tab, setTab] = useState<string>("All");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);

  const tabs = ["All", "Approvals", "Events", "Birthdays", "Jobs"];

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      if (res && res.length > 0) {
        // Map backend notifications to UI format
        const mapped = res.map((n: any) => ({
          id: n.id,
          title: n.title,
          desc: n.message,
          type: getTypeKey(n.notification_type),
          read: n.is_read,
          time: new Date(n.created_at).toLocaleDateString(undefined, {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
          }),
          color: COLOR_MAP[getTypeKey(n.notification_type)] || "slate"
        }));
        setNotifications(mapped);
      } else {
        // Fallback to mock data if backend has no records
        const fallback = NOTIFICATIONS.map((n: any) => ({
          ...n,
          color: COLOR_MAP[n.type] || "slate"
        }));
        setNotifications(fallback);
      }
    } catch (e) {
      console.error("Failed to load notifications:", e);
      // Fallback to mock data on error
      const fallback = NOTIFICATIONS.map((n: any) => ({
        ...n,
        color: COLOR_MAP[n.type] || "slate"
      }));
      setNotifications(fallback);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadNotifications();
  }, []);
  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await api.markAllNotificationsRead();
      await loadNotifications();
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (e) {
      console.error("Failed to mark notifications as read:", e);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleDeleteNotification = async (id: any) => {
    try {
      // Optimistic update
      setNotifications(prev => prev.filter(n => n.id !== id));
      await api.deleteNotification(id);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (e) {
      console.error("Failed to delete notification:", e);
      // Revert/reload on error
      loadNotifications();
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?")) return;
    setDeletingAll(true);
    try {
      await api.deleteAllNotifications();
      setNotifications([]);
      window.dispatchEvent(new CustomEvent("notifications-updated"));
    } catch (e) {
      console.error("Failed to delete all notifications:", e);
      loadNotifications();
    } finally {
      setDeletingAll(false);
    }
  };
  const filteredList = notifications.filter(n => {
    if (tab === "All") return true;
    if (tab === "Approvals") return n.type === "approval";
    if (tab === "Events") return n.type === "event";
    if (tab === "Birthdays") return n.type === "birthday";
    if (tab === "Jobs") return n.type === "job";
    return true;
  });

  return (
    <PageWrap 
      title="Notifications" 
      action={
        <div className="flex gap-2">
          <button 
            onClick={handleMarkAllRead} 
            disabled={markingRead || notifications.every(n => n.read)}
            className="px-4 py-2 rounded-xl border border-warm text-xs font-bold bg-surface hover:bg-surface-hover transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {markingRead && <Loader2 className="w-3 animate-spin text-warm-muted" />}
            Mark all read
          </button>
          <button 
            onClick={handleDeleteAll} 
            disabled={deletingAll || notifications.length === 0}
            className="px-4 py-2 rounded-xl border border-red-200 text-xs font-bold bg-red-50 text-red-600 hover:bg-red-100 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {deletingAll && <Loader2 className="w-3 animate-spin text-red-600" />}
            <Trash2 className="w-3 h-3 text-red-500" />
            Delete all
          </button>
        </div>
      }
    >
      <div className="flex gap-2 border-b border-warm mb-6 overflow-x-auto">
        {tabs.map(t => (
          <button 
            key={t} 
            onClick={() => setTab(t)} 
            className={`px-4 py-2 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
              tab === t ? "border-primary text-primary" : "border-transparent text-warm-muted"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {filteredList.map(n => { 
            const Icon = ICONS[n.type] || Info; 
            const colorClass = n.color || "slate";
            
            // HSL/tailwind styling tailored to match beautiful and premium aesthetics
            return (
              <AnimatedCard 
                key={n.id} 
                className={`p-4 flex items-start gap-4 transition-all relative group ${
                  !n.read ? "bg-white shadow-sm border-l-4 border-l-primary" : "bg-white/70 opacity-80"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-${colorClass}-50 text-${colorClass}-600 flex items-center justify-center flex-shrink-0 border border-${colorClass}-100`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className={`font-ui font-semibold text-sm ${!n.read ? "text-slate-800" : "text-slate-600"}`}>
                      {n.title}
                    </h3>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-warm-muted mt-1 leading-relaxed">{n.desc}</p>
                  <div className="text-[10px] text-warm-muted mt-2 font-medium">{n.time}</div>
                </div>
                <div className="flex-shrink-0 flex items-center self-center md:opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleDeleteNotification(n.id)}
                    className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </AnimatedCard>
            ); 
          })}
          {filteredList.length === 0 && (
            <div className="text-center py-16 text-warm-muted text-sm bg-white/40 rounded-2xl border border-warm/40">
              No notifications found in this category.
            </div>
          )}
        </div>
      )}
    </PageWrap>
  );
}
