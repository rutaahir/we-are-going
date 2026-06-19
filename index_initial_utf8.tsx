import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Users, Calendar, Building2, Briefcase, Heart, MapPin, 
  ArrowRight, Star, Sparkles, HandHeart, Check, FileText, Download,
  LayoutDashboard, Newspaper, Image as ImageIcon, Video, Network, Settings,
  Search, Bell, Globe, ChevronDown, Plus, Play, User, X, Mail, Phone, Home as HomeIcon,
  ShieldCheck, ArrowUpRight, Loader
} from "lucide-react";
import { COMMUNITIES, EVENTS, MATRIMONY, BUSINESSES, JOBS, NEWS } from "@/data/mock";
import { api } from "@/lib/api";
import heroBg from "@/assets/hero-bg.png";
import { toast } from "sonner";

type SearchParams = {
  page?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    return {
      page: search.page as string || undefined,
    };
  },
  head: () => ({ meta: [
    { title: "We Are Samaj ΓÇö Apni Samaj, Apna Network" },
    { name: "description", content: "Community ERP and social network for Indian samaj communities ΓÇö manage members, events, matrimony, jobs and donations on one platform." },
    { property: "og:title", content: "We Are Samaj ΓÇö Connect Your Samaj Digitally" },
  ]}),
  component: DashboardStyleHome,
});

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Samachar", icon: Newspaper },
  { label: "Communities", icon: Building2 },
  { label: "Matrimony", icon: Heart },
  { label: "Jobs", icon: Briefcase },
  { label: "Events", icon: Calendar },
  { label: "Directory", icon: Users },
  { label: "Business Directory", icon: Building2 },
  { label: "Donations", icon: HandHeart },
  { label: "Gallery", icon: ImageIcon },
  { label: "Videos", icon: Video },
  { label: "Documents", icon: FileText },
  { label: "My Network", icon: Network },
  { label: "Settings", icon: Settings }
];

