import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Bell, Calendar, Users, Heart, Cake, Briefcase, MapPin, Building2, 
  Search, ChevronDown, LogOut, Award, Clock, ArrowRight, Star, 
  Bookmark, Plus, UserPlus, Gift, Info, CheckCircle2, ChevronRight,
  TrendingUp, Activity, Sparkles, Send
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, PlanBadge, ProgressRing, StatCard, Reveal } from "@/components/wag/primitives";
import { AdBanner } from "@/components/wag/AdBanner";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { motion, AnimatePresence } from "framer-motion";

// Mock data to fallback on if DB is empty
const MOCK_INSIGHTS_DATA = [
  { name: "1 May", value: 60 },
  { name: "8 May", value: 120 },
  { name: "15 May", value: 80 },
  { name: "22 May", value: 110 },
  { name: "29 May", value: 150 },
];

export const Route = createFileRoute("/dashboard/")({
  component: () => {
    const { user, refreshUser } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [birthdays, setBirthdays] = useState<any[]>([]);
    const [news, setNews] = useState<any[]>([]);
    const [jobs, setJobs] = useState<any[]>([]);
    const [matrimony, setMatrimony] = useState<any[]>([]);
    const [membersList, setMembersList] = useState<any[]>([]);
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [stats, setStats] = useState({ members: 5, events: 1 });
    const [loading, setLoading] = useState(true);

    const [activeAnnouncement, setActiveAnnouncement] = useState(0);
    const [activeEvent, setActiveEvent] = useState(0);
    const [activeJob, setActiveJob] = useState(0);
    const [activeMatrimony, setActiveMatrimony] = useState(0);

    // Auto-advance timers for modules
    useEffect(() => {
      const interval = setInterval(() => {
        const total = news.length || 2;
        setActiveAnnouncement((prev) => (prev + 1) % total);
      }, 4000);
      return () => clearInterval(interval);
    }, [news.length]);

    useEffect(() => {
      const interval = setInterval(() => {
        const total = events.length || 1;
        setActiveEvent((prev) => (prev + 1) % total);
      }, 5000);
      return () => clearInterval(interval);
    }, [events.length]);

    useEffect(() => {
      const interval = setInterval(() => {
        const total = jobs.length || 3;
        setActiveJob((prev) => (prev + 1) % total);
      }, 6000);
      return () => clearInterval(interval);
    }, [jobs.length]);

    useEffect(() => {
      const interval = setInterval(() => {
        const total = matrimony.length || 1;
        setActiveMatrimony((prev) => (prev + 1) % total);
      }, 7000);
      return () => clearInterval(interval);
    }, [matrimony.length]);

    // Live backend greeting based on time of day
    const getGreeting = () => {
      const hrs = new Date().getHours();
      if (hrs < 12) return "Good Morning";
      if (hrs < 18) return "Good Afternoon";
      return "Good Evening";
    };

    useEffect(() => {
      refreshUser();
      const handleUpdate = () => {
        refreshUser();
      };
      window.addEventListener("community-updated", handleUpdate);
      return () => window.removeEventListener("community-updated", handleUpdate);
    }, [refreshUser]);

    useEffect(() => {
      const fetchData = async () => {
        if (!user) return;
        
        // Show spinner on initial load only
        const isFirstLoad = events.length === 0 && news.length === 0;
        if (isFirstLoad) {
          setLoading(true);
        }

        try {
          const commId = user.communityId;
          const ancestors = commId ? await api.getAncestorCommunityIds(commId) : [];
          const filterQuery = ancestors.join(",");

          // 1. Fetch Stats
          let totalMembers = 0;
          let totalEvents = 0;
          for (const cId of ancestors) {
            try {
              const s = await api.getCommunityStats(String(cId));
              totalMembers += s.members || 0;
              totalEvents += s.events || 0;
            } catch (e) { console.warn(e); }
          }
          setStats({ members: totalMembers || 5, events: totalEvents || 1 });

          // 2. Fetch Events
          try {
            const allEvts = await api.getEvents({ community_id: filterQuery });
            const filteredEvts = allEvts.filter(e => {
              return e.status === "Upcoming" || e.status === "Registration Open" || e.status === "Published" || e.status === "Ongoing";
            }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setEvents(filteredEvts);
          } catch (e) { console.warn(e); }

          // 3. Fetch News
          try {
            const allNews = await api.getNews({ community_id: filterQuery });
            const sortedNews = allNews.sort((a, b) => new Date(b.date || b.created_at).getTime() - new Date(a.date || a.created_at).getTime());
            setNews(sortedNews);
          } catch (e) { console.warn(e); }

          // 4. Fetch Members for Birthdays and Recent Activity
          try {
            const memberList = await api.getMembers({ community_id: filterQuery });
            setMembersList(memberList);
            
            const upcomingBirthdays = memberList.filter(m => {
              if (!m.birthdate) return false;
              
              // Safe split of YYYY-MM-DD or DD-MM-YYYY
              const parts = m.birthdate.split(/[-/]/);
              if (parts.length < 3) return false;
              
              let birthMonth = 0;
              let birthDay = 0;
              
              if (parts[0].length === 4) {
                // YYYY-MM-DD
                birthMonth = parseInt(parts[1], 10) - 1; // 0-indexed
                birthDay = parseInt(parts[2], 10);
              } else if (parts[2].length === 4) {
                // DD-MM-YYYY
                birthMonth = parseInt(parts[1], 10) - 1;
                birthDay = parseInt(parts[0], 10);
              } else {
                return false;
              }
              
              const today = new Date();
              const currentYear = today.getFullYear();
              
              // Birthday in current year
              const bdayThisYear = new Date(currentYear, birthMonth, birthDay);
              bdayThisYear.setHours(0, 0, 0, 0);
              
              // Birthday in next year (for late December to January transition)
              const bdayNextYear = new Date(currentYear + 1, birthMonth, birthDay);
              bdayNextYear.setHours(0, 0, 0, 0);
              
              const todayStart = new Date(today);
              todayStart.setHours(0, 0, 0, 0);
              
              const diff1 = bdayThisYear.getTime() - todayStart.getTime();
              const diffDays1 = Math.round(diff1 / (1000 * 60 * 60 * 24));
              
              const diff2 = bdayNextYear.getTime() - todayStart.getTime();
              const diffDays2 = Math.round(diff2 / (1000 * 60 * 60 * 24));
              
              // Check if the birthday is today or within the next 7 days
              return (diffDays1 >= 0 && diffDays1 <= 7) || (diffDays2 >= 0 && diffDays2 <= 7);
            });

            // Sort birthdays by how close they are
            upcomingBirthdays.sort((a, b) => {
              const getDaysUntilBirthday = (birthdateStr: string) => {
                const parts = birthdateStr.split(/[-/]/);
                const birthMonth = parts[0].length === 4 ? parseInt(parts[1], 10) - 1 : parseInt(parts[1], 10) - 1;
                const birthDay = parts[0].length === 4 ? parseInt(parts[2], 10) : parseInt(parts[0], 10);
                
                const today = new Date();
                const currentYear = today.getFullYear();
                const bdayThisYear = new Date(currentYear, birthMonth, birthDay);
                bdayThisYear.setHours(0, 0, 0, 0);
                const todayStart = new Date(today);
                todayStart.setHours(0, 0, 0, 0);
                
                let diffDays = Math.round((bdayThisYear.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) {
                  const bdayNextYear = new Date(currentYear + 1, birthMonth, birthDay);
                  bdayNextYear.setHours(0, 0, 0, 0);
                  diffDays = Math.round((bdayNextYear.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
                }
                return diffDays;
              };
              return getDaysUntilBirthday(a.birthdate) - getDaysUntilBirthday(b.birthdate);
            });

            setBirthdays(upcomingBirthdays);
          } catch (e) { console.warn(e); }

          // 5. Fetch Jobs
          try {
            const allJobs = await api.getJobs({ community_id: filterQuery });
            setJobs(allJobs);
          } catch (e) { console.warn(e); }

          // 6. Fetch Matrimony Suggestions
          try {
            const allProfiles = await api.getMatrimonyProfiles({ community_id: filterQuery });
            const oppositeGender = user.gender === "Male" ? "Bride" : user.gender === "Female" ? "Groom" : "";
            
            const filteredProfiles = allProfiles.filter(p => {
              const isNotSelf = String(p.user) !== String(user.id);
              let isGenderMatch = true;
              if (oppositeGender) {
                isGenderMatch = p.gender === oppositeGender;
              }
              return isNotSelf && isGenderMatch;
            });
            setMatrimony(filteredProfiles);
          } catch (e) { console.warn(e); }

          // 7. Fetch Businesses
          try {
            const allBusinesses = await api.getBusinesses({ community_id: filterQuery });
            const visible = (allBusinesses || []).filter((b: any) => {
              if (b.status === "REJECTED" || b.status === "SUSPENDED" || b.status === "PENDING") return false;
              return b.verified || b.status === "VERIFIED" || b.status === undefined;
            });
            setBusinesses(visible);
          } catch (e) { console.warn(e); }

        } catch (e) {
          console.error("Error fetching dashboard data:", e);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }, [user?.id, user?.communityId, user?.parentCommunityId, user?.gender]);

    const handleWish = (name: string) => {
      toast.success(`Sent birthday wishes to ${name}! 🥳🎉`);
    };

    const handleShowInterest = async (profileId: string | number, name: string) => {
      try {
        await api.showInterest(profileId);
        toast.success(`Interest request sent to ${name}!`);
      } catch (e: any) {
        toast.error(e.message || `Failed to send interest request to ${name}`);
      }
    };

    // Dynamic Activities Feed
    const getDynamicActivities = () => {
      const feed: any[] = [];

      // 1. Birthdays
      birthdays.slice(0, 2).forEach(b => {
        feed.push({
          title: `${b.name} has a birthday this week`,
          time: "Birthday week",
          emoji: "🎂"
        });
      });

      // 2. Jobs
      const sortedJobs = [...jobs].sort((a, b) => (b.id || 0) - (a.id || 0));
      sortedJobs.slice(0, 2).forEach(j => {
        feed.push({
          title: `New Job: ${j.role} at ${j.company}`,
          time: "Job recommendation",
          emoji: "💼"
        });
      });

      // 3. Events
      events.slice(0, 2).forEach(e => {
        feed.push({
          title: `Upcoming Event: ${e.title}`,
          time: new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
          emoji: "📅"
        });
      });

      // 4. News
      news.slice(0, 2).forEach(n => {
        feed.push({
          title: `Announcement: ${n.title}`,
          time: "Announcement",
          emoji: "📢"
        });
      });

      if (feed.length === 0) {
        return [
          { title: "Welcome to our community portal!", time: "Today", emoji: "✨" },
          { title: "Complete your profile to see matches", time: "Today", emoji: "👤" },
          { title: "New donation campaigns are live", time: "Yesterday", emoji: "🪙" }
        ];
      }

      return feed;
    };

    // Dynamic member growth insights data
    const getDynamicInsights = () => {
      const total = stats.members || 5;
      return [
        { name: "Week 1", value: Math.max(1, Math.round(total * 0.35)) },
        { name: "Week 2", value: Math.max(2, Math.round(total * 0.55)) },
        { name: "Week 3", value: Math.max(3, Math.round(total * 0.75)) },
        { name: "Week 4", value: total },
      ];
    };

    // Selected Upcoming Event (defaults to first event or mock)
    const featuredEvent = events[0] || {
      id: "mock-ev",
      title: "Raksha Bandhan Celebration",
      date: "2024-06-15",
      start_time: "6:00 PM",
      venue: "Surat Community Hall",
      img: "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=600&auto=format&fit=crop",
      attendees: 116
    };

    if (loading) {
      return (
        <PageWrap title="Loading your Dashboard..." desc="Gathering community updates...">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-warm-muted text-sm mt-4 text-center">Syncing events, news, announcements, and recommendations...</p>
          </div>
        </PageWrap>
      );
    }

    return (
      <div className="p-6 lg:p-8 space-y-8 bg-[#FAFAF9] min-h-screen">
        
        {/* 1. Hero Banner Layout Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-50 via-orange-100/40 to-amber-50 border border-warm/40 p-6 lg:p-8 shadow-sm">
          {/* Background cityscape subtle texture overlay */}
          <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-cover bg-right" 
               style={{ backgroundImage: `url('https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=1200&auto=format&fit=crop')` }} />
          
          <div className="relative z-10 grid lg:grid-cols-3 gap-8 items-center">
            {/* Left part: Greetings, Subtitles & Stats Row */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <span className="text-xs font-bold text-[#FF6A13]/90 tracking-wider uppercase">{getGreeting()},</span>
                <h1 className="font-ui font-extrabold text-3xl lg:text-4xl text-[#1F2937] mt-1 leading-tight flex items-center gap-2">
                  {user?.name.split(" ")[0]} <span className="animate-bounce">👋</span>
                </h1>
                <p className="text-[#6B7280] text-sm mt-1">
                  Welcome back to {user?.communityName || "Surat Community"}
                </p>

                {/* Badges tag row */}
                <div className="flex flex-wrap gap-2.5 mt-3.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-warm/60 text-[10px] font-bold text-[#4B5563]">
                    <MapPin className="w-3.5 h-3.5 text-[#FF6A13]" /> Surat, Gujarat
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-full border border-warm/60 text-[10px] font-bold text-[#4B5563]">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Member Since 2024
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-[#FF6A13]/10 to-gold/10 rounded-full border border-[#FF6A13]/25 text-[10px] font-extrabold text-[#FF6A13]">
                    <Sparkles className="w-3.5 h-3.5" /> Premium Member
                  </div>
                </div>
              </div>

              {/* Stat row summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-2xl border border-warm/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FF6A13]/10 text-[#FF6A13] flex items-center justify-center text-xs">🏘️</div>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Total Members</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black font-ui text-[#1F2937]">{stats.members}</span>
                    <span className="text-[9px] font-bold text-teal block mt-0.5">+2 this week ↑</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-warm/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs">📅</div>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Upcoming Events</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black font-ui text-[#1F2937]">{events.length || stats.events}</span>
                    <span className="text-[9px] font-bold text-warm-muted block mt-0.5">This Month</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-warm/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal/10 text-teal flex items-center justify-center text-xs">📢</div>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Announcements</span>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl font-black font-ui text-[#1F2937]">{news.length || 2}</span>
                    <span className="text-[9px] font-bold text-orange-500 block mt-0.5">Unread</span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-warm/60 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-gold/10 text-gold flex items-center justify-center text-xs">⚡</div>
                    <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Profile Complete</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-1">
                    <div>
                      <span className="text-2xl font-black font-ui text-[#1F2937]">78%</span>
                      <span className="text-[9px] font-bold text-gold block mt-0.5">Keep going!</span>
                    </div>
                    <div className="w-8 h-8 flex-shrink-0">
                      <ProgressRing value={78} size={32} stroke={3} label="" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right part: Featured Event card */}
            <div className="relative rounded-2xl overflow-hidden bg-cover bg-center border border-warm shadow-md h-52 flex flex-col justify-between p-4.5 text-white"
                 style={{ backgroundImage: `linear-gradient(to top, rgba(0, 0, 0, 0.9) 35%, rgba(0, 0, 0, 0.4) 70%, rgba(0,0,0,0.1)), url('${featuredEvent.img || featuredEvent.img_url || "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=600&auto=format&fit=crop"}')` }}>
              <div className="flex justify-between items-start">
                <span className="bg-[#FF6A13] text-white text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" /> Upcoming Event
                </span>
              </div>
              
              <div className="space-y-2.5">
                <div>
                  <h3 className="font-ui font-bold text-base leading-snug line-clamp-1">{featuredEvent.title}</h3>
                  <p className="text-[10px] text-white/80 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#FF8C37]" /> {new Date(featuredEvent.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} • {featuredEvent.start_time || "6:00 PM"}
                  </p>
                  <p className="text-[10px] text-white/80 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal" /> {featuredEvent.venue}
                  </p>
                </div>

                {/* Avatar checklist & register button */}
                <div className="flex items-center justify-between border-t border-white/20 pt-3">
                  <div className="flex items-center">
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <img className="inline-block h-5 w-5 rounded-full ring-2 ring-black" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100" alt="" />
                      <img className="inline-block h-5 w-5 rounded-full ring-2 ring-black" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100" alt="" />
                      <img className="inline-block h-5 w-5 rounded-full ring-2 ring-black" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100" alt="" />
                    </div>
                    <span className="text-[9px] text-white/80 font-bold ml-2">+{featuredEvent.attendees || 116}</span>
                  </div>
                  <Link to="/dashboard/events" className="px-3.5 py-1.5 bg-[#FF6A13] hover:bg-[#FF8C37] rounded-lg text-[10px] font-bold shadow-sm transition">
                    Register Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Banner advertisement slider */}
        <AdBanner slot="Hero Banner" />

        {/* 2. Quick Actions Shortcuts grid row */}
        <div className="space-y-3">
          <h2 className="font-ui font-extrabold text-sm text-[#374151]">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {[
              { label: "Find Members", to: "/dashboard/directory", emoji: "👥", bg: "bg-orange-50 border-orange-100 text-[#FF6A13]" },
              { label: "Post Business", to: "/dashboard/business", emoji: "💼", bg: "bg-amber-50 border-amber-100 text-gold" },
              { label: "Apply Job", to: "/dashboard/jobs", emoji: "📄", bg: "bg-purple-50 border-purple-100 text-purple-600" },
              { label: "Find Match", to: "/dashboard/matrimony", emoji: "💖", bg: "bg-pink-50 border-pink-100 text-pink-600" },
              { label: "Register Event", to: "/dashboard/events", emoji: "📅", bg: "bg-blue-50 border-blue-100 text-blue-600" },
              { label: "Donate", to: "/dashboard/donations", emoji: "🪙", bg: "bg-green-50 border-green-100 text-emerald-600" },
              { label: "My Family", to: "/dashboard/family", emoji: "👨‍👩‍👧‍👦", bg: "bg-indigo-50 border-indigo-100 text-indigo-600" },
              { label: "My Profile", to: "/dashboard/profile", emoji: "👤", bg: "bg-yellow-50 border-yellow-100 text-yellow-600" },
            ].map((act, i) => (
              <Link 
                key={i} 
                to={act.to}
                className="flex items-center gap-2 p-3 bg-white border border-warm/60 rounded-2xl hover:shadow-md hover:border-[#FF6A13]/40 hover:scale-[1.02] transition duration-200 select-none text-left"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${act.bg.split(" ")[0]} ${act.bg.split(" ")[1]}`}>
                  {act.emoji}
                </div>
                <span className="text-[10px] font-bold text-[#4B5563] leading-snug">{act.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 3. Main content feed grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Column 1 & 2 (Left Span) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Community Insights Area Chart card */}
            <div className="p-6 bg-white rounded-3xl border border-warm/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="font-ui font-extrabold text-sm text-[#1F2937]">Community Insights</h2>
                </div>
                <select className="text-[10px] font-bold bg-[#F9FAFB] border border-warm/80 rounded-xl px-2.5 py-1.5 text-[#4B5563] outline-none">
                  <option>This Month</option>
                  <option>This Week</option>
                  <option>This Year</option>
                </select>
              </div>

              {/* Chart container */}
              <div className="h-48 w-full -ml-3">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={getDynamicInsights()} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6A13" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#FF6A13" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="name" tickLine={false} axisLine={false} style={{ fontSize: 9, fill: "#9CA3AF", fontWeight: 600 }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: 9, fill: "#9CA3AF", fontWeight: 600 }} />
                    <Tooltip contentStyle={{ background: "#FFFFFF", borderRadius: 12, border: "1px solid #E5E7EB", fontSize: 10, fontWeight: 700 }} />
                    <Area type="monotone" dataKey="value" stroke="#FF6A13" strokeWidth={2.5} fillOpacity={1} fill="url(#colorValue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Bottom statistics list */}
              <div className="grid grid-cols-3 gap-2 border-t border-[#F3F4F6] pt-4 text-center">
                <div>
                  <span className="text-[10px] text-warm-muted uppercase font-bold tracking-wider block">New Members</span>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-base font-black text-[#1F2937]">2</span>
                    <span className="text-[9px] font-bold text-teal">+100%</span>
                  </div>
                </div>
                <div className="border-x border-[#F3F4F6]">
                  <span className="text-[10px] text-warm-muted uppercase font-bold tracking-wider block">Event Participation</span>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-base font-black text-[#1F2937]">120</span>
                    <span className="text-[9px] font-bold text-teal">+15%</span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-warm-muted uppercase font-bold tracking-wider block">Post Reach</span>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-base font-black text-[#1F2937]">850</span>
                    <span className="text-[9px] font-bold text-teal">+25%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Upcoming Events List */}
            <div className="p-6 bg-white rounded-3xl border border-warm/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-ui font-extrabold text-sm text-[#1F2937]">Upcoming Events</h2>
                <Link to="/dashboard/events" className="text-[10px] font-bold text-[#FF6A13] hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {events.length === 0 ? (
                  <div className="text-center py-6 text-warm-muted text-xs bg-[#F9FAFB] rounded-2xl border border-dashed border-warm">
                    No upcoming events.
                  </div>
                ) : (
                  (() => {
                    const idx = activeEvent % events.length;
                    const e = events[idx];
                    return (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={e.id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="flex gap-4 p-3 hover:bg-[#F9FAFB] rounded-2xl border border-warm/30 transition duration-150"
                        >
                          <img 
                            src={e.img || e.img_url || "https://images.unsplash.com/photo-1590073844006-33379778ae09?w=300"} 
                            alt="" 
                            className="w-20 h-20 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="font-ui font-bold text-sm text-[#374151] line-clamp-1">{e.title}</h4>
                              <p className="text-[10px] text-warm-muted mt-1.5 flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gold" /> {new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} • {e.start_time || "6:00 PM"}
                              </p>
                              <p className="text-[10px] text-warm-muted flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-teal" /> {e.venue}
                              </p>
                            </div>
                            <div className="flex items-center justify-between mt-2.5">
                              {/* Avatars */}
                              <div className="flex items-center">
                                <div className="flex -space-x-1 overflow-hidden">
                                  <img className="inline-block h-4.5 w-4.5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50" alt="" />
                                  <img className="inline-block h-4.5 w-4.5 rounded-full ring-2 ring-white" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50" alt="" />
                                </div>
                                <span className="text-[9px] text-warm-muted font-bold ml-1.5">+{110 + idx * 5}</span>
                              </div>
                              <Link to="/dashboard/events" className="px-3 py-1 bg-[#FF6A13] hover:bg-[#FF8C37] text-white text-[10px] font-bold rounded-lg transition">
                                Register
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Job Recommendations */}
            <div className="p-6 bg-white rounded-3xl border border-warm/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-ui font-extrabold text-sm text-[#1F2937]">Job Recommendations</h2>
                <Link to="/dashboard/jobs" className="text-[10px] font-bold text-[#FF6A13] hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {jobs.length === 0 ? (
                  (() => {
                    const fallbackJobs = [
                      { id: "j1", role: "Marketing Executive", company: "Nexus Solutions", location: "Surat", salary: "₹25,000 - ₹35,000", type: "Full Time" },
                      { id: "j2", role: "Business Development Manager", company: "Shree Enterprise", location: "Surat", salary: "₹30,000 - ₹45,000", type: "Full Time" },
                      { id: "j3", role: "Graphic Designer", company: "Creative Hub", location: "Surat", salary: "₹18,000 - ₹25,000", type: "Full Time" }
                    ];
                    const idx = activeJob % fallbackJobs.length;
                    const j = fallbackJobs[idx];
                    return (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={j.id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="flex items-center justify-between p-3.5 border border-warm/40 hover:bg-[#F9FAFB] rounded-2xl transition duration-150"
                        >
                          <div className="flex gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs ${
                              idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}>
                              {j.company.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-ui font-bold text-xs text-[#374151]">{j.role}</h4>
                              <p className="text-[10px] text-warm-muted mt-0.5">{j.company} • {j.location}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-extrabold text-[#374151]">{j.salary}</span>
                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-bold rounded">
                                  {j.type}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button className="p-2 text-warm-muted hover:bg-sand rounded-xl transition">
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })()
                ) : (
                  (() => {
                    const idx = activeJob % jobs.length;
                    const j = jobs[idx];
                    return (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={j.id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="flex items-center justify-between p-3.5 border border-warm/40 hover:bg-[#F9FAFB] rounded-2xl transition duration-150"
                        >
                          <div className="flex gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-xs bg-primary">
                              {j.logo_letter || j.company.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-ui font-bold text-xs text-[#374151]">{j.role}</h4>
                              <p className="text-[10px] text-warm-muted mt-0.5">{j.company} • {j.location}</p>
                              <div className="flex items-center gap-2 mt-1.5">
                                <span className="text-[10px] font-extrabold text-[#374151]">{j.salary}</span>
                                <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[8px] font-bold rounded">
                                  {j.type || "Full Time"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button className="p-2 text-warm-muted hover:bg-sand rounded-xl transition">
                            <Bookmark className="w-4 h-4" />
                          </button>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })()
                )}
              </div>
            </div>
          </div>

          {/* Column 3 (Right Sidebar Pane) */}
          <div className="space-y-6">
            
            {/* Recent Activity feed */}
            <div className="p-6 bg-white rounded-3xl border border-warm/80 shadow-xs space-y-4">
              <style dangerouslySetInnerHTML={{ __html: `
                @keyframes verticalMarquee {
                  0% { transform: translateY(0); }
                  100% { transform: translateY(-50%); }
                }
                .activity-marquee-container {
                  height: 180px;
                  overflow: hidden;
                  position: relative;
                }
                .activity-marquee-content {
                  display: flex;
                  flex-direction: column;
                  gap: 1.25rem;
                  animation: verticalMarquee 20s linear infinite;
                }
                .activity-marquee-content:hover {
                  animation-play-state: paused;
                }
              `}} />
              <div className="flex justify-between items-center">
                <h2 className="font-ui font-extrabold text-sm text-[#1F2937]">Recent Activity</h2>
                <span className="text-[10px] font-bold text-warm-muted cursor-pointer hover:text-foreground">View All</span>
              </div>

              <div className="activity-marquee-container">
                <div className="activity-marquee-content pl-3 border-l border-[#E5E7EB] ml-1">
                  {[...getDynamicActivities(), ...getDynamicActivities()].map((act, i) => (
                    <div key={i} className="relative">
                      {/* Circle bullet node */}
                      <div className="absolute -left-6 top-0.5 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center text-[10px] shadow-sm">
                        {act.emoji}
                      </div>
                      <div className="pl-1">
                        <p className="text-xs font-semibold text-[#374151] leading-relaxed">{act.title}</p>
                        <span className="text-[9px] text-warm-muted block mt-0.5">{act.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Announcements */}
            <div className="p-6 bg-white rounded-3xl border border-warm/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-ui font-extrabold text-sm text-[#1F2937]">Announcements</h2>
                <Link to="/dashboard/notifications" className="text-[10px] font-bold text-[#FF6A13] hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {news.length === 0 ? (
                  (() => {
                    const fallbackNews = [
                      { id: "n1", title: "AMD Plane Crash", excerpt: "Stay safe and follow official updates.", time: "1 day ago", img: "https://images.unsplash.com/photo-1540962351504-03099e0a754b?w=200" },
                      { id: "n2", title: "Community Meeting", excerpt: "Join us this Sunday at 10 AM in the community hall.", time: "2 days ago", img: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=200" }
                    ];
                    const idx = activeAnnouncement % fallbackNews.length;
                    const n = fallbackNews[idx];
                    return (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={n.id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="flex gap-3 p-1.5 hover:bg-[#F9FAFB] rounded-2xl transition duration-150"
                        >
                          <img src={n.img} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-ui font-bold text-xs text-[#374151] line-clamp-1">{n.title}</h4>
                            <p className="text-[10px] text-warm-muted mt-0.5 line-clamp-1">{n.excerpt}</p>
                            <span className="text-[9px] text-warm-muted block mt-1.5">{n.time}</span>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })()
                ) : (
                  (() => {
                    const idx = activeAnnouncement % news.length;
                    const n = news[idx];
                    return (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={n.id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="flex gap-3 p-1.5 hover:bg-[#F9FAFB] rounded-2xl transition duration-150"
                        >
                          <img src={n.img || n.img_url || "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=200"} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-ui font-bold text-xs text-[#374151] line-clamp-1">{n.title}</h4>
                            <p className="text-[10px] text-warm-muted mt-0.5 line-clamp-1">{n.desc || n.excerpt}</p>
                            <span className="text-[9px] text-warm-muted block mt-1.5">{new Date(n.date || n.created_at).toLocaleDateString()}</span>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Birthdays This Week */}
            <div className="p-6 bg-white rounded-3xl border border-warm/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-ui font-extrabold text-sm text-[#1F2937]">Birthdays This Week</h2>
                <span className="text-[10px] font-bold text-warm-muted cursor-pointer hover:text-foreground">View All</span>
              </div>

              <div>
                {birthdays.length === 0 ? (
                  <div className="bg-[#FFF5F5] border border-red-100 rounded-2xl p-4.5 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-xl bg-red-100/50 flex items-center justify-center text-lg">🎁</div>
                    <div>
                      <h4 className="font-ui font-bold text-xs text-[#374151]">No birthdays this week</h4>
                      <p className="text-[9px] text-warm-muted mt-0.5">Be the first to wish someone!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {birthdays.slice(0, 3).map(m => {
                      let dateStr = "";
                      const parts = m.birthdate ? m.birthdate.split(/[-/]/) : [];
                      if (parts.length >= 3) {
                        const birthMonth = parts[0].length === 4 ? parseInt(parts[1], 10) - 1 : parseInt(parts[1], 10) - 1;
                        const birthDay = parts[0].length === 4 ? parseInt(parts[2], 10) : parseInt(parts[0], 10);
                        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                        
                        const today = new Date();
                        const currentYear = today.getFullYear();
                        const bdayThisYear = new Date(currentYear, birthMonth, birthDay);
                        bdayThisYear.setHours(0, 0, 0, 0);
                        const todayStart = new Date(today);
                        todayStart.setHours(0, 0, 0, 0);
                        
                        let diffDays = Math.round((bdayThisYear.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays < 0) {
                          const bdayNextYear = new Date(currentYear + 1, birthMonth, birthDay);
                          bdayNextYear.setHours(0, 0, 0, 0);
                          diffDays = Math.round((bdayNextYear.getTime() - todayStart.getTime()) / (1000 * 60 * 60 * 24));
                        }
                        
                        if (diffDays === 0) {
                          dateStr = "Today! 🎂";
                        } else if (diffDays === 1) {
                          dateStr = "Tomorrow 🎈";
                        } else {
                          dateStr = `${monthNames[birthMonth]} ${birthDay} (in ${diffDays} days)`;
                        }
                      }

                      return (
                        <div key={m.id} className="flex items-center justify-between p-2 hover:bg-[#F9FAFB] rounded-xl transition">
                          <div className="flex items-center gap-2.5">
                            <AvatarCircle name={m.name} src={m.avatar || m.avatar_url} size={28} />
                            <div>
                              <h4 className="font-ui font-bold text-xs text-[#374151]">{m.name}</h4>
                              <p className="text-[9px] text-[#FF6A13] font-semibold mt-0.5">{dateStr}</p>
                              {m.village || m.city ? (
                                <p className="text-[8px] text-warm-muted">{m.village || m.city}</p>
                              ) : null}
                            </div>
                          </div>
                          <button onClick={() => handleWish(m.name)} className="text-[10px] font-bold text-[#FF6A13] hover:underline">
                            Wish 🎂
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Matrimony Suggestions */}
            <div className="p-6 bg-white rounded-3xl border border-warm/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-ui font-extrabold text-sm text-[#1F2937]">Matrimony Suggestions</h2>
                <Link to="/dashboard/matrimony" className="text-[10px] font-bold text-[#FF6A13] hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {matrimony.length === 0 ? (
                  (() => {
                    const fallbackMatches = [
                      { id: "m1", name: "Dixita", age: 25, profession: "Software Engineer", location: "Rampura, Gujarat", height: "5'4\"", education: "B.Com", marital_status: "Never Married", photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200" },
                      { id: "m2", name: "Krina", age: 24, profession: "Architect", location: "Surat, Gujarat", height: "5'3\"", education: "B.Arch", marital_status: "Never Married", photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200" }
                    ];
                    const idx = activeMatrimony % fallbackMatches.length;
                    const m = fallbackMatches[idx];
                    return (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={m.id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="p-3 border border-warm/50 rounded-2xl flex gap-3.5 hover:bg-[#F9FAFB] transition"
                        >
                          <img 
                            src={m.photo} 
                            alt="" 
                            className="w-16 h-20 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center">
                                <h4 className="font-ui font-bold text-xs text-[#374151]">{m.name}, {m.age}</h4>
                                <span className="text-red-500 text-xs">❤️</span>
                              </div>
                              <p className="text-[9px] text-warm-muted mt-0.5">{m.profession}</p>
                              <p className="text-[9px] text-warm-muted">{m.location}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2.5 text-[8px] font-semibold text-[#4B5563]">
                                <span className="px-1.5 py-0.5 bg-sand/30 rounded border border-warm/50">👤 {m.height}</span>
                                <span className="px-1.5 py-0.5 bg-sand/30 rounded border border-warm/50">🎓 {m.education}</span>
                                <span className="px-1.5 py-0.5 bg-sand/30 rounded border border-warm/50">💍 {m.marital_status}</span>
                              </div>
                            </div>
                            <button onClick={() => toast.success(`Interest sent to ${m.name}!`)} className="text-[9px] font-bold text-[#FF6A13] text-left mt-2 flex items-center gap-0.5">
                              Show Interest →
                            </button>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })()
                ) : (
                  (() => {
                    const idx = activeMatrimony % matrimony.length;
                    const m = matrimony[idx];
                    return (
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={m.id || idx}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.4, ease: "easeInOut" }}
                          className="p-3 border border-warm/50 rounded-2xl flex gap-3.5 hover:bg-[#F9FAFB] transition"
                        >
                          <img 
                            src={m.photo || m.photo_url || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200"} 
                            alt="" 
                            className="w-16 h-20 rounded-xl object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center">
                                <h4 className="font-ui font-bold text-xs text-[#374151]">{m.name}, {m.age}</h4>
                                <span className="text-red-500 text-xs">❤️</span>
                              </div>
                              <p className="text-[9px] text-warm-muted mt-0.5">{m.profession || m.education}</p>
                              <p className="text-[9px] text-warm-muted">{m.city || m.native_place}, {m.state}</p>
                              <div className="flex flex-wrap gap-1.5 mt-2.5 text-[8px] font-semibold text-[#4B5563]">
                                <span className="px-1.5 py-0.5 bg-sand/30 rounded border border-warm/50">👤 {m.height || "5'4\""}</span>
                                <span className="px-1.5 py-0.5 bg-sand/30 rounded border border-warm/50">🎓 {m.education || "Graduate"}</span>
                                <span className="px-1.5 py-0.5 bg-sand/30 rounded border border-warm/50">💍 {m.marital_status || "Never Married"}</span>
                              </div>
                            </div>
                            <button onClick={() => handleShowInterest(m.id, m.name)} className="text-[9px] font-bold text-[#FF6A13] text-left mt-2 flex items-center gap-0.5">
                              Show Interest →
                            </button>
                          </div>
                        </motion.div>
                      </AnimatePresence>
                    );
                  })()
                )}
              </div>
            </div>

            {/* Top Businesses */}
            <div className="p-6 bg-white rounded-3xl border border-warm/80 shadow-xs space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="font-ui font-extrabold text-sm text-[#1F2937]">Top Businesses</h2>
                <Link to="/dashboard/business" className="text-[10px] font-bold text-[#FF6A13] hover:underline flex items-center gap-0.5">
                  View All <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3.5">
                {businesses.length === 0 ? (
                  [
                    { id: "b1", name: "Shree Enterprise", category: "Real Estate", rating: "4.8 (120)", logo: "🏢", bg: "bg-emerald-500" },
                    { id: "b2", name: "Nexus Industrial", category: "Manufacturing", rating: "4.7 (95)", logo: "🏭", bg: "bg-blue-500" }
                  ].map((b) => (
                    <div key={b.id} className="flex items-center justify-between p-2.5 hover:bg-[#F9FAFB] rounded-2xl transition duration-150">
                      <div className="flex gap-3">
                        <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center text-base ${b.bg} text-white`}>
                          {b.logo}
                        </div>
                        <div>
                          <h4 className="font-ui font-bold text-xs text-[#374151]">{b.name}</h4>
                          <p className="text-[9px] text-warm-muted mt-0.5">{b.category} • {user?.communityName || "Surat"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] font-black text-[#FF6A13]">
                        <Star className="w-3.5 h-3.5 fill-current" /> {b.rating.split(" ")[0]}
                        <span className="text-warm-muted font-bold text-[8px]">{b.rating.slice(3)}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  businesses.slice(0, 2).map((b) => {
                    const firstLetter = b.name?.[0]?.toUpperCase() || "B";
                    return (
                      <Link key={b.id} to="/dashboard/business" className="flex items-center justify-between p-2.5 hover:bg-[#F9FAFB] rounded-2xl transition duration-150 block w-full text-left">
                        <div className="flex gap-3">
                          <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center text-xs bg-orange-100 text-[#FF6A13] font-bold`}>
                            {firstLetter}
                          </div>
                          <div>
                            <h4 className="font-ui font-bold text-xs text-[#374151]">{b.name}</h4>
                            <p className="text-[9px] text-warm-muted mt-0.5">{b.category} • {b.location || b.city || "Surat"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[9px] font-black text-[#FF6A13]">
                          <Star className="w-3.5 h-3.5 fill-current" /> {b.rating || "4.8"}
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    );
  },
});
