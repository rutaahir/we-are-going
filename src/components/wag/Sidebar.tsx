"use client";
import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState, type ComponentType } from "react";
import { ChevronLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";

export interface SidebarItem { to: string; label: string; icon: ComponentType<{ className?: string }>; }

export function DashboardSidebar({ items, title }: { items: SidebarItem[]; title: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const path = useRouterState({ select: s => s.location.pathname });
  const { logout } = useAuth();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className="sticky top-0 h-screen bg-surface border-r border-warm overflow-hidden flex-shrink-0 hidden md:flex flex-col"
    >
      <div className="p-3 flex items-center justify-between border-b border-warm">
        {!collapsed && <span className="text-xs uppercase tracking-wider font-semibold text-warm-muted px-2">{title}</span>}
        <button onClick={() => setCollapsed(v => !v)} className="w-8 h-8 rounded-lg hover:bg-sand flex items-center justify-center">
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {items.map(it => {
          const active = path === it.to || (it.to !== "/dashboard" && it.to !== "/community-admin" && it.to !== "/admin" && path.startsWith(it.to));
          const Icon = it.icon;
          return (
            <Link key={it.to} to={it.to} className={cn(
              "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group",
              active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-sand",
              collapsed && "justify-center"
            )}>
              {active && <motion.span layoutId="sb-active" className="absolute left-0 top-1 bottom-1 w-1 rounded-r bg-primary" />}
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">{it.label}</motion.span>}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-2 border-t border-warm mt-auto">
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="truncate">Logout</motion.span>}
        </button>
      </div>
    </motion.aside>
  );
}

export function MobileBottomNav({ items }: { items: SidebarItem[] }) {
  const path = useRouterState({ select: s => s.location.pathname });
  const top = items.slice(0, 5);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface/95 backdrop-blur border-t border-warm z-30 flex">
      {top.map(it => {
        const active = path === it.to;
        const Icon = it.icon;
        return (
          <Link key={it.to} to={it.to} className={cn("flex-1 flex flex-col items-center gap-1 py-2 text-[10px]", active ? "text-primary" : "text-warm-muted")}>
            <Icon className="w-5 h-5" /><span className="truncate max-w-full px-1">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileHeader({ title }: { title: string }) {
  const { logout } = useAuth();
  return (
    <header className="md:hidden sticky top-0 inset-x-0 h-14 bg-surface/95 backdrop-blur border-b border-warm z-20 flex items-center justify-between px-4 w-full">
      <span className="font-display font-bold text-primary text-sm">{title}</span>
      <button
        onClick={logout}
        className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-600 flex items-center justify-center transition"
      >
        <LogOut className="w-4 h-4" />
      </button>
    </header>
  );
}
