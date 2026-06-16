import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar, MobileBottomNav, MobileHeader, type SidebarItem } from "@/components/wag/Sidebar";
import { LayoutDashboard, User, Users, Building2, Heart, Briefcase, Calendar, HandHeart, Bell, CreditCard, Settings, UsersRound, MessageSquare, Network, CalendarCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  component: DashLayout,
});

const ITEMS: SidebarItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/hierarchy", label: "Hierarchy", icon: Network },
  { to: "/dashboard/profile", label: "My Profile", icon: User },
  { to: "/dashboard/family", label: "My Family", icon: UsersRound },
  { to: "/dashboard/directory", label: "Member Directory", icon: Users },
  { to: "/dashboard/business", label: "Business Directory", icon: Building2 },
  { to: "/dashboard/matrimony", label: "Matrimony", icon: Heart },
  { to: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { to: "/dashboard/events", label: "Events", icon: Calendar },
  { to: "/dashboard/donations", label: "Donations", icon: HandHeart },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/messages", label: "Messages", icon: MessageSquare },
  { to: "/dashboard/plan", label: "My Plan", icon: CreditCard },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function DashLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = async () => {
    try {
      const res = await api.getNotifications();
      if (res) {
        const count = res.filter((n: any) => !n.is_read).length;
        setUnreadCount(count);
      }
    } catch (e) {
      console.warn("Failed to fetch notifications unread count:", e);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUnreadCount();

    const handleUpdate = () => {
      fetchUnreadCount();
    };
    window.addEventListener("notifications-updated", handleUpdate);
    const interval = setInterval(fetchUnreadCount, 15000); // Poll every 15s

    return () => {
      window.removeEventListener("notifications-updated", handleUpdate);
      clearInterval(interval);
    };
  }, [user]);

  useEffect(() => { if (!user) navigate({ to: "/login" }); }, [user, navigate]);
  if (!user) return null;

  const updatedItems = ITEMS.map(item => {
    if (item.to === "/dashboard/notifications") {
      return { ...item, badge: unreadCount };
    }
    return item;
  });

  return (
    <div className="flex flex-col min-h-screen bg-transparent w-full">
      <MobileHeader title="Member Panel" items={updatedItems} />
      <div className="flex flex-1 w-full">
        <DashboardSidebar items={updatedItems} title="Member" />
        <div className="flex-1 min-w-0 pb-6 md:pb-0"><Outlet /></div>
      </div>
    </div>
  );
}