function DashboardStyleHome() {
  const { page } = Route.useSearch();
  const navigate = useNavigate();

  const [activeNav, setActiveNav] = useState("Dashboard");
  const [selectedCity, setSelectedCity] = useState("Ahmedabad");
  const [lang, setLang] = useState("EN");

  const handleNavClick = (label: string) => {
    const pageVal = label === "Dashboard" ? undefined : label.toLowerCase().replace(/\s+/g, "-");
    navigate({
      to: "/",
      search: { page: pageVal },
    });
  };

  useEffect(() => {
    if (page) {
      const matchedItem = sidebarItems.find(
        (item) => item.label.toLowerCase().replace(/\s+/g, "-") === page.toLowerCase()
      );
      if (matchedItem) {
        setActiveNav(matchedItem.label);
      } else if (page.toLowerCase() === "subscription") {
        setActiveNav("Subscription");
      }
    } else {
      setActiveNav("Dashboard");
    }
  }, [page]);
  
  // Data states - loading from API
  const [communities, setCommunities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [matrimony, setMatrimony] = useState<any[]>([]);
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Global Mock States to make items interactive
  const [userProfile, setUserProfile] = useState({
    name: "Rajesh Patel",
    email: "rajesh.patel@gmail.com",
    phone: "+91 98240 12345",
    address: "A-402, Shivalik Residency, Satellite",
    samaj: "Kutch Patidar Samaj",
    membership: "Premium Member",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop"
  });

  const [communityList, setCommunityList] = useState<any[]>([]);
  const [jobList, setJobList] = useState<any[]>([]);
  const [eventList, setEventList] = useState<any[]>([]);
  const [matrimonyList, setMatrimonyList] = useState<any[]>([]);

  // Modal / Detail States
  const [selectedNews, setSelectedNews] = useState<any>(null);
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [showPostJob, setShowPostJob] = useState(false);
  const [showReceipt, setShowReceipt] = useState<any>(null);

  // New features states
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [registeringEvent, setRegisteringEvent] = useState<{ event: any; index: number } | null>(null);
  const [regForm, setRegForm] = useState({ name: "", email: "", phone: "", attendees: 1 });
  const [selectedFamilyTree, setSelectedFamilyTree] = useState<any>(null);
  const [campaignList, setCampaignList] = useState<any[]>([]);
  const [userDonations, setUserDonations] = useState<any[]>([]);
  const [donationTab, setDonationTab] = useState<"campaigns" | "history">("campaigns");
  const [families, setFamilies] = useState<any[]>([]);

  // Form states
  const [newJob, setNewJob] = useState({ role: "", company: "", location: "", desc: "", salary: "" });
  const [donateAmount, setDonateAmount] = useState<{[key: string]: string}>({});
  const [dirSearchTab, setDirSearchTab] = useState<"members" | "businesses" | "contacts">("members");
  const [dirQuery, setDirQuery] = useState("");
  const [dirLocation, setDirLocation] = useState("All Locations");

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [
          communitiesData, 
          eventsData, 
          jobsData, 
          businessesData, 
          matrimonyData, 
          newsData, 
          campaignsData, 
          donationsData, 
          familiesData
        ] = await Promise.all([
          api.getCommunities(),
          api.getUpcomingEvents(),
          api.getJobs(),
          api.getBusinesses(),
          api.getMatrimony(),
          api.getNews(),
          api.getCampaigns(),
          api.getDonations(),
          api.getFamilies(),
        ]);

        setCommunities(communitiesData);
        setEvents(eventsData);
        setJobs(jobsData);
        setBusinesses(businessesData);
        setMatrimony(matrimonyData);
        setNews(newsData);
        setCampaignList(campaignsData);
        setFamilies(familiesData);

        // Filter user donations
        const myDons = donationsData.filter((d: any) => d.donor === userProfile.name);
        setUserDonations(myDons);

        // Fetch user event registrations from database
        let registrationsData: any[] = [];
        try {
          registrationsData = await api.getEventRegistrations({ email: userProfile.email });
        } catch (e) {
          console.warn("Failed to get event registrations, using empty array", e);
        }

        // Initialize interactive lists
        setCommunityList(communitiesData.map(c => ({ ...c, joined: false, member_count: c.member_count || 150 })));
        setJobList(jobsData.map(j => ({ ...j, logo: j.logo ?? j.logo_letter ?? (j.company ? j.company.charAt(0).toUpperCase() : "J"), applied: false })));
        setEventList(eventsData.map(e => ({ 
          ...e, 
          registered: registrationsData.some((r: any) => r.event === e.id)
        })));
        setMatrimonyList(matrimonyData.map(m => ({ ...m, interested: false })));
      } catch (error) {
        console.error("Failed to load data from API, using mock data", error);
        // Fallback to mock data
        setCommunityList(COMMUNITIES.map(c => ({ ...c, joined: false, member_count: (c as any).members ?? 150 })));
        setJobList(JOBS.map(j => ({ ...j, applied: false })));
        setEventList(EVENTS.map(e => ({ ...e, registered: false })));
        setMatrimonyList(MATRIMONY.map(m => ({ ...m, interested: false })));
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const downloadReceiptPdf = (receipt: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>Donation Receipt - ${receipt.txnId}</title>
          <style>
            body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #3E2723; background: #FFF5EE; padding: 40px; }
            .receipt-card { max-width: 500px; margin: 0 auto; background: white; border: 1px solid #EBE3DB; border-radius: 20px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
            .header { text-align: center; border-bottom: 2px dashed #EBE3DB; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: bold; color: #F97316; }
            .title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.1em; color: #8C6D58; margin-top: 5px; }
            .success { color: #10B981; font-weight: bold; margin-top: 10px; font-size: 16px; }
            .details { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .details td { padding: 10px 0; border-bottom: 1px solid #FAF3EC; font-size: 14px; }
            .details td.label { color: #8C6D58; }
            .details td.value { text-align: right; font-weight: bold; }
            .total-row { font-size: 18px; border-top: 2px solid #EBE3DB; }
            .total-row td { padding-top: 15px; }
            .total-val { color: #F97316; font-size: 20px; font-weight: 800; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #8C6D58; }
            @media print {
              body { background: white; padding: 0; }
              .receipt-card { border: none; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-card">
            <div class="header">
              <div class="logo">We Are Samaj</div>
              <div class="title">Official Donation Receipt</div>
              <div class="success">Γ£ô Transaction Successful</div>
            </div>
            <table class="details">
              <tr>
                <td class="label">Donor Name</td>
                <td class="value">${userProfile.name}</td>
              </tr>
              <tr>
                <td class="label">Campaign</td>
                <td class="value">${receipt.campaign}</td>
              </tr>
              <tr>
                <td class="label">Transaction ID</td>
                <td class="value">${receipt.txnId}</td>
              </tr>
              <tr>
                <td class="label">Date</td>
                <td class="value">${receipt.date}</td>
              </tr>
              <tr class="total-row">
                <td class="label" style="font-weight:bold;">Amount Paid</td>
                <td class="value total-val">Γé╣${parseInt(receipt.amount).toLocaleString()}</td>
              </tr>
            </table>
            <div class="footer">
              Thank you for your generous contribution to support the community.<br>
              This is a computer-generated receipt and does not require a physical signature.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };



  return (
    <div className="min-h-screen flex bg-[#FFF5EE] text-[#3E2723] font-sans antialiased overflow-hidden h-screen">
      {/* 1. Left Sidebar Navigation */}
      <aside className="w-[240px] flex-shrink-0 border-r border-[#EBE3DB] bg-[#FAF3EC] flex flex-col justify-between p-4 sticky top-0 h-screen hidden lg:flex z-20">
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-160px)] pr-1">
          {/* Logo + Tagline */}
          <Link to="/" className="flex items-center gap-2.5 px-2 py-1">
            <svg width="34" height="34" viewBox="0 0 40 40" className="drop-shadow-sm flex-shrink-0">
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#F97316" />
                  <stop offset="100%" stopColor="#EA580C" />
                </linearGradient>
              </defs>
              <path d="M20 3 L34 9 V21 C34 29 27 35 20 37 C13 35 6 29 6 21 V9 Z" fill="url(#lg)" />
              <path d="M14 19 L18 23 L26 14" fill="none" stroke="#FFF5EE" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="leading-tight text-left">
              <div className="font-ui font-bold text-base text-[#3E2723] tracking-tight">We Are Samaj</div>
              <div className="text-[10px] text-warm-muted -mt-0.5 font-medium">Apni Samaj, Apna Network</div>
            </div>
          </Link>

          {/* Navigation items */}
          <nav className="space-y-1">
            {sidebarItems.map((item) => {
              const active = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.label)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                    active 
                      ? "bg-[#FDF2E9] text-[#F97316] font-bold shadow-sm" 
                      : "text-[#5C4033] hover:bg-[#F3E8DE]/60 hover:text-[#3E2723]"
                  }`}
                >
                  {active && (
                    <motion.div 
                      layoutId="sidebarActiveBar"
                      className="absolute left-0 top-2.5 bottom-2.5 w-[3px] bg-[#F97316] rounded-r-full"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${active ? "text-[#F97316]" : "text-[#8C6D58]"}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Card - Upgrade to Premium */}
        <div className="mt-auto pt-4 border-t border-[#EBE3DB]">
          <div className="bg-gradient-to-br from-[#2D1B13] to-[#1C100B] text-white rounded-2xl p-4 text-center relative overflow-hidden shadow-md border border-white/5">
            <div className="absolute -top-3 -right-3 w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#F97316]/60" />
            </div>
            <h4 className="font-semibold text-xs text-white tracking-wide">Upgrade to Premium</h4>
            <p className="text-[10px] text-white/70 mt-1 leading-relaxed">
              Get more visibility, premium features & much more.
            </p>
            <button onClick={() => handleNavClick("Subscription")} className="w-full mt-3 py-2 rounded-xl bg-[#F97316] text-white text-xs font-bold hover:bg-[#EA580C] transition duration-300 shadow-lg shadow-[#F97316]/20">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* Main Workspace (Top Header + Center Main + Right Panel) */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* 2. Top Header Bar */}
        <header className="h-16 border-b border-[#EBE3DB] bg-[#FAF3EC]/80 backdrop-blur-md px-6 flex items-center justify-between flex-shrink-0 z-30 shadow-xs">
          {/* Search bar */}
          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D58]" />
            <input 
              type="text" 
              placeholder="Search communities, news, events, members..." 
              className="w-full pl-9 pr-12 py-2 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316] text-[#3E2723] placeholder-[#8C6D58]/60 transition duration-200"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] text-[#8C6D58]/60 bg-[#FAF3EC] border border-[#EBE3DB] px-1.5 py-0.5 rounded font-mono select-none">
              ΓîÿK
            </span>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            {/* Location selector dropdown */}
            <div className="relative">
              <select 
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="flex items-center gap-1.5 pl-8 pr-8 py-1.5 rounded-full bg-[#FFF8F2] border border-[#EBE3DB] text-xs font-semibold text-[#3E2723] hover:bg-[#FDF2E9] focus:outline-none focus:ring-1 focus:ring-[#F97316] appearance-none cursor-pointer transition duration-200"
                style={{ 
                  backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='%238C6D58' stroke-width='2' viewBox='0 0 24 24'><path d='M6 9l6 6 6-6'/></svg>")`, 
                  backgroundPosition: 'right 10px center', 
                  backgroundRepeat: 'no-repeat' 
                }}
              >
                <option value="Ahmedabad">Ahmedabad</option>
                <option value="Surat">Surat</option>
                <option value="Rajkot">Rajkot</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Amreli">Amreli</option>
              </select>
              <MapPin className="w-3.5 h-3.5 text-[#F97316] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* LanguageSelector */}
            <div className="flex items-center gap-1 bg-[#FFF8F2] border border-[#EBE3DB] rounded-full p-0.5 shadow-2xs">
              {(["EN", "GU", "HI"] as const).map(l => (
                <button 
                  key={l} 
                  onClick={() => setLang(l)} 
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition duration-200 ${
                    lang === l ? "bg-[#F97316] text-white" : "text-[#8C6D58] hover:text-[#3E2723]"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Notification bell with badge */}
            <button className="relative w-9 h-9 rounded-full bg-[#FFF8F2] border border-[#EBE3DB] hover:bg-[#FDF2E9] flex items-center justify-center transition duration-200 shadow-2xs">
              <Bell className="w-4 h-4 text-[#3E2723]" />
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border border-white text-[9px] font-bold text-white rounded-full flex items-center justify-center">
                3
              </span>
            </button>

            {/* User avatar + Hi, Rajesh */}
            <div className="relative">
              <button 
                onClick={() => setShowProfileDropdown(!showProfileDropdown)} 
                className="flex items-center gap-2 border-l border-[#EBE3DB] pl-4 hover:opacity-85 transition duration-200 cursor-pointer"
              >
                <img 
                  src={userProfile.avatar} 
                  alt="Profile" 
                  className="w-8 h-8 rounded-full object-cover border border-[#F97316] shadow-sm"
                />
                <div className="hidden md:block leading-tight text-left">
                  <div className="text-xs font-bold text-[#3E2723]">Hi, {userProfile.name.split(" ")[0]}</div>
                  <div className="text-[9px] text-[#F97316] font-semibold flex items-center gap-0.5">
                    {userProfile.membership} <ChevronDown className="w-2.5 h-2.5 ml-0.5" />
                  </div>
                </div>
              </button>
              
              {showProfileDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowProfileDropdown(false)} />
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-[#EBE3DB] rounded-2xl shadow-xl py-2 z-40 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button 
                      onClick={() => {
                        handleNavClick("Settings");
                        setShowProfileDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-[#3E2723] hover:bg-[#FFF8F2] hover:text-[#F97316] flex items-center gap-2 transition cursor-pointer"
                    >
                      <User className="w-3.5 h-3.5 text-[#F97316]" />
                      My Profile
                    </button>
                    <button 
                      onClick={() => {
                        setShowProfileDropdown(false);
                        toast.info("Logged out successfully");
                        window.location.href = "/login";
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5 text-red-500" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content Body Layout */}
        <div className="flex-1 flex overflow-hidden">
          {/* 3. Main Content Area */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-transparent">
            <AnimatePresence mode="wait">
              {activeNav === "Dashboard" && (
                <motion.div key="dash" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                  
                  {/* Hero Banner with Image Background */}
                  <div 
                    className="relative rounded-[24px] bg-[#FAF3EC] p-6 sm:p-7 overflow-hidden min-h-[240px] flex items-center shadow-sm border border-[#EBE3DB] bg-cover bg-center"
                    style={{ backgroundImage: `url(${heroBg})` }}
                  >
                    {/* Glowing background highlights for depth */}
                    <div className="absolute top-[-50px] right-[-50px] w-48 h-48 bg-[#F97316]/5 rounded-full blur-3xl pointer-events-none z-0" />
                    <div className="absolute bottom-[-50px] left-[10%] w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none z-0" />

                    <div className="relative z-10 max-w-2xl space-y-4 text-left">
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#3E2723] leading-tight">
                        Connect. Empower. Grow.<br />
                        <span className="text-[#F97316]">Stronger Together!</span>
                      </h2>
                      <p className="text-xs text-[#5C4033]/85 max-w-sm leading-relaxed font-medium">
                        Your one-stop platform for news, events, community, matrimony, jobs & everything in between.
                      </p>
                      <div className="pt-2 flex items-center gap-3">
                        <button onClick={() => handleNavClick("Communities")} className="px-5 py-2.5 text-xs rounded-xl bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white font-bold hover:shadow-lg hover:shadow-[#F97316]/20 transition-all duration-300 transform active:scale-95 cursor-pointer">
                          Explore Communities
                        </button>
                        <Link to="/register/community" className="px-5 py-2.5 text-xs rounded-xl border border-[#F97316] text-[#F97316] hover:bg-[#F97316] hover:text-white font-bold transition-all duration-300 transform active:scale-95 flex items-center gap-1 bg-white/70 backdrop-blur-xs shadow-2xs">
                          <Plus className="w-3.5 h-3.5" /> Register Your Community
                        </Link>
                      </div>
                    </div>

                    {/* Stats Overlay Bar inside Hero */}
                    <div className="absolute bottom-4 left-6 right-6 hidden lg:flex items-center justify-between bg-white/80 backdrop-blur-md border border-[#EBE3DB]/60 rounded-2xl px-6 py-2.5 z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF3EC] text-[#F97316] flex items-center justify-center border border-[#EBE3DB]/40"><Building2 className="w-4 h-4" /></div>
                        <div>
                          <div className="text-xs font-extrabold text-[#3E2723]">540+</div>
                          <div className="text-[9px] text-warm-muted font-medium">Communities</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 border-l border-[#EBE3DB]/60 pl-6">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF3EC] text-[#F97316] flex items-center justify-center border border-[#EBE3DB]/40"><Users className="w-4 h-4" /></div>
                        <div>
                          <div className="text-xs font-extrabold text-[#3E2723]">1.2M+</div>
                          <div className="text-[9px] text-warm-muted font-medium">Members</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 border-l border-[#EBE3DB]/60 pl-6">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF3EC] text-[#F97316] flex items-center justify-center border border-[#EBE3DB]/40"><Globe className="w-4 h-4" /></div>
                        <div>
                          <div className="text-xs font-extrabold text-[#3E2723]">22</div>
                          <div className="text-[9px] text-warm-muted font-medium">States</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 border-l border-[#EBE3DB]/60 pl-6">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF3EC] text-[#F97316] flex items-center justify-center border border-[#EBE3DB]/40"><Calendar className="w-4 h-4" /></div>
                        <div>
                          <div className="text-xs font-extrabold text-[#3E2723]">28,400+</div>
                          <div className="text-[9px] text-warm-muted font-medium">Events</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 border-l border-[#EBE3DB]/60 pl-6">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF3EC] text-[#F97316] flex items-center justify-center border border-[#EBE3DB]/40"><HandHeart className="w-4 h-4" /></div>
                        <div>
                          <div className="text-xs font-extrabold text-[#3E2723]">42Cr+</div>
                          <div className="text-[9px] text-warm-muted font-medium">Donations</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Two-Column Grid: Left Main Section (News + Widgets) & Right Section (Events + Highlights) */}
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Left main column: Spans 9 of 12 columns */}
                    <div className="xl:col-span-9 space-y-6">
                      
                      {/* Latest Samachar */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-[#3E2723] tracking-tight">Latest Samachar</h3>
                          <button onClick={() => handleNavClick("Samachar")} className="text-xs font-bold text-[#F97316] hover:text-[#EA580C] transition flex items-center gap-0.5">
                            View All <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {SAMACHAR_ITEMS.map((item) => (
                            <div key={item.id} onClick={() => setSelectedNews(item)} className="group bg-white rounded-2xl border border-[#EBE3DB]/60 overflow-hidden shadow-xs hover:shadow-md hover:border-[#F97316]/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer">
                              <div className="relative overflow-hidden h-24">
                                <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              </div>
                              <div className="p-3.5 space-y-1.5 text-left">
                                <h4 className="text-xs font-bold leading-snug line-clamp-2 text-[#3E2723] group-hover:text-[#F97316] transition-colors duration-200">{item.title}</h4>
                                <div className="flex items-center justify-between text-[10px] text-warm-muted pt-1 border-t border-[#FAF3EC]">
                                  <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-[#F97316]" />{item.location}</span>
                                  <span>{item.time}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Three Column Grid for Matrimony + Jobs + Quick Access */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Matrimony Widget */}
                        <div className="lg:col-span-6 bg-white rounded-[24px] border border-[#EBE3DB]/60 p-5 space-y-4 shadow-xs text-left">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-bold text-sm text-[#3E2723] tracking-tight">Find Your Life Partner</h3>
                              <p className="text-[10px] text-[#8C6D58]">Trusted matrimony within your community</p>
                            </div>
                            <button onClick={() => handleNavClick("Matrimony")} className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-0.5 cursor-pointer">
                              View Profiles <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                            {PARTNERS.slice(0, 4).map((partner, i) => (
                              <div key={i} className="bg-white hover:shadow-md border border-[#EBE3DB]/60 rounded-2xl overflow-hidden flex flex-col transition duration-200 text-left shadow-3xs">
                                <img src={partner.photo} alt={partner.name} className="w-full h-24 object-cover" />
                                <div className="p-2.5 space-y-1">
                                  <h4 className="text-[11px] font-bold text-[#3E2723] truncate">
                                    {partner.name}
                                  </h4>
                                  <p className="text-[9px] text-warm-muted font-medium truncate">{partner.age} yrs ┬╖ {partner.location}</p>
                                  <span className="inline-block text-[8px] bg-orange-50 text-[#F97316] border border-orange-100/50 font-bold px-1.5 py-0.5 rounded-full mt-0.5 truncate max-w-full">
                                    {partner.profession}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Jobs Widget */}
                        <div className="lg:col-span-3 bg-white rounded-[24px] border border-[#EBE3DB]/60 p-5 space-y-4 shadow-xs text-left flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-bold text-sm text-[#3E2723] tracking-tight">Jobs for You</h3>
                                <p className="text-[10px] text-[#8C6D58]">Relevant openings</p>
                              </div>
                              <button onClick={() => handleNavClick("Jobs")} className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-0.5 cursor-pointer">
                                View All <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              {DASHBOARD_JOBS.slice(0, 3).map((job, idx) => (
                                <div key={idx} className="group flex items-center justify-between p-2.5 rounded-xl border border-[#F3E8DE]/60 bg-[#FFF8F2]/60 hover:bg-[#FDF2E9] hover:border-orange-200 transition-all duration-200">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-xl bg-[#F0E6FF] text-[#8B5CF6] font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                                      {job.logo ?? "J"}
                                    </div>
                                    <div className="text-left leading-tight min-w-0">
                                      <h4 className="text-[11px] font-bold text-[#3E2723] truncate flex items-center gap-1">
                                        {job.role}
                                        {job.isNew && (
                                          <span className="bg-emerald-100 text-emerald-700 text-[7px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">New</span>
                                        )}
                                      </h4>
                                      <p className="text-[9px] text-warm-muted truncate">{job.company} ┬╖ {job.location}</p>
                                    </div>
                                  </div>
                                  <ArrowRight className="w-3.5 h-3.5 text-[#8C6D58] group-hover:text-[#F97316] transition-colors flex-shrink-0" />
                                </div>
                              ))}
                            </div>
                          </div>
                          <button onClick={() => setShowPostJob(true)} className="w-full py-2 rounded-xl border border-dashed border-[#F97316] text-[#F97316] text-xs font-bold hover:bg-orange-50/50 transition flex items-center justify-center gap-1 mt-2.5 cursor-pointer">
                            <Plus className="w-3.5 h-3.5" /> Post a Job
                          </button>
                        </div>

                        {/* Quick Access Widget */}
                        <div className="lg:col-span-3 bg-white rounded-[24px] border border-[#EBE3DB]/60 p-5 space-y-4 shadow-xs text-left flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold text-sm text-[#3E2723] tracking-tight">Quick Access</h3>
                              <button onClick={() => handleNavClick("Samachar")} className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-0.5 cursor-pointer">
                                View All ΓåÆ
                              </button>
                            </div>
                            <div className="grid grid-cols-4 gap-3">
                              {[
                                { label: "Samachar", icon: Newspaper, color: "bg-[#FFF5EE] text-[#F97316] hover:bg-[#FDF2E9]" },
                                { label: "Matrimony", icon: Heart, color: "bg-red-50 text-red-500 hover:bg-red-100/50" },
                                { label: "Jobs", icon: Briefcase, color: "bg-amber-50 text-amber-600 hover:bg-amber-100/50" },
                                { label: "Events", icon: Calendar, color: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100/50" },
                                { label: "Directory", icon: Users, color: "bg-blue-50 text-blue-600 hover:bg-blue-100/50" },
                                { label: "Gallery", icon: ImageIcon, color: "bg-purple-50 text-purple-600 hover:bg-purple-100/50" },
                                { label: "Videos", icon: Video, color: "bg-pink-50 text-pink-500 hover:bg-pink-100/50" },
                                { label: "Donations", icon: HandHeart, color: "bg-[#FDF2E9] text-[#F97316] hover:bg-[#FBE9DC]" }
                              ].map((item, i) => (
                                <button 
                                  key={i} 
                                  onClick={() => handleNavClick(item.label)} 
                                  className="flex flex-col items-center gap-1.5 group transition duration-200 cursor-pointer"
                                >
                                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center shadow-2xs group-hover:-translate-y-0.5 group-hover:shadow-xs transition duration-200`}>
                                    <item.icon className="w-4.5 h-4.5" />
                                  </div>
                                  <span className="text-[9px] font-bold text-[#8C6D58] group-hover:text-[#F97316] text-center truncate w-full transition duration-150">
                                    {item.label}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right column: Spans 3 of 12 columns (Upcoming Events & Today's Highlights) */}
                    <div className="xl:col-span-3 space-y-6">
                      
                      {/* Upcoming Events */}
                      <div className="bg-white rounded-[24px] border border-[#EBE3DB]/60 p-5 space-y-4 shadow-xs text-left">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-[#3E2723] tracking-tight">Upcoming Events</h3>
                          <button onClick={() => handleNavClick("Events")} className="text-xs font-bold text-[#F97316] hover:underline">
                            View All ΓåÆ
                          </button>
                        </div>

                        <div className="space-y-3.5">
                          {EVENTS_ITEMS.map((ev, i) => (
                            <div key={i} className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNavClick("Events")}>
                              {/* Date Block */}
                              <div className="w-10 h-10 rounded-xl bg-[#FFF5EE] border border-[#F3E8DE] flex flex-col items-center justify-center flex-shrink-0 group-hover:border-[#F97316]/30 group-hover:bg-[#FDF2E9] transition duration-200">
                                <span className="text-xs font-extrabold text-[#F97316] leading-none">{ev.day}</span>
                                <span className="text-[8px] font-bold text-warm-muted leading-none mt-0.5">{ev.month}</span>
                              </div>

                              <div className="text-xs leading-snug">
                                <h4 className="font-bold text-[#3E2723] line-clamp-1 group-hover:text-[#F97316] transition duration-200">{ev.title}</h4>
                                <p className="text-[9px] text-warm-muted flex items-center gap-0.5 mt-0.5">
                                  <MapPin className="w-2.5 h-2.5 text-[#F97316]" /> {ev.location} ┬╖ {ev.time}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Today's Highlights Timeline */}
                      <div className="bg-white rounded-[24px] border border-[#EBE3DB]/60 p-5 space-y-4 shadow-xs text-left relative overflow-hidden">
                        <h3 className="font-bold text-sm text-[#3E2723] tracking-tight">Today's Highlights</h3>
                        
                        <div className="relative space-y-4 pl-1">
                          {/* Timeline vertical connector */}
                          <div className="absolute left-[13px] top-3 bottom-3 w-[1.5px] bg-[#EBE3DB]/60 border-dashed border-l border-[#EBE3DB]/70" />

                          {HIGHLIGHTS.map((item, i) => (
                            <div key={i} className="flex gap-3.5 items-start relative z-10">
                              <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center flex-shrink-0 shadow-2xs border border-[#F3E8DE]/40`}>
                                <item.icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="text-[10px] leading-tight text-left pt-0.5">
                                <p className="text-warm-muted font-medium">{item.type}</p>
                                <p className="font-bold text-[#3E2723] mt-0.5">
                                  {item.name} <span className="font-normal text-warm-muted text-[9px]">{item.detail}</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Photo Gallery */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#3E2723] tracking-tight">Photo Gallery</h3>
                      <button onClick={() => handleNavClick("Gallery")} className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-0.5">
                        View All <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {GALLERY_IMAGES.map((img, i) => (
                        <div key={i} onClick={() => setSelectedPhoto(img)} className="group relative rounded-2xl overflow-hidden border border-[#EBE3DB]/60 aspect-video shadow-xs hover:shadow-md cursor-pointer transition">
                          <img src={img} alt="gallery" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                            <span className="text-white text-xs font-bold bg-white/20 backdrop-blur-xs border border-white/20 px-3.5 py-1.5 rounded-full flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5" /> View Photo
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Popular Videos */}
                  <div className="space-y-3 pb-16 lg:pb-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-[#3E2723] tracking-tight">Popular Videos</h3>
                      <button onClick={() => handleNavClick("Videos")} className="text-xs font-bold text-[#F97316] hover:underline flex items-center gap-0.5">
                        View All <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {POPULAR_VIDEOS.map((vid, i) => (
                        <div key={i} onClick={() => setSelectedVideo(vid)} className="group bg-white rounded-2xl border border-[#EBE3DB]/60 overflow-hidden shadow-xs hover:shadow-md cursor-pointer transition">
                          <div className="relative aspect-video overflow-hidden">
                            <img src={vid.img} alt={vid.title} className="w-full h-full object-cover group-hover:scale-103 transition duration-500" />
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 flex items-center justify-center transition duration-300">
                              <div className="w-11 h-11 rounded-full bg-white/95 shadow-md flex items-center justify-center text-[#F97316] transform group-hover:scale-108 transition duration-300">
                                <Play className="w-4.5 h-4.5 fill-current ml-0.5" />
                              </div>
                            </div>
                            <span className="absolute bottom-2.5 right-2.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              {vid.duration}
                            </span>
                          </div>
                          <div className="p-3 text-left">
                            <h4 className="text-xs font-bold text-[#3E2723] group-hover:text-[#F97316] transition-colors">{vid.title}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SAMACHAR VIEW */}
              {activeNav === "Samachar" && (
                <motion.div key="samachar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Samaj Samachar & Board</h2>
                    <span className="text-xs text-warm-muted">{news.length || NEWS.length} articles published</span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    {(news.length > 0 ? news : NEWS).map((item: any) => (
                      <div key={item.id} onClick={() => setSelectedNews(item)} className="bg-white border border-[#EBE3DB] rounded-2xl overflow-hidden flex flex-col md:flex-row hover:shadow-md transition cursor-pointer">
                        <img src={item.img} alt="" className="w-full md:w-44 h-32 object-cover" />
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-[#F97316] bg-[#FFF5EE] px-2.5 py-0.5 rounded-full">{item.category}</span>
                            <h3 className="font-bold text-sm text-[#3E2723] mt-2 line-clamp-2">{item.title}</h3>
                            <p className="text-xs text-warm-muted mt-1 line-clamp-2">{item.excerpt}</p>
                          </div>
                          <div className="text-[10px] text-warm-muted flex justify-between items-center mt-3 pt-2 border-t border-[#F3E8DE]">
                            <span>≡ƒôà {item.date}</span>
                            <span className="text-[#F97316] font-semibold">Read More ΓåÆ</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* COMMUNITIES VIEW */}
              {activeNav === "Communities" && (
                <motion.div key="communities" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Samaj Communities</h2>
                    <span className="text-xs bg-[#FDF2E9] text-[#F97316] px-3 py-1 rounded-full font-bold">
                      {loading ? <Loader className="w-3 h-3 animate-spin inline" /> : `${communities.length}+ Communities`}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {communityList.slice(0, 12).map((c, i) => (
                      <div key={i} className="bg-white border border-[#EBE3DB] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <div className="h-28 bg-[#FAF3EC] relative flex items-center justify-center overflow-hidden">
                          <img src={c.cover} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                          <div className="absolute top-2 right-2 bg-black/40 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                            {c.type}
                          </div>
                        </div>
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-sm text-[#3E2723]">{c.name}</h3>
                            <p className="text-[10px] text-warm-muted mt-1">≡ƒÅÿ∩╕Å {c.village}, {c.district}</p>
                          </div>
                          <div className="flex items-center justify-between border-t border-[#F3E8DE] mt-4 pt-3">
                            <span className="text-xs font-semibold">{c.member_count} Members</span>
                            <button 
                              onClick={() => {
                                const copy = [...communityList];
                                copy[i].joined = !copy[i].joined;
                                copy[i].member_count = copy[i].joined ? copy[i].member_count + 1 : copy[i].member_count - 1;
                                setCommunityList(copy);
                              }}
                              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition ${
                                c.joined 
                                  ? "bg-emerald-100 text-emerald-700 flex items-center gap-1" 
                                  : "bg-[#F97316] text-white hover:bg-[#EA580C]"
                              }`}
                            >
                              {c.joined ? <><Check className="w-3.5 h-3.5" /> Joined</> : "Join"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* MATRIMONY VIEW */}
              {activeNav === "Matrimony" && (
                <motion.div key="matrimony" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Privacy-First Matrimony</h2>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-bold">Γ£ô Verified Profiles Only</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {matrimonyList.map((m, i) => (
                      <div key={i} className="bg-white border border-[#EBE3DB] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <div className="aspect-[4/5] relative">
                          <img src={m.photo} alt={m.name} className="w-full h-full object-cover" />
                          <div className="absolute top-2 left-2 bg-white/95 px-2 py-0.5 rounded-full text-[10px] font-bold text-[#F97316]">
                            {m.match}% Match
                          </div>
                        </div>
                        <div className="p-4 flex-grow flex flex-col justify-between">
                          <div>
                            <h3 className="font-bold text-xs text-[#3E2723]">{m.name}, {m.age}</h3>
                            <p className="text-[10px] text-warm-muted">{m.education} ┬╖ {m.profession}</p>
                            <p className="text-[10px] text-[#F97316] font-semibold mt-1 flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" /> {m.location}
                            </p>
                          </div>
                          <div className="mt-3">
                            <button 
                              onClick={() => {
                                const copy = [...matrimonyList];
                                copy[i].interested = !copy[i].interested;
                                setMatrimonyList(copy);
                              }}
                              className={`w-full py-2 rounded-lg text-xs font-semibold transition ${
                                m.interested 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200" 
                                  : "border border-[#F97316] text-[#F97316] hover:bg-[#FFF5EE]"
                              }`}
                            >
                              {m.interested ? "Interest Sent Γ£ô" : "Express Interest"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* JOBS VIEW */}
              {activeNav === "Jobs" && (
                <motion.div key="jobs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold text-[#3E2723]">Community Career Opportunities</h2>
                      <p className="text-xs text-warm-muted mt-1">Connect community talent with community-owned businesses.</p>
                    </div>
                    <button onClick={() => setShowPostJob(true)} className="px-4 py-2 text-xs bg-[#F97316] text-white font-semibold rounded-xl flex items-center gap-1.5 shadow-md hover:bg-[#EA580C]">
                      <Plus className="w-4 h-4" /> Post a Job
                    </button>
                  </div>
                  <div className="space-y-3">
                    {jobList.map((job, i) => (
                      <div key={i} className="bg-white border border-[#EBE3DB] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center hover:shadow-md transition gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-orange-100 text-[#F97316] font-bold flex items-center justify-center text-lg">{job.logo ?? "J"}</div>
                          <div>
                            <h3 className="font-bold text-sm text-[#3E2723]">{job.role}</h3>
                            <p className="text-xs text-warm-muted">{job.company} ┬╖ {job.location}</p>
                            <div className="flex gap-2 mt-1">
                              <span className="text-[9px] bg-orange-50 text-[#F97316] font-semibold px-2 py-0.5 rounded-full">{job.salary ?? "Competitive"}</span>
                              <span className="text-[9px] bg-[#FAF3EC] text-[#5C4033] font-semibold px-2 py-0.5 rounded-full">{job.type ?? "Full-time"}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                          <button 
                            onClick={() => {
                              const copy = [...jobList];
                              copy[i].applied = !copy[i].applied;
                              setJobList(copy);
                            }}
                            className={`flex-1 md:flex-none text-xs px-5 py-2 rounded-xl font-semibold transition ${
                              job.applied 
                                ? "bg-emerald-100 text-emerald-700" 
                                : "bg-[#F97316] text-white hover:bg-[#EA580C]"
                            }`}
                          >
                            {job.applied ? "Applied" : "Apply Now"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* EVENTS VIEW */}
              {activeNav === "Events" && (
                <motion.div key="events" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Samaj Events Calendar</h2>
                    <span className="text-xs text-warm-muted">Upcoming events across state & country</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-5">
                    {eventList.slice(0, 6).map((ev: any, i) => (
                      <div key={i} className="bg-white border border-[#EBE3DB] rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                        <img src={ev.img ?? "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop"} alt="" className="w-full h-40 object-cover" />
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="text-[10px] text-[#F97316] font-bold">{ev.date} ┬╖ {ev.venue}</div>
                            <h3 className="font-bold text-sm text-[#3E2723] mt-1">{ev.title}</h3>
                            <p className="text-xs text-warm-muted line-clamp-2 mt-1">{ev.desc}</p>
                          </div>
                          <div className="flex items-center justify-between border-t border-[#F3E8DE] pt-3">
                            <span className="text-[10px] text-warm-muted">{ev.attendees} Attending</span>
                            <button 
                              onClick={() => {
                                if (ev.registered) {
                                  const copy = [...eventList];
                                  copy[i].registered = false;
                                  copy[i].attendees = Math.max(0, (copy[i].attendees || 0) - 1);
                                  setEventList(copy);
                                  toast.success(`Unregistered from ${ev.title}`);
                                } else {
                                  setRegisteringEvent({ event: ev, index: i });
                                  setRegForm({
                                    name: userProfile.name,
                                    email: userProfile.email,
                                    phone: userProfile.phone,
                                    attendees: 1
                                  });
                                }
                              }}
                              className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition cursor-pointer ${
                                ev.registered 
                                  ? "bg-emerald-100 text-emerald-700" 
                                  : "bg-[#F97316] text-white hover:bg-[#EA580C]"
                              }`}
                            >
                              {ev.registered ? "Registered Γ£ô" : "Register Now"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* DIRECTORY VIEW */}
              {activeNav === "Directory" && (
                <motion.div key="directory" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Samaj Member Directory</h2>
                    <span className="text-xs bg-[#FDF2E9] text-[#F97316] px-3 py-1 rounded-full font-bold">1.2M+ Verified Members</span>
                  </div>
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {PARTNERS.map((m, i) => (
                      <div key={i} className="bg-white border border-[#EBE3DB] rounded-2xl p-4 flex flex-col items-center text-center space-y-3 shadow-sm hover:shadow-md transition">
                        <img src={m.photo} alt={m.name} className="w-16 h-16 rounded-full object-cover border border-[#F3E8DE]" />
                        <div>
                          <span className="text-[8px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">KYC Verified</span>
                          <h3 className="font-bold text-sm text-[#3E2723] mt-1.5">{m.name}</h3>
                          <p className="text-[10px] text-warm-muted">{m.profession} ┬╖ {m.education}</p>
                          <p className="text-[10px] text-[#F97316] font-semibold mt-1 flex items-center gap-0.5 justify-center">
                            <MapPin className="w-3 h-3" /> {m.location}
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            const lastName = m.name.split(" ").pop();
                            const matched = families.find((f: any) => f.head.includes(lastName));
                            
                            if (matched && matched.members) {
                              const spouse = matched.members.find((mb: any) => mb.relation === "Spouse") || { name: "Spouse", occupation: "Homemaker" };
                              const son = matched.members.find((mb: any) => mb.relation === "Son") || { name: "Son", occupation: "Student" };
                              const daughter = matched.members.find((mb: any) => mb.relation === "Daughter") || { name: "Daughter", occupation: "Student" };
                              
                              setSelectedFamilyTree({
                                name: m.name,
                                profession: m.profession,
                                father: { name: matched.head, occupation: matched.members[0]?.occupation || "Retired" },
                                mother: { name: spouse.name, occupation: spouse.occupation },
                                siblings: [
                                  { name: son.name, relation: "Brother", occupation: son.occupation },
                                  { name: daughter.name, relation: "Sister", occupation: daughter.occupation }
                                ]
                              });
                            } else {
                              setSelectedFamilyTree({
                                name: m.name,
                                profession: m.profession,
                                father: { name: `Arvindbhai ${lastName}`, occupation: "Business Owner" },
                                mother: { name: `Geetaben ${lastName}`, occupation: "Homemaker" },
                                siblings: [
                                  { name: `Hardik ${lastName}`, relation: "Brother", occupation: "Software Engineer" },
                                  { name: `Pooja ${lastName}`, relation: "Sister", occupation: "Doctor" }
                                ]
                              });
                            }
                          }}
                          className="w-full py-1.5 rounded-lg border border-[#F3E8DE] hover:bg-[#FAF3EC] text-xs font-semibold text-[#5C4033] transition cursor-pointer"
                        >
                          View Family Tree
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* BUSINESS DIRECTORY VIEW */}
              {activeNav === "Business Directory" && (
                <motion.div key="business" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Samaj Business Directory</h2>
                    <span className="text-xs text-warm-muted">Support and grow community-owned businesses</span>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {BUSINESSES.map((b) => (
                      <div key={b.id} className="bg-white border border-[#EBE3DB] rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition shadow-sm">
                        <img src={b.img} alt={b.name} className="w-full h-32 object-cover" />
                        <div className="p-4 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="text-[8px] uppercase tracking-wider text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full w-max">
                              {b.category}
                            </div>
                            <h3 className="font-bold text-sm text-[#3E2723] mt-2">{b.name}</h3>
                            <p className="text-[10px] text-warm-muted mt-1 leading-snug">{b.desc}</p>
                          </div>
                          <div className="border-t border-[#F3E8DE] mt-4 pt-3 flex items-center justify-between text-xs font-semibold">
                            <span className="flex items-center gap-0.5 text-amber-500">Γÿà {b.rating}</span>
                            <span className="text-[#F97316]">≡ƒæñ {b.owner}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* DONATIONS VIEW */}
              {activeNav === "Donations" && (
                <motion.div key="donations" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#3E2723]">Donations & Campaigns</h2>
                      <p className="text-xs text-warm-muted mt-1">Support community-driven development and trust initiatives.</p>
                    </div>
                    {/* Tabs switcher */}
                    <div className="flex bg-[#FAF3EC] border border-[#EBE3DB] rounded-xl p-1 gap-1">
                      <button 
                        onClick={() => setDonationTab("campaigns")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          donationTab === "campaigns" ? "bg-white text-[#F97316] shadow-2xs font-bold" : "text-[#5C4033] hover:text-[#3E2723]"
                        }`}
                      >
                        Active Campaigns
                      </button>
                      <button 
                        onClick={() => setDonationTab("history")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          donationTab === "history" ? "bg-white text-[#F97316] shadow-2xs font-bold" : "text-[#5C4033] hover:text-[#3E2723]"
                        }`}
                      >
                        Donation History
                      </button>
                    </div>
                  </div>

                  {donationTab === "campaigns" ? (
                    <div className="grid md:grid-cols-2 gap-6">
                      {campaignList.map((item) => {
                        const goalVal = item.goal || 1000000;
                        const raisedVal = item.raised || 0;
                        const pct = Math.min(100, Math.round((raisedVal / goalVal) * 100));
                        return (
                          <div key={item.id} className="bg-white border border-[#EBE3DB] rounded-[20px] p-5 space-y-4 shadow-xs flex flex-col justify-between">
                            <div>
                              <h3 className="font-bold text-base text-[#3E2723]">{item.title}</h3>
                              <p className="text-xs text-warm-muted mt-1">{item.desc}</p>
                              
                              {/* Progress bar */}
                              <div className="space-y-1.5 mt-4">
                                <div className="flex justify-between text-xs font-bold">
                                  <span>Γé╣{raisedVal.toLocaleString()} raised</span>
                                  <span>Goal: Γé╣{goalVal.toLocaleString()}</span>
                                </div>
                                <div className="h-2 bg-[#FFF5EE] rounded-full overflow-hidden border border-[#F3E8DE]">
                                  <div className="h-full bg-[#F97316] rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="text-[10px] text-[#F97316] font-bold text-right">{pct}% Completed</div>
                              </div>
                            </div>

                            <div className="border-t border-[#F3E8DE] pt-4 flex gap-3 items-center">
                              <div className="relative flex-1">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8C6D58]">Γé╣</span>
                                <input 
                                  type="number" 
                                  placeholder="Enter amount" 
                                  value={donateAmount[item.id] || ""}
                                  onChange={(e) => setDonateAmount({ ...donateAmount, [item.id]: e.target.value })}
                                  className="w-full pl-6 pr-3 py-2 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316]"
                                />
                              </div>
                              <button 
                                onClick={async () => {
                                  const amount = donateAmount[item.id];
                                  if (!amount || Number(amount) <= 0) return;
                                  
                                  const payload = {
                                    donor: userProfile.name,
                                    amount: parseInt(amount),
                                    campaign: item.id,
                                    note: "Online donation through dashboard",
                                    method: "UPI",
                                    status: "Success"
                                  };

                                  try {
                                    const res = await api.createDonation(payload);
                                    const updated = campaignList.map(c => {
                                      if (c.id === item.id) {
                                        return { ...c, raised: (c.raised || 0) + parseInt(amount) };
                                      }
                                      return c;
                                    });
                                    setCampaignList(updated);
                                    
                                    setUserDonations([
                                      {
                                        ...res,
                                        campaign_title: item.title,
                                        campaign: item.id
                                      },
                                      ...userDonations
                                    ]);

                                    setShowReceipt({
                                      campaign: item.title,
                                      amount: amount,
                                      txnId: `TXN${res.id || Math.floor(100000 + Math.random() * 900000)}`,
                                      date: new Date().toLocaleDateString()
                                    });
                                    setDonateAmount({ ...donateAmount, [item.id]: "" });
                                    toast.success("Thank you for your generous donation!");
                                  } catch (err) {
                                    console.error("Donation failed", err);
                                    toast.error("Failed to register donation.");
                                  }
                                }}
                                className="bg-[#F97316] text-white text-xs font-semibold py-2 px-5 rounded-xl hover:bg-[#EA580C] transition shadow-sm cursor-pointer"
                              >
                                Donate
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#EBE3DB] rounded-2xl overflow-hidden shadow-sm">
                      {userDonations.length === 0 ? (
                        <div className="p-8 text-center text-warm-muted text-xs">
                          You haven't made any donations yet. Go to active campaigns to contribute!
                        </div>
                      ) : (
                        <table className="w-full text-sm">
                          <thead className="bg-[#FAF3EC]">
                            <tr>
                              {["Campaign", "Amount", "Date", "Method", "Status", "Receipt"].map(h => (
                                <th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {userDonations.map((d, i) => (
                              <tr key={i} className="border-t border-[#EBE3DB] hover:bg-[#FFF8F2]">
                                <td className="p-3 text-xs font-bold text-[#3E2723]">{d.campaign_title || `Campaign #${d.campaign}`}</td>
                                <td className="p-3 text-xs font-extrabold text-[#F97316]">Γé╣{d.amount.toLocaleString()}</td>
                                <td className="p-3 text-xs text-warm-muted">{new Date(d.date || new Date()).toLocaleDateString()}</td>
                                <td className="p-3 text-xs text-warm-muted">{d.method}</td>
                                <td className="p-3">
                                  <span className="bg-[#E8F5E9] text-[#2E7D32] text-[10px] font-bold px-2 py-0.5 rounded-full border border-[#C8E6C9]">
                                    {d.status || "Success"}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <button 
                                    onClick={() => downloadReceiptPdf({
                                      campaign: d.campaign_title || `Campaign #${d.campaign}`,
                                      amount: d.amount,
                                      txnId: `TXN${d.id || 1000 + i}`,
                                      date: new Date(d.date || new Date()).toLocaleDateString()
                                    })}
                                    className="flex items-center gap-1 text-[10px] font-bold text-[#F97316] hover:text-[#EA580C] cursor-pointer"
                                  >
                                    <Download className="w-3.5 h-3.5" /> PDF
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {/* GALLERY VIEW */}
              {activeNav === "Gallery" && (
                <motion.div key="gallery" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Samaj Photo Gallery</h2>
                    <span className="text-xs text-warm-muted">Moments of celebrations and gatherings</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {GALLERY_IMAGES.map((img, i) => (
                      <div key={i} onClick={() => setSelectedPhoto(img)} className="group relative rounded-2xl overflow-hidden border border-[#EBE3DB] aspect-video shadow-sm hover:shadow-md cursor-pointer transition">
                        <img src={img} alt="gallery" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                          <span className="text-white text-xs font-bold border border-white px-3 py-1.5 rounded-full flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" /> View Photo
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* VIDEOS VIEW */}
              {activeNav === "Videos" && (
                <motion.div key="videos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Popular Videos</h2>
                    <span className="text-xs text-warm-muted">Watch events and cultural video programs</span>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    {POPULAR_VIDEOS.map((vid, i) => (
                      <div key={i} onClick={() => setSelectedVideo(vid)} className="bg-white rounded-2xl border border-[#EBE3DB] overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition">
                        <div className="relative aspect-video">
                          <img src={vid.img} alt={vid.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/95 shadow-lg flex items-center justify-center text-[#F97316]">
                              <Play className="w-5 h-5 fill-current ml-0.5" />
                            </div>
                          </div>
                          <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                            {vid.duration}
                          </span>
                        </div>
                        <div className="p-4 text-left">
                          <h4 className="font-bold text-sm text-[#3E2723]">{vid.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* DOCUMENTS VIEW */}
              {activeNav === "Documents" && (
                <motion.div key="documents" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">Official Samaj Documents</h2>
                    <span className="text-xs text-warm-muted">Download trust documents, certificates, and reports</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { title: "Samaj Rules & Constitution 2025.pdf", size: "2.4 MB", type: "PDF Document" },
                      { title: "Annual General Meeting Minutes - Dec 2025.pdf", size: "1.8 MB", type: "Meeting Minutes" },
                      { title: "Trust Audit Report FY 2024-25.pdf", size: "4.1 MB", type: "Financial Report" }
                    ].map((doc, i) => (
                      <div key={i} className="bg-white border border-[#EBE3DB] rounded-2xl p-4 flex justify-between items-center shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-orange-50 text-[#F97316] flex items-center justify-center">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#3E2723]">{doc.title}</h3>
                            <p className="text-[10px] text-warm-muted">{doc.type} ┬╖ {doc.size}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => alert(`Downloading ${doc.title}...`)}
                          className="w-9 h-9 rounded-xl bg-[#FAF3EC] hover:bg-[#FDF2E9] hover:text-[#F97316] flex items-center justify-center text-[#5C4033] transition"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* MY NETWORK VIEW */}
              {activeNav === "My Network" && (
                <motion.div key="network" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-[#3E2723]">My Samaj Family Network</h2>
                    <span className="text-xs text-warm-muted">Visual family connections hierarchy</span>
                  </div>
                  
                  <div className="bg-white border border-[#EBE3DB] rounded-2xl p-6 shadow-sm flex flex-col items-center">
                    {/* Interactive family tree layout */}
                    <div className="space-y-8 w-full max-w-lg">
                      {/* Grandparent */}
                      <div className="flex justify-center">
                        <div className="bg-[#FFF5EE] border-2 border-[#EBE3DB] p-3 rounded-xl text-center w-40">
                          <div className="font-bold text-xs">Late Purshottam Patel</div>
                          <div className="text-[9px] text-warm-muted">Grandfather</div>
                        </div>
                      </div>
                      <div className="w-0.5 h-6 bg-[#EBE3DB] mx-auto"></div>
                      
                      {/* Father */}
                      <div className="flex justify-center">
                        <div className="bg-[#FFF5EE] border-2 border-[#EBE3DB] p-3 rounded-xl text-center w-40">
                          <div className="font-bold text-xs">Arvindbhai Patel</div>
                          <div className="text-[9px] text-warm-muted">Father (Ahmedabad)</div>
                        </div>
                      </div>
                      <div className="w-0.5 h-6 bg-[#EBE3DB] mx-auto"></div>

                      {/* Main User & Spouse */}
                      <div className="flex justify-center gap-12">
                        <div className="bg-[#FDF2E9] border-2 border-[#F97316] p-3 rounded-xl text-center w-40 shadow-sm">
                          <div className="font-bold text-xs text-[#F97316]">{userProfile.name}</div>
                          <div className="text-[9px] text-[#F97316] font-semibold">Self</div>
                        </div>
                        <div className="bg-[#FFF5EE] border-2 border-[#EBE3DB] p-3 rounded-xl text-center w-40">
                          <div className="font-bold text-xs">Kajal Patel</div>
                          <div className="text-[9px] text-warm-muted">Spouse</div>
                        </div>
                      </div>
                      <div className="w-0.5 h-6 bg-[#EBE3DB] mx-auto"></div>

                      {/* Children */}
                      <div className="flex justify-center gap-12">
                        <div className="bg-[#FFF5EE] border-2 border-[#EBE3DB] p-3 rounded-xl text-center w-40">
                          <div className="font-bold text-xs">Aarav Patel</div>
                          <div className="text-[9px] text-warm-muted">Son (Age: 16)</div>
                        </div>
                        <div className="bg-[#FFF5EE] border-2 border-[#EBE3DB] p-3 rounded-xl text-center w-40">
                          <div className="font-bold text-xs">Diya Patel</div>
                          <div className="text-[9px] text-warm-muted">Daughter (Age: 12)</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* SETTINGS VIEW */}
              {activeNav === "Settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <h2 className="text-2xl font-bold text-[#3E2723]">Profile & Settings</h2>
                  
                  <div className="bg-white border border-[#EBE3DB] rounded-[20px] p-6 shadow-sm max-w-2xl">
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      alert("Profile updated successfully!");
                    }} className="space-y-4">
                      
                      <div className="flex flex-col sm:flex-row gap-4 items-center pb-4 border-b border-[#F3E8DE]">
                        <img src={userProfile.avatar} alt="Profile" className="w-16 h-16 rounded-full object-cover border-2 border-[#F97316]" />
                        <div>
                          <h3 className="font-bold text-sm">{userProfile.name}</h3>
                          <p className="text-xs text-warm-muted">{userProfile.samaj} ┬╖ {userProfile.membership}</p>
                          <button type="button" onClick={() => alert("Upload feature is coming soon")} className="mt-2 text-xs font-semibold text-[#F97316] hover:underline">Change Profile Photo</button>
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#5C4033]">Full Name</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D58]" />
                            <input 
                              type="text" 
                              value={userProfile.name} 
                              onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#5C4033]">Email Address</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D58]" />
                            <input 
                              type="email" 
                              value={userProfile.email} 
                              onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#5C4033]">Phone Number</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D58]" />
                            <input 
                              type="text" 
                              value={userProfile.phone} 
                              onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#5C4033]">Community Samaj</label>
                          <div className="relative">
                            <HomeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6D58]" />
                            <input 
                              type="text" 
                              value={userProfile.samaj} 
                              disabled
                              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-[#EBE3DB] bg-[#F5EDE5] text-[#8C6D58] cursor-not-allowed"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-[#5C4033]">Residential Address</label>
                        <textarea 
                          value={userProfile.address} 
                          onChange={(e) => setUserProfile({ ...userProfile, address: e.target.value })}
                          rows={2}
                          className="w-full p-3 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316] resize-none"
                        />
                      </div>

                      <div className="pt-2">
                        <button type="submit" className="bg-[#F97316] text-white text-xs font-semibold py-2 px-6 rounded-xl hover:bg-[#EA580C] transition shadow-md">
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}

              {/* SUBSCRIPTION VIEW */}
              {activeNav === "Subscription" && (
                <motion.div key="subscription" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6 text-left">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-[#3E2723]">Premium Memberships</h2>
                      <p className="text-xs text-warm-muted mt-1 font-medium">Empower your family and connect globally with our premium tiers.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white border border-[#EBE3DB] rounded-2xl px-4 py-2 self-start sm:self-auto shadow-2xs">
                      <span className="text-[10px] text-warm-muted font-bold">CURRENT STATUS:</span>
                      <span className="text-xs font-extrabold text-[#F97316] bg-[#FFF5EE] border border-[#F3E8DE] px-2.5 py-0.5 rounded-full">{userProfile.membership}</span>
                    </div>
                  </div>

                  {/* Pricing Tiers Grid */}
                  <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
                    {/* Free Plan */}
                    <div className="bg-white border border-[#EBE3DB] rounded-[24px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition hover:shadow-md duration-200">
                      <div>
                        <div className="w-10 h-10 rounded-2xl bg-[#FAF3EC] text-[#8C6D58] flex items-center justify-center border border-[#EBE3DB]/40 mb-4">
                          <User className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#3E2723]">Basic Member</h3>
                        <p className="text-[11px] text-warm-muted mt-1">Access the community and see local news.</p>
                        
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-[#3E2723]">Γé╣0</span>
                          <span className="text-xs text-warm-muted font-medium">/ year</span>
                        </div>

                        <ul className="mt-6 space-y-3">
                          {[
                            "View Member Directory",
                            "Join up to 3 Communities",
                            "Read Public News & Announcements",
                            "View Public Events list"
                          ].map((feat, i) => (
                            <li key={i} className="flex gap-2 text-xs font-semibold text-[#5C4033] items-start">
                              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button 
                        disabled={userProfile.membership === "Basic Member"}
                        onClick={() => {
                          setUserProfile({ ...userProfile, membership: "Basic Member" });
                          alert("Downgraded to Basic Member successfully!");
                        }}
                        className={`w-full mt-8 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                          userProfile.membership === "Basic Member"
                            ? "bg-[#FAF3EC] border border-[#EBE3DB] text-warm-muted cursor-default"
                            : "bg-[#FFF5EE] border border-[#EBE3DB] hover:bg-[#F3E8DE] text-[#3E2723]"
                        }`}
                      >
                        {userProfile.membership === "Basic Member" ? "Current Plan" : "Downgrade"}
                      </button>
                    </div>

                    {/* Premium Plan (Popular) */}
                    <div className="bg-white border-2 border-[#F97316] rounded-[24px] p-6 shadow-md flex flex-col justify-between relative overflow-hidden transition hover:shadow-lg duration-200">
                      <div className="absolute top-3 right-3 bg-[#F97316] text-white text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                        Popular
                      </div>
                      <div>
                        <div className="w-10 h-10 rounded-2xl bg-[#FFF5EE] text-[#F97316] flex items-center justify-center border border-[#F3E8DE] mb-4">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#3E2723]">Premium Member</h3>
                        <p className="text-[11px] text-warm-muted mt-1">Unlock matrimonial, business directory & jobs.</p>
                        
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-[#3E2723]">Γé╣999</span>
                          <span className="text-xs text-warm-muted font-medium">/ year</span>
                        </div>

                        <ul className="mt-6 space-y-3">
                          {[
                            "Everything in Basic, plus:",
                            "Create Matrimonial Profiles",
                            "List up to 2 Businesses in Directory",
                            "Post & Apply for Jobs",
                            "Direct Messages & Community Chats",
                            "Join Unlimited Communities"
                          ].map((feat, i) => (
                            <li key={i} className="flex gap-2 text-xs font-semibold text-[#5C4033] items-start">
                              <Check className="w-4 h-4 text-[#F97316] flex-shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button 
                        disabled={userProfile.membership === "Premium Member"}
                        onClick={() => {
                          setUserProfile({ ...userProfile, membership: "Premium Member" });
                          alert("Upgraded to Premium Member successfully! Thank you for your support!");
                        }}
                        className={`w-full mt-8 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                          userProfile.membership === "Premium Member"
                            ? "bg-[#FAF3EC] border border-[#EBE3DB] text-warm-muted cursor-default"
                            : "bg-[#F97316] text-white hover:bg-[#EA580C] shadow-md shadow-[#F97316]/20"
                        }`}
                      >
                        {userProfile.membership === "Premium Member" ? "Current Plan" : "Upgrade to Premium"}
                      </button>
                    </div>

                    {/* Elite Plan */}
                    <div className="bg-white border border-[#EBE3DB] rounded-[24px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition hover:shadow-md duration-200">
                      <div>
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/50 mb-4">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h3 className="text-base font-extrabold text-[#3E2723]">Patron Member</h3>
                        <p className="text-[11px] text-warm-muted mt-1">Lifetime VIP member of the Samaj community.</p>
                        
                        <div className="mt-4 flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold text-[#3E2723]">Γé╣9,999</span>
                          <span className="text-xs text-warm-muted font-medium">/ lifetime</span>
                        </div>

                        <ul className="mt-6 space-y-3">
                          {[
                            "Everything in Premium, plus:",
                            "VIP Front-row Invites to physical events",
                            "Golden Lifetime Member Badge",
                            "Featured in Samaj Hall of Fame",
                            "Post Unlimited Jobs & Business Listings",
                            "Personalized Family Tree Creator"
                          ].map((feat, i) => (
                            <li key={i} className="flex gap-2 text-xs font-semibold text-[#5C4033] items-start">
                              <Check className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button 
                        disabled={userProfile.membership === "Patron Member"}
                        onClick={() => {
                          setUserProfile({ ...userProfile, membership: "Patron Member" });
                          alert("Thank you for becoming a Patron Life Member! A physical VIP kit will be shipped to your address.");
                        }}
                        className={`w-full mt-8 py-2.5 rounded-xl text-xs font-bold transition duration-200 ${
                          userProfile.membership === "Patron Member"
                            ? "bg-[#FAF3EC] border border-[#EBE3DB] text-warm-muted cursor-default"
                            : "bg-purple-600 text-white hover:bg-purple-700 shadow-md shadow-purple-600/20"
                        }`}
                      >
                        {userProfile.membership === "Patron Member" ? "Current Plan" : "Become Patron Member"}
                      </button>
                    </div>
                  </div>

                  {/* FAQ section */}
                  <div className="bg-white border border-[#EBE3DB] rounded-[24px] p-6 shadow-sm max-w-5xl space-y-4">
                    <h3 className="font-extrabold text-sm text-[#3E2723]">Frequently Asked Questions</h3>
                    <div className="grid md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div>
                        <h4 className="font-bold text-[#3E2723]">Where do my subscription fees go?</h4>
                        <p className="text-warm-muted mt-1">All proceeds go directly into running community events, maintaining the digital directory infrastructure, and organizing educational and medical assistance funds for disadvantaged members.</p>
                      </div>
                      <div>
                        <h4 className="font-bold text-[#3E2723]">Can I cancel or change my plan anytime?</h4>
                        <p className="text-warm-muted mt-1">Yes, you can upgrade, downgrade, or cancel your subscription at any time. Downgrades take effect at the end of the current billing cycle.</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* 4. Right Sidebar Panel */}
          {activeNav !== "Dashboard" && (
            <aside className="w-[320px] flex-shrink-0 border-l border-[#EBE3DB] bg-[#FAF3EC]/50 p-6 space-y-6 sticky top-16 h-[calc(100vh-4rem)] hidden xl:block overflow-y-auto z-10 pr-4">
              
              {/* Upcoming Events */}
              <div className="bg-white rounded-[20px] border border-[#EBE3DB] p-4 space-y-3.5 shadow-sm text-left">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs text-[#3E2723] tracking-wide">Upcoming Events</h3>
                  <button onClick={() => handleNavClick("Events")} className="text-[10px] font-bold text-[#F97316] hover:underline">
                    View All ΓåÆ
                  </button>
                </div>

                <div className="space-y-3">
                  {EVENTS_ITEMS.map((ev, i) => (
                    <div key={i} className="flex items-center gap-3 group cursor-pointer" onClick={() => handleNavClick("Events")}>
                      {/* Date Block */}
                      <div className="w-10 h-10 rounded-xl bg-[#FFF5EE] border border-[#F3E8DE] flex flex-col items-center justify-center flex-shrink-0 group-hover:border-[#F97316]/30 group-hover:bg-[#FDF2E9] transition duration-200">
                        <span className="text-xs font-extrabold text-[#F97316] leading-none">{ev.day}</span>
                        <span className="text-[8px] font-bold text-warm-muted leading-none mt-0.5">{ev.month}</span>
                      </div>

                      <div className="text-xs leading-snug">
                        <h4 className="font-bold text-[#3E2723] line-clamp-1 group-hover:text-[#F97316] transition duration-200">{ev.title}</h4>
                        <p className="text-[9px] text-warm-muted flex items-center gap-0.5 mt-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#F97316]" /> {ev.location} ┬╖ {ev.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Today's Highlights Timeline */}
              <div className="bg-white rounded-[20px] border border-[#EBE3DB] p-4 space-y-3.5 shadow-sm text-left relative overflow-hidden">
                <h3 className="font-bold text-xs text-[#3E2723] tracking-wide">Today's Highlights</h3>
                
                <div className="relative space-y-4 pl-1">
                  {/* Timeline vertical connector */}
                  <div className="absolute left-[13px] top-3 bottom-3 w-[1.5px] bg-[#EBE3DB]/60 border-dashed border-l border-[#EBE3DB]/70" />

                  {HIGHLIGHTS.map((item, i) => (
                    <div key={i} className="flex gap-3.5 items-start relative z-10">
                      <div className={`w-7 h-7 rounded-full ${item.color} flex items-center justify-center flex-shrink-0 shadow-2xs border border-[#F3E8DE]/40`}>
                        <item.icon className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-[10px] leading-tight text-left pt-0.5">
                        <p className="text-warm-muted font-medium">{item.type}</p>
                        <p className="font-bold text-[#3E2723] mt-0.5">
                          {item.name} <span className="font-normal text-warm-muted text-[9px]">{item.detail}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* 5. Mobile Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#FAF3EC] border-t border-[#EBE3DB] flex items-center justify-around px-2 z-40">
        {[
          { label: "Home", icon: LayoutDashboard },
          { label: "Samachar", icon: Newspaper },
          { label: "Matrimony", icon: Heart },
          { label: "Jobs", icon: Briefcase },
          { label: "Events", icon: Calendar }
        ].map((item, i) => (
          <button 
            key={i} 
            onClick={() => handleNavClick(item.label === "Home" ? "Dashboard" : item.label)}
            className="flex flex-col items-center gap-1 text-[9px] text-[#8C6D58]"
          >
            <item.icon className={`w-5 h-5 ${
              (activeNav === "Dashboard" && item.label === "Home") || activeNav === item.label
                ? "text-[#F97316]" 
                : "text-[#8C6D58]"
            }`} />
            <span className={
              (activeNav === "Dashboard" && item.label === "Home") || activeNav === item.label
                ? "text-[#F97316] font-bold" 
                : "text-warm-muted font-medium"
            }>
              {item.label}
            </span>
          </button>
        ))}
      </div>

      {/* --- INTERACTIVE MODALS --- */}
      
      {/* 1. News Detail Modal */}
      {selectedNews && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-[#EBE3DB] rounded-3xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 relative shadow-2xl text-left">
            <button onClick={() => setSelectedNews(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF3EC] flex items-center justify-center hover:bg-[#FDF2E9] hover:text-[#F97316] transition">
              <X className="w-4 h-4" />
            </button>
            <img src={selectedNews.img} alt="" className="w-full h-48 object-cover rounded-2xl shadow-xs" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#F97316] bg-[#FFF5EE] px-2.5 py-0.5 rounded-full">{selectedNews.category}</span>
              <h3 className="font-extrabold text-base text-[#3E2723] mt-2 leading-snug">{selectedNews.title}</h3>
              <p className="text-xs text-warm-muted mt-1 font-medium">Published on {selectedNews.date || "Today"} ┬╖ {selectedNews.location || "General"}</p>
            </div>
            <p className="text-xs text-warm-muted leading-relaxed whitespace-pre-line">
              {selectedNews.excerpt} Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam nec finibus ex. Praesent hendrerit sem sem, ac elementum lacus sollicitudin eu. Phasellus mollis lectus sit amet dui viverra pulvinar. Proin non elit ac lectus iaculis dictum. 
              <br /><br />
              Sed ac finibus neque, sit amet feugiat ex. Quisque pretium lorem ex, eget imperdiet erat commodo at. Duis consequat accumsan scelerisque. Curabitur vitae purus eleifend, iaculis erat sit amet, sodales erat.
            </p>
          </motion.div>
        </div>
      )}

      {/* 2. Video Player Modal */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-black border border-white/10 rounded-3xl overflow-hidden max-w-2xl w-full relative shadow-2xl">
            <button onClick={() => setSelectedVideo(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition">
              <X className="w-4 h-4" />
            </button>
            <div className="relative aspect-video">
              <img src={selectedVideo.img} alt="" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 bg-black/40">
                <Play className="w-16 h-16 text-white stroke-[1.5]" />
                <h3 className="font-bold text-base mt-4">{selectedVideo.title}</h3>
                <p className="text-xs text-white/70 mt-1">Playing dummy stream... ({selectedVideo.duration})</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 3. Photo Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="max-w-3xl w-full max-h-[85vh] relative flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedPhoto(null)} className="absolute -top-12 right-0 w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition">
              <X className="w-4 h-4" />
            </button>
            <img src={selectedPhoto} alt="Gallery view" className="max-w-full max-h-[75vh] object-contain rounded-2xl border border-white/10" />
          </motion.div>
        </div>
      )}

      {/* 4. Post Job Form Modal */}
      {showPostJob && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-[#EBE3DB] rounded-3xl max-w-md w-full p-6 space-y-4 relative shadow-2xl text-left">
            <button onClick={() => setShowPostJob(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF3EC] flex items-center justify-center hover:bg-[#FDF2E9] hover:text-[#F97316] transition">
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-extrabold text-base text-[#3E2723]">Post a New Job Opportunity</h3>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newJob.role || !newJob.company || !newJob.location) return;
              try {
                const jobPayload = {
                  role: newJob.role,
                  company: newJob.company,
                  location: newJob.location,
                  salary: newJob.salary || "Competitive",
                  type: "Full-time",
                  category: "Tech",
                  logo_letter: newJob.company.charAt(0).toUpperCase(),
                  applicants: 0,
                  desc: newJob.desc || "No description provided."
                };
                
                const createdJob = await api.createJob(jobPayload);
                const mappedJob = {
                  ...createdJob,
                  logo: createdJob.logo ?? createdJob.logo_letter ?? (createdJob.company ? createdJob.company.charAt(0).toUpperCase() : "J"),
                  applied: false
                };
                setJobList([mappedJob, ...jobList]);
                setNewJob({ role: "", company: "", location: "", desc: "", salary: "" });
                setShowPostJob(false);
              } catch (err) {
                console.error("Failed to save job to Django backend:", err);
                alert("Failed to save job to database.");
              }
            }} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C4033]">Job Role / Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Senior Accountant, Flutter Developer"
                  value={newJob.role}
                  onChange={(e) => setNewJob({ ...newJob, role: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C4033]">Company Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Patel Exports Ltd."
                  value={newJob.company}
                  onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5C4033]">Location</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ahmedabad, Surat"
                    value={newJob.location}
                    onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#5C4033]">Salary Range</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Γé╣6-8 LPA"
                    value={newJob.salary}
                    onChange={(e) => setNewJob({ ...newJob, salary: e.target.value })}
                    className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316]"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C4033]">Brief Job Description</label>
                <textarea 
                  rows={2}
                  placeholder="Responsibilities, requirements, skills..."
                  value={newJob.desc}
                  onChange={(e) => setNewJob({ ...newJob, desc: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-[#FFF8F2] focus:outline-none focus:border-[#F97316] resize-none"
                />
              </div>
              <button type="submit" className="w-full mt-2 py-2.5 bg-[#F97316] text-white text-xs font-bold rounded-xl hover:bg-[#EA580C] shadow-md transition">
                Submit Job Post
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 5. Event Registration Modal */}
      {registeringEvent && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#FFF5EE] border border-[#EBE3DB] rounded-[32px] max-w-md w-full p-6 space-y-5 relative shadow-2xl text-left">
            <button onClick={() => setRegisteringEvent(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF3EC] flex items-center justify-center hover:bg-[#FDF2E9] hover:text-[#F97316] transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            <div className="space-y-1">
              <h3 className="font-extrabold text-lg text-[#3E2723]">Register for Event</h3>
              <p className="text-xs text-warm-muted">{registeringEvent.event.title}</p>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const payload = {
                attendees: (registeringEvent.event.attendees || 0) + regForm.attendees
              };
              try {
                await api.updateEvent(registeringEvent.event.id, payload);
                await api.createEventRegistration({
                  event: registeringEvent.event.id,
                  name: regForm.name,
                  email: regForm.email,
                  phone: regForm.phone,
                  attendees: regForm.attendees
                });
                const copy = [...eventList];
                copy[registeringEvent.index].registered = true;
                copy[registeringEvent.index].attendees = payload.attendees;
                setEventList(copy);
                setRegisteringEvent(null);
                toast.success("Successfully registered for the event!");
              } catch (err) {
                console.error("Failed to register for event", err);
                toast.error("Failed to register. Please try again.");
              }
            }} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C4033]">Your Name</label>
                <input 
                  type="text" 
                  required
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C4033]">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C4033]">Phone Number</label>
                <input 
                  type="text" 
                  required
                  value={regForm.phone}
                  onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-white focus:outline-none focus:border-[#F97316]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#5C4033]">Number of Attendees</label>
                <select 
                  value={regForm.attendees}
                  onChange={(e) => setRegForm({ ...regForm, attendees: parseInt(e.target.value) })}
                  className="w-full p-2.5 text-xs rounded-xl border border-[#EBE3DB] bg-white focus:outline-none focus:border-[#F97316]"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{n} {n === 1 ? "Person" : "People"}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-[#F97316] text-white text-xs font-bold rounded-xl hover:bg-[#EA580C] shadow-md transition cursor-pointer">
                Confirm Registration
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 6. Family Tree Modal */}
      {selectedFamilyTree && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#FFF5EE] border border-[#EBE3DB] rounded-[32px] max-w-lg w-full p-6 text-center space-y-6 relative shadow-2xl">
            <button onClick={() => setSelectedFamilyTree(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF3EC] flex items-center justify-center hover:bg-[#FDF2E9] hover:text-[#F97316] transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-[#3E2723] text-lg flex items-center justify-center gap-1.5">
                <Network className="w-5 h-5 text-[#F97316]" /> Family Tree of {selectedFamilyTree.name}
              </h3>
              <p className="text-xs text-warm-muted">Genealogy and relationships within the samaj</p>
            </div>

            {/* Visual Family Tree Representation */}
            <div className="bg-white rounded-2xl p-5 border border-[#EBE3DB]/60 space-y-6 shadow-2xs relative overflow-hidden text-left">
              {/* Gen 1: Parents */}
              <div className="flex justify-center gap-6 relative">
                {/* Connector Line to Children */}
                <div className="absolute bottom-[-16px] left-1/2 -translate-x-1/2 w-0.5 h-4 bg-[#EBE3DB]" />
                
                <div className="bg-[#FFF8F2] border border-[#EBE3DB] p-2.5 rounded-xl text-center w-28 shadow-2xs">
                  <span className="text-[9px] font-bold text-[#F97316] bg-[#FDF2E9] px-2 py-0.5 rounded-full block w-max mx-auto mb-1">Father</span>
                  <div className="text-[11px] font-bold text-[#3E2723] truncate">{selectedFamilyTree.father.name}</div>
                  <div className="text-[8px] text-warm-muted truncate">{selectedFamilyTree.father.occupation}</div>
                </div>

                <div className="bg-[#FFF8F2] border border-[#EBE3DB] p-2.5 rounded-xl text-center w-28 shadow-2xs">
                  <span className="text-[9px] font-bold text-[#F97316] bg-[#FDF2E9] px-2 py-0.5 rounded-full block w-max mx-auto mb-1">Mother</span>
                  <div className="text-[11px] font-bold text-[#3E2723] truncate">{selectedFamilyTree.mother.name}</div>
                  <div className="text-[8px] text-warm-muted truncate">{selectedFamilyTree.mother.occupation}</div>
                </div>
              </div>

              {/* Gen 2: Self & Siblings */}
              <div className="pt-2 relative">
                {/* Horizontal Connector Line for siblings */}
                <div className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-[#EBE3DB]" />
                <div className="absolute top-0 left-1/4 w-0.5 h-2 bg-[#EBE3DB]" />
                <div className="absolute top-0 right-1/4 w-0.5 h-2 bg-[#EBE3DB]" />
                
                <div className="flex justify-center gap-6 pt-2">
                  <div className="bg-[#FAF3EC] border-2 border-[#F97316] p-2.5 rounded-xl text-center w-28 shadow-2xs relative">
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] font-bold text-white bg-[#F97316] px-1.5 py-0.5 rounded-full">Self</span>
                    <div className="text-[11px] font-bold text-[#3E2723] truncate mt-1">{selectedFamilyTree.name}</div>
                    <div className="text-[8px] text-warm-muted truncate">{selectedFamilyTree.profession}</div>
                  </div>

                  {selectedFamilyTree.siblings.map((sib: any, idx: number) => (
                    <div key={idx} className="bg-[#FFF8F2] border border-[#EBE3DB] p-2.5 rounded-xl text-center w-28 shadow-2xs">
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full block w-max mx-auto mb-1">{sib.relation}</span>
                      <div className="text-[11px] font-bold text-[#3E2723] truncate">{sib.name}</div>
                      <div className="text-[8px] text-warm-muted truncate">{sib.occupation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* 7. Donation Receipt Modal */}
      {showReceipt && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white border border-[#EBE3DB] rounded-3xl max-w-sm w-full p-6 text-center space-y-4 relative shadow-2xl text-left">
            <button onClick={() => setShowReceipt(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF3EC] flex items-center justify-center hover:bg-[#FDF2E9] hover:text-[#F97316] transition cursor-pointer">
              <X className="w-4 h-4" />
            </button>
            
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-[#3E2723]">Donation Successful!</h3>
              <p className="text-xs text-warm-muted mt-1 font-medium">Thank you for supporting your samaj community.</p>
            </div>

            <div className="bg-[#FAF3EC] rounded-2xl p-4 text-xs space-y-2 border border-[#EBE3DB]/60">
              <div className="flex justify-between">
                <span className="text-warm-muted">Donor Name:</span>
                <span className="font-bold text-[#3E2723]">{userProfile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-muted">Campaign:</span>
                <span className="font-bold text-[#3E2723]">{showReceipt.campaign}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-muted">Transaction ID:</span>
                <span className="font-mono text-[#3E2723]">{showReceipt.txnId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-muted">Date:</span>
                <span className="font-bold text-[#3E2723]">{showReceipt.date}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#EBE3DB] text-sm">
                <span className="font-bold text-[#3E2723]">Amount Paid:</span>
                <span className="font-extrabold text-[#F97316]">Γé╣{parseInt(showReceipt.amount).toLocaleString()}</span>
              </div>
            </div>

            <button 
              onClick={() => {
                downloadReceiptPdf({
                  campaign: showReceipt.campaign,
                  amount: showReceipt.amount,
                  txnId: showReceipt.txnId,
                  date: showReceipt.date
                });
              }}
              className="w-full py-2 bg-gradient-to-r from-[#F97316] to-[#EA580C] text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-1.5 hover:shadow-lg transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" /> Download PDF Receipt
            </button>
            <button onClick={() => setShowReceipt(null)} className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition cursor-pointer">
              Close Receipt
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}

const SAMACHAR_ITEMS = [
  {
    id: "s1",
    title: "Samaj Yuva Sammelan 2024",
    location: "Ahmedabad, Gujarat",
    time: "2h ago",
    category: "Meeting Notice",
    excerpt: "The 42nd Annual Samaj Sammelan is scheduled for July 15, 2026 at Rajula Community Hall. All members are requested to attend.",
    img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=250&fit=crop"
  },
  {
    id: "s2",
    title: "Samajna Agraynio Sanman Samaroh",
    location: "Gandhinagar",
    time: "5h ago",
    category: "Achievement",
    excerpt: "Felicitation ceremony of community members with stellar academic and business performances this year at Gandhinagar Town Hall.",
    img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=400&h=250&fit=crop"
  },
  {
    id: "s3",
    title: "Nava Samaj Bhavan nu Lokarpan",
    location: "Surat",
    time: "1d ago",
    category: "General",
    excerpt: "Inauguration ceremony of the newly constructed Samaj Bhavan building in Surat with modern facilities.",
    img: "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=400&h=250&fit=crop"
  },
  {
    id: "s4",
    title: "500 Vruksh Ropan Karyakram",
    location: "Rajkot",
    time: "2d ago",
    category: "Eco Event",
    excerpt: "Tree plantation drive by youths of the community planted over 500 saplings in Rajkot green belt area.",
    img: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=250&fit=crop"
  }
];

const PARTNERS = [
  { name: "Kinjal Patel", age: 27, location: "Ahmedabad", education: "B.Tech", profession: "Software Engineer", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop" },
  { name: "Meet Shah", age: 29, location: "Rajkot", education: "MBA", profession: "Business Owner", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop" },
  { name: "Priya Joshi", age: 25, location: "Vadodara", education: "M.Ed", profession: "Teacher", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop" },
  { name: "Dhaval Mehta", age: 30, location: "Surat", education: "MBBS, MD", profession: "Doctor", photo: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop" }
];

const DASHBOARD_JOBS = [
  { role: "Account Manager", company: "Shree Samaj Pvt. Ltd.", location: "Ahmedabad", logo: "A", applied: false, isNew: true },
  { role: "Software Developer", company: "Samaj Infotech", location: "Rajkot", logo: "S", applied: false, isNew: true },
  { role: "Sales Executive", company: "Community Services", location: "Surat", logo: "C", applied: false, isNew: false }
];

const EVENTS_ITEMS = [
  { day: "28", month: "MAY", title: "Samaj Yuva Sammelan 2024", location: "Ahmedabad, Gujarat", time: "10:00 AM" },
  { day: "02", month: "JUN", title: "Samuh Lagna Samaroh", location: "Surat, Gujarat", time: "11:00 AM" },
  { day: "15", month: "JUN", title: "Samaj Khel Mahotsav", location: "Rajkot, Gujarat", time: "09:00 AM" },
  { day: "30", month: "JUN", title: "Blood Donation Camp", location: "Vadodara, Gujarat", time: "08:00 AM" }
];

const GALLERY_IMAGES = [
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=300&h=200&fit=crop",
  "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=300&h=200&fit=crop"
];

const POPULAR_VIDEOS = [
  { title: "Sammelan Highlights", duration: "03:18", img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=350&h=200&fit=crop" },
  { title: "Matrimony Meet 2026", duration: "02:45", img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=350&h=200&fit=crop" },
  { title: "Samaj Bhavan Tour", duration: "04:12", img: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=350&h=200&fit=crop" }
];

const HIGHLIGHTS = [
  { type: "New Member Joined", name: "Dharmik Jain", detail: "from Mumbai", icon: Users, color: "text-[#F97316] bg-[#FFF5EE]" },
  { type: "New Community Added", name: "Shree Umiya Samaj", detail: "USA", icon: Building2, color: "text-emerald-600 bg-emerald-50" },
  { type: "New Business Listed", name: "Patel Traders", detail: "Ahmedabad", icon: Briefcase, color: "text-blue-600 bg-blue-50" },
  { type: "New Event Added", name: "Blood Donation Camp", detail: "", icon: Calendar, color: "text-red-600 bg-red-50" }
];
