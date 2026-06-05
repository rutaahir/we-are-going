import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role = "member" | "community_admin" | "super_admin";
export type Plan = "Free" | "Basic" | "Pro" | "Enterprise";

export interface User {
  id: string;
  name: string;
  role: Role;
  email: string;
  avatar: string;
  communityName: string;
  communityId?: string | number;
  plan: Plan;
  planExpiry: string;
}

import { api } from "@/lib/api";

interface AuthCtx {
  user: User | null;
  login: (u: User) => void;
  loginWithApi: (username: string, password: string) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<User | null>;
}

const Ctx = createContext<AuthCtx>({ 
  user: null, 
  login: () => {}, 
  loginWithApi: async () => { throw new Error("Not implemented"); }, 
  logout: () => {},
  refreshUser: async () => null
});

const STORAGE = "wag_user";

export const DEMO_USERS: Record<Role, User> = {
  member: {
    id: "u1", name: "Rohit Patel", role: "member", email: "rohit@example.com",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
    communityName: "Rampara Ahir Samaj", plan: "Basic", planExpiry: "2026-09-15",
  },
  community_admin: {
    id: "u2", name: "Mehul Solanki", role: "community_admin", email: "mehul@samaj.org",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
    communityName: "Rajula Samaj Mandal", plan: "Pro", planExpiry: "2026-12-31",
  },
  super_admin: {
    id: "u3", name: "Admin Desai", role: "super_admin", email: "admin@wearegoing.in",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    communityName: "We Are Going Platform", plan: "Enterprise", planExpiry: "2027-12-31",
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    if (typeof window !== "undefined") {
      const raw = localStorage.getItem(STORAGE);
      if (raw) {
        try {
          return JSON.parse(raw);
        } catch (e) {}
      }
    }
    return null;
  });
  
  const login = (u: User) => { 
    localStorage.setItem(STORAGE, JSON.stringify(u)); 
    setUser(u); 
  };

  const loginWithApi = async (username: string, password_raw: string): Promise<User> => {
    const apiUser = await api.login(username, password_raw);
    const mappedUser: User = {
      id: String(apiUser.id),
      name: apiUser.name,
      role: apiUser.role as Role,
      email: apiUser.email,
      avatar: apiUser.avatar,
      communityName: apiUser.communityName,
      communityId: apiUser.communityId,
      plan: apiUser.plan as Plan,
      planExpiry: apiUser.planExpiry || "2027-12-31",
    };
    localStorage.setItem(STORAGE, JSON.stringify(mappedUser));
    setUser(mappedUser);
    return mappedUser;
  };
  
  const refreshUser = async (): Promise<User | null> => {
    try {
      const apiUser = await api.getCurrentUser();
      if (!apiUser) return null;
      const mappedUser: User = {
        id: String(apiUser.id),
        name: apiUser.name,
        role: apiUser.role as Role,
        email: apiUser.email,
        avatar: apiUser.avatar,
        communityName: apiUser.communityName,
        communityId: apiUser.communityId,
        plan: apiUser.plan as Plan,
        planExpiry: apiUser.planExpiry || "2027-12-31",
      };
      localStorage.setItem(STORAGE, JSON.stringify(mappedUser));
      setUser(mappedUser);
      return mappedUser;
    } catch (e) {
      console.error("Failed to refresh user", e);
      return null;
    }
  };
  
  const logout = () => { 
    localStorage.removeItem(STORAGE); 
    localStorage.removeItem("wag_token");
    localStorage.removeItem("wag_refresh");
    setUser(null); 
  };
  
  return <Ctx.Provider value={{ user, login, loginWithApi, logout, refreshUser }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);

