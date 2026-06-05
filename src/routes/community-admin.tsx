import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useAuth } from "@/context/AuthContext";
import { DashboardSidebar, MobileBottomNav, MobileHeader, type SidebarItem } from "@/components/wag/Sidebar";
import { LayoutDashboard, Users, UserCog, UsersRound, Calendar, Megaphone, Image, HandHeart, Briefcase, Building2, Heart, FileBarChart, CreditCard, Settings } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api } from "@/lib/api";

export const Route = createFileRoute("/community-admin")({
  component: Layout,
});

const ITEMS: SidebarItem[] = [
  { to: "/community-admin", label: "Overview", icon: LayoutDashboard },
  { to: "/community-admin/members", label: "Members", icon: Users },
  { to: "/community-admin/committee", label: "Committee", icon: UserCog },
  { to: "/community-admin/families", label: "Families", icon: UsersRound },
  { to: "/community-admin/events", label: "Events", icon: Calendar },
  { to: "/community-admin/news", label: "News", icon: Megaphone },
  { to: "/community-admin/gallery", label: "Gallery", icon: Image },
  { to: "/community-admin/donations", label: "Donations", icon: HandHeart },
  { to: "/community-admin/jobs", label: "Jobs", icon: Briefcase },
  { to: "/community-admin/businesses", label: "Businesses", icon: Building2 },
  { to: "/community-admin/matrimony", label: "Matrimony", icon: Heart },
  { to: "/community-admin/reports", label: "Reports", icon: FileBarChart },
  { to: "/community-admin/plan", label: "My Plan", icon: CreditCard },
  { to: "/community-admin/settings", label: "Settings", icon: Settings },
];

function Layout() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (user.communityId) {
      api.getCommunities()
        .then(res => {
          const comm = (res || []).find((c: any) => String(c.id) === String(user.communityId));
          if (comm && (comm.type === "Super" || comm.type === "Super Community")) {
            setIsSuper(true);
          }
        })
        .catch(err => console.error("Error checking community type", err));
    }
  }, [user, navigate]);

  if (!user) return null;

  const items = [...ITEMS];
  if (isSuper) {
    // Insert Subsidiaries as second item (index 1)
    items.splice(1, 0, { to: "/community-admin/subsidiaries", label: "Subsidiaries", icon: Building2 });
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent w-full">
      <MobileHeader title="Samaj Admin" />
      <div className="flex flex-1 w-full">
        <DashboardSidebar items={items} title="Samaj Admin" />
        <div className="flex-1 min-w-0 pb-20 md:pb-0"><Outlet /></div>
      </div>
      <MobileBottomNav items={items} />
    </div>
  );
}
