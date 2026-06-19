// Mock data for WE ARE UNITED - Cleaned up to delete all dummy data as requested.

export const COMMUNITIES: any[] = [];
export const MEMBERS: any[] = [];
export const EVENTS: any[] = [];
export const JOBS: any[] = [];
export const BUSINESSES: any[] = [];
export const MATRIMONY: any[] = [];
export const DONATIONS: any[] = [];
export const CAMPAIGNS: any[] = [];
export const NEWS: any[] = [];
export const COMMITTEE: any[] = [];
export const FAMILIES: any[] = [];
export const TRANSACTIONS: any[] = [];
export const COUPONS: any[] = [];
export const ADVERTISEMENTS: any[] = [];
export const NOTIFICATIONS: any[] = [];

const ALL_MODULES = ["Member Management", "Committee Management", "Family Management", "Events", "News & Announcements", "Gallery", "Matrimony", "Job Portal", "Business Directory", "Donations", "Reports & Analytics", "API Access", "Priority Support"];

const buildAccess = (allowed: string[]) =>
  Object.fromEntries(ALL_MODULES.map(m => [m, { view: allowed.includes(m), create: allowed.includes(m) && allowed.length > 4, edit: allowed.includes(m) && allowed.length > 4, delete: allowed.length > 8 }]));

export const PLANS = [
  { id: "p0", name: "Free", price: { monthly: 0, quarterly: 0, yearly: 0 }, memberLimit: 100, storage: "1 GB", color: "gray", highlight: null, active: true, modules: buildAccess(["Member Management", "Events", "News & Announcements"]), description: "Get started with basic community features." },
  { id: "p1", name: "Basic", price: { monthly: 999, quarterly: 2799, yearly: 9999 }, memberLimit: 500, storage: "10 GB", color: "blue", highlight: null, active: true, modules: buildAccess(["Member Management", "Committee Management", "Family Management", "Events", "News & Announcements", "Donations"]), description: "Essential tools for growing samaj communities." },
  { id: "p2", name: "Pro", price: { monthly: 2499, quarterly: 6999, yearly: 24999 }, memberLimit: 2000, storage: "50 GB", color: "gold", highlight: "Most Popular", active: true, modules: buildAccess(["Member Management", "Committee Management", "Family Management", "Events", "News & Announcements", "Gallery", "Matrimony", "Job Portal", "Business Directory", "Donations", "Reports & Analytics"]), description: "Complete ERP + social network for established communities." },
  { id: "p3", name: "Enterprise", price: { monthly: 4999, quarterly: 13999, yearly: 49999 }, memberLimit: 99999, storage: "Unlimited", color: "sapphire", highlight: "Best Value", active: true, modules: buildAccess(ALL_MODULES), description: "All features unlocked, priority support, API access." },
];
