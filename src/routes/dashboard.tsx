import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar, MobileBottomNav, MobileHeader, type SidebarItem } from "@/components/wag/Sidebar";
import { LayoutDashboard, User, Users, Building2, Heart, Briefcase, Calendar, HandHeart, Bell, CreditCard, Settings, UsersRound } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/dashboard")({
  component: DashLayout,
});

const ITEMS: SidebarItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/profile", label: "My Profile", icon: User },
  { to: "/dashboard/family", label: "My Family", icon: UsersRound },
  { to: "/dashboard/directory", label: "Member Directory", icon: Users },
  { to: "/dashboard/business", label: "Business Directory", icon: Building2 },
  { to: "/dashboard/matrimony", label: "Matrimony", icon: Heart },
  { to: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
  { to: "/dashboard/events", label: "Events", icon: Calendar },
  { to: "/dashboard/donations", label: "Donations", icon: HandHeart },
  { to: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { to: "/dashboard/plan", label: "My Plan", icon: CreditCard },
  { to: "/dashboard/settings", label: "Settings", icon: Settings },
];

function DashLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!user) navigate({ to: "/login" }); }, [user, navigate]);
  if (!user) return null;
  return (
    <div className="flex flex-col min-h-screen bg-transparent w-full">
      <MobileHeader title="Member Panel" />
      <div className="flex flex-1 w-full">
        <DashboardSidebar items={ITEMS} title="Member" />
        <div className="flex-1 min-w-0 pb-20 md:pb-0"><Outlet /></div>
      </div>
      <MobileBottomNav items={ITEMS} />
    </div>
  );
}
