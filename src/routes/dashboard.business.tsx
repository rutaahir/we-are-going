import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { 
  Search, Star, Phone, MapPin, MessageCircle, Globe, Mail, 
  Clock, ChevronLeft, ChevronRight, Filter, Building2, 
  Award, Zap, CheckCircle2, X, ExternalLink, Calendar,
  Instagram, Facebook, Youtube, Linkedin
} from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, DetailDrawer, StatusBadge } from "@/components/wag/primitives";
import { useAuth } from "@/context/AuthContext";
import { api, getImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Food & Bakery", "Manufacturing", "Jewellery", "Healthcare", 
  "Textile", "Construction", "Automobile", "Professional", 
  "Education", "Technology", "Retail", "Other"
];

const DEFAULT_HOURS = {
  Monday: "09:00 AM - 07:00 PM",
  Tuesday: "09:00 AM - 07:00 PM",
  Wednesday: "09:00 AM - 07:00 PM",
  Thursday: "09:00 AM - 07:00 PM",
  Friday: "09:00 AM - 07:00 PM",
  Saturday: "09:00 AM - 05:00 PM",
  Sunday: "Closed"
};

export const Route = createFileRoute("/dashboard/business")({
  component: () => {
    const { user } = useAuth();
    
    // Core data state
    const [businesses, setBusinesses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [openBusiness, setOpenBusiness] = useState<any | null>(null);
    
    // Filtering and sorting state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchOwner, setSearchOwner] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedLocation, setSelectedLocation] = useState("");
    const [featuredOnly, setFeaturedOnly] = useState(false);
    const [verifiedOnly, setVerifiedOnly] = useState(false);
    const [sortByRecent, setSortByRecent] = useState(false);
    
    // UI state
    const [carouselIndex, setCarouselIndex] = useState(0);
    const [showFilters, setShowFilters] = useState(false);

    // Fetch businesses from backend
    const fetchBusinesses = async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      
      // Fetch businesses associated with the user's community hierarchy
      const filters: any = {};
      if (user?.communityId) {
        try {
          const ancestors = await api.getAncestorCommunityIds(user.communityId);
          filters.community_id = ancestors.join(",");
        } catch (e) {
          filters.community_id = user.communityId;
        }
      }
      
      api.getBusinesses(filters)
        .then((res) => {
          // Keep the verified business visibility rule at the front-end level as a safety check
          // Status = VERIFIED or status = PENDING (if community admin)
          const isCommAdmin = user?.role === "community_admin" || user?.role === "super_admin";
          const visible = (res || []).filter((b: any) => {
            // If the business status is explicitly rejected or suspended, do not show to members
            if (b.status === "REJECTED" || b.status === "SUSPENDED") return false;
            if (b.status === "PENDING") {
              return isCommAdmin; // Only visible to admin
            }
            // By default, verified is True or status is VERIFIED
            return b.verified || b.status === "VERIFIED" || b.status === undefined;
          });
          setBusinesses(visible);
        })
        .catch(console.error)
        .finally(() => {
          if (!isSilent) setLoading(false);
        });
    };

    // Load initial data and set up real-time polling synchronization (every 5 seconds)
    useEffect(() => {
      fetchBusinesses(false);
      
      const interval = setInterval(() => {
        fetchBusinesses(true);
      }, 5000);

      const handleFocus = () => {
        fetchBusinesses(true);
      };

      window.addEventListener("focus", handleFocus);
      document.addEventListener("visibilitychange", handleFocus);

      return () => {
        clearInterval(interval);
        window.removeEventListener("focus", handleFocus);
        document.removeEventListener("visibilitychange", handleFocus);
      };
    }, [user]);

    // Handle analytics tracking
    const handleTrackClick = async (businessId: number, type: string) => {
      try {
        await api.trackBusinessClick(businessId, type);
        // Optimistically increment the counter in our local state to feel fast
        setBusinesses(prev => prev.map(b => {
          if (b.id === businessId) {
            if (type === 'view') return { ...b, views: (b.views || 0) + 1 };
            if (type === 'open') return { ...b, opens: (b.opens || 0) + 1 };
            if (type === 'whatsapp') return { ...b, whatsapp_clicks: (b.whatsapp_clicks || 0) + 1 };
            if (type === 'call') return { ...b, call_clicks: (b.call_clicks || 0) + 1 };
            if (type === 'website') return { ...b, website_visits: (b.website_visits || 0) + 1 };
          }
          return b;
        }));
        
        // Also update openBusiness if it's currently open
        if (openBusiness && openBusiness.id === businessId) {
          setOpenBusiness((prev: any) => {
            if (!prev) return null;
            if (type === 'view') return { ...prev, views: (prev.views || 0) + 1 };
            if (type === 'open') return { ...prev, opens: (prev.opens || 0) + 1 };
            if (type === 'whatsapp') return { ...prev, whatsapp_clicks: (prev.whatsapp_clicks || 0) + 1 };
            if (type === 'call') return { ...prev, call_clicks: (prev.call_clicks || 0) + 1 };
            if (type === 'website') return { ...prev, website_visits: (prev.website_visits || 0) + 1 };
            return prev;
          });
        }
      } catch (err) {
        console.warn("Click tracking failed", err);
      }
    };

    const handleOpenDetails = (b: any) => {
      setOpenBusiness(b);
      handleTrackClick(b.id, "open");
    };

    // Filter businesses locally based on search values
    const filtered = businesses.filter((b) => {
      const matchName = b.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchOwner = (b.owner || "").toLowerCase().includes(searchOwner.toLowerCase());
      const matchCat = selectedCategory === "All" || b.category === selectedCategory;
      const matchLocation = !selectedLocation || 
        (b.location || "").toLowerCase().includes(selectedLocation.toLowerCase()) ||
        (b.city || "").toLowerCase().includes(selectedLocation.toLowerCase()) ||
        (b.state || "").toLowerCase().includes(selectedLocation.toLowerCase());
      const matchFeatured = !featuredOnly || b.featured;
      const matchVerified = !verifiedOnly || (b.verified || b.status === "VERIFIED");

      return matchName && matchOwner && matchCat && matchLocation && matchFeatured && matchVerified;
    });

    // Sort businesses if needed (Featured first, then either newest or highest rating)
    const sorted = [...filtered].sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (sortByRecent) {
        return b.id - a.id;
      }
      return (b.rating || 0) - (a.rating || 0);
    });

    const featuredBusinesses = businesses.filter((b) => b.featured);

    // Carousel auto-slide
    useEffect(() => {
      if (featuredBusinesses.length <= 1) return;
      const timer = setInterval(() => {
        setCarouselIndex((prev) => (prev + 1) % featuredBusinesses.length);
      }, 5000);
      return () => clearInterval(timer);
    }, [featuredBusinesses]);

    // Statistics Calculations
    const totalCount = businesses.length;
    const verifiedCount = businesses.filter((b) => b.verified || b.status === "VERIFIED").length;
    const uniqueCategories = new Set(businesses.map((b) => b.category)).size;
    const featuredCount = featuredBusinesses.length;

    // Default mock background images if cover/logo are missing
    const getCoverImage = (b: any) => {
      if (b.cover) return getImageUrl(b.cover);
      if (b.cover_url) return b.cover_url;
      return "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop";
    };

    const getLogoImage = (b: any) => {
      if (b.img) return getImageUrl(b.img);
      if (b.img_url) return b.img_url;
      return null;
    };

    return (
      <PageWrap 
        title="Samaj Business Hub" 
        desc="Discover, connect, and support verified businesses and entrepreneurs within our community hierarchy."
      >
        {/* Statistics Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface border border-warm rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gold/30 transition duration-300 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gold-light/10 text-gold flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-ui text-slate-800">{totalCount}</div>
              <div className="text-xs text-warm-muted">Total Businesses</div>
            </div>
          </div>
          <div className="bg-surface border border-warm rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gold/30 transition duration-300 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-ui text-slate-800">{verifiedCount}</div>
              <div className="text-xs text-warm-muted">Verified Members</div>
            </div>
          </div>
          <div className="bg-surface border border-warm rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gold/30 transition duration-300 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-ui text-slate-800">{featuredCount}</div>
              <div className="text-xs text-warm-muted">Featured Partners</div>
            </div>
          </div>
          <div className="bg-surface border border-warm rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-gold/30 transition duration-300 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-ui text-slate-800">{uniqueCategories}</div>
              <div className="text-xs text-warm-muted">Sectors & Categories</div>
            </div>
          </div>
        </div>

        {/* Featured Slider Carousel */}
        {featuredBusinesses.length > 0 && (
          <div className="relative overflow-hidden rounded-3xl mb-8 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white shadow-xl min-h-[220px] sm:min-h-[260px] flex items-center">
            {/* Background Image overlay */}
            <div className="absolute inset-0 opacity-20 bg-cover bg-center pointer-events-none" style={{ backgroundImage: `url(${getCoverImage(featuredBusinesses[carouselIndex])})` }} />
            
            <div className="relative z-10 w-full p-6 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="max-w-xl space-y-3">
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gold/20 border border-gold/40 text-gold text-[10px] font-bold uppercase tracking-widest">
                  <Star className="w-3 h-3 fill-gold text-gold" /> Featured Showcase
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-ui tracking-tight leading-tight">
                  {featuredBusinesses[carouselIndex].name}
                </h2>
                <p className="text-sm text-slate-300 line-clamp-2">
                  {featuredBusinesses[carouselIndex].desc || "A trusted community partner delivering excellence in our region."}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-gold" /> {featuredBusinesses[carouselIndex].location || "Gujarat"}</span>
                  <span className="w-1 h-1 bg-slate-500 rounded-full" />
                  <span>Category: <strong>{featuredBusinesses[carouselIndex].category}</strong></span>
                </div>
              </div>

              <div className="flex sm:flex-col gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => handleOpenDetails(featuredBusinesses[carouselIndex])}
                  className="flex-1 sm:flex-initial text-center px-6 py-3 bg-gold text-slate-950 hover:bg-gold/90 font-semibold rounded-xl text-sm transition shadow-lg shadow-gold/20"
                >
                  View Details
                </button>
                <a 
                  href={`https://wa.me/${featuredBusinesses[carouselIndex].whatsapp || featuredBusinesses[carouselIndex].phone}?text=Hello%20${encodeURIComponent(featuredBusinesses[carouselIndex].name)},%20I%20found%20your%20business%20on%20the%20Samaj%20Business%20Hub.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleTrackClick(featuredBusinesses[carouselIndex].id, "whatsapp")}
                  className="flex-1 sm:flex-initial text-center px-5 py-3 border border-slate-700 bg-slate-900/60 hover:bg-slate-900 font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" /> WhatsApp
                </a>
              </div>
            </div>

            {/* Navigation Arrows */}
            {featuredBusinesses.length > 1 && (
              <div className="absolute bottom-4 right-6 flex items-center gap-2 z-20">
                <button 
                  onClick={() => setCarouselIndex((prev) => (prev - 1 + featuredBusinesses.length) % featuredBusinesses.length)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-400">
                  {carouselIndex + 1} / {featuredBusinesses.length}
                </span>
                <button 
                  onClick={() => setCarouselIndex((prev) => (prev + 1) % featuredBusinesses.length)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Search, Filter Drawer Toggle, and Sorting */}
        <div className="bg-surface border border-warm rounded-2xl p-4 shadow-sm mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-warm-muted" />
              <input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search businesses by name, brand, or specialty..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm bg-sand/30 focus:outline-none focus:border-gold text-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center gap-2 transition",
                  showFilters ? "bg-gold border-gold text-white" : "border-warm bg-surface hover:bg-sand/30 text-slate-700"
                )}
              >
                <Filter className="w-4 h-4" /> Filters
              </button>
              <button 
                onClick={() => setSortByRecent(!sortByRecent)}
                className={cn(
                  "px-4 py-2.5 rounded-xl border text-sm font-semibold transition flex-1 md:flex-initial text-center",
                  sortByRecent ? "bg-primary text-white border-primary" : "border-warm bg-surface hover:bg-sand/30 text-slate-700"
                )}
              >
                {sortByRecent ? "Recently Added" : "Top Rated"}
              </button>
            </div>
          </div>

          {/* Expandable Advanced Filters */}
          {showFilters && (
            <div className="pt-4 border-t border-warm grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Search Owner Name</label>
                <input 
                  value={searchOwner}
                  onChange={(e) => setSearchOwner(e.target.value)}
                  placeholder="Enter owner name..."
                  className="w-full px-3.5 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Location / City Filter</label>
                <input 
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  placeholder="Gujarat, Surat, Ahmedabad..."
                  className="w-full px-3.5 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none focus:border-gold"
                />
              </div>
              <div className="flex flex-col justify-center space-y-2 pt-2 md:pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={featuredOnly}
                    onChange={(e) => setFeaturedOnly(e.target.checked)}
                    className="rounded text-gold focus:ring-gold"
                  />
                  Featured Partner Showcase
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                  <input 
                    type="checkbox" 
                    checked={verifiedOnly}
                    onChange={(e) => setVerifiedOnly(e.target.checked)}
                    className="rounded text-gold focus:ring-gold"
                  />
                  Verified Businesses Only
                </label>
              </div>
            </div>
          )}

          {/* Horizontal Category Select Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-warm scrollbar-track-transparent">
            <button 
              onClick={() => setSelectedCategory("All")}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition",
                selectedCategory === "All" 
                  ? "bg-gold text-white shadow-sm" 
                  : "bg-sand/30 border border-warm text-slate-700 hover:bg-sand/60"
              )}
            >
              All Sectors
            </button>
            {CATEGORIES.map((c) => (
              <button 
                key={c} 
                onClick={() => setSelectedCategory(c)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition",
                  selectedCategory === c 
                    ? "bg-gold text-white shadow-sm" 
                    : "bg-sand/30 border border-warm text-slate-700 hover:bg-sand/60"
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Skeleton Loaders / Business Cards Grid */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-surface border border-warm rounded-2xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-40 bg-sand/60 w-full" />
                <div className="p-5 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="h-3 w-16 bg-sand/80 rounded" />
                    <div className="h-4 w-12 bg-sand/80 rounded" />
                  </div>
                  <div className="h-5 w-3/4 bg-sand/80 rounded" />
                  <div className="h-3 w-1/2 bg-sand/80 rounded" />
                  <div className="h-10 bg-sand/40 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          /* Empty State */
          <div className="bg-surface border border-warm rounded-3xl p-12 text-center shadow-sm max-w-xl mx-auto my-8 space-y-5">
            <div className="w-16 h-16 rounded-full bg-gold-light/10 text-gold flex items-center justify-center mx-auto">
              <Building2 className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="font-ui font-bold text-lg text-slate-800">No Verified Businesses Found</h3>
              <p className="text-sm text-warm-muted max-w-md mx-auto">
                Verified community businesses and directory listings will appear here. Refine your search filters to find others.
              </p>
            </div>
            <button 
              onClick={() => {
                setSearchQuery("");
                setSearchOwner("");
                setSelectedCategory("All");
                setSelectedLocation("");
                setFeaturedOnly(false);
                setVerifiedOnly(false);
              }} 
              className="px-6 py-2.5 rounded-xl bg-gold text-white font-semibold text-xs shadow hover:bg-gold/90 transition"
            >
              Explore Later
            </button>
          </div>
        ) : (
          /* Main Cards Grid */
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {sorted.map((b) => {
              const hasLogo = getLogoImage(b) !== null;
              return (
                <AnimatedCard key={b.id} className="group overflow-hidden flex flex-col border border-warm bg-surface shadow-sm hover:shadow-lg transition-all duration-300">
                  {/* Card Header (Cover Image & Badges) */}
                  <div className="relative h-40 w-full overflow-hidden bg-sand">
                    <img 
                      src={getCoverImage(b)} 
                      alt={b.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      loading="lazy" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Floating Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                      <span className="text-[9px] uppercase tracking-wider bg-slate-950/70 text-gold px-2.5 py-0.5 rounded-full font-bold border border-gold/30">
                        {b.category}
                      </span>
                      {b.featured && (
                        <span className="text-[9px] uppercase tracking-wider bg-gold text-slate-950 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-slate-950 text-slate-950" /> Featured
                        </span>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      {(b.verified || b.status === "VERIFIED") && (
                        <StatusBadge status="Verified" />
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        {/* Logo Circle overlap */}
                        <div className="w-12 h-12 rounded-xl bg-white border border-warm overflow-hidden -mt-10 relative z-10 flex items-center justify-center shadow-md">
                          {hasLogo ? (
                            <img src={getLogoImage(b)!} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gold text-slate-950 flex items-center justify-center font-bold text-sm">
                              {b.name?.[0]?.toUpperCase() || "B"}
                            </div>
                          )}
                        </div>

                        <div>
                          <h3 className="font-ui font-bold text-slate-800 line-clamp-1 group-hover:text-gold transition-colors duration-200">
                            {b.name}
                          </h3>
                          <div className="text-[10px] text-warm-muted">
                            Owner: <span className="font-semibold text-slate-700">{b.owner || "Samaj Entrepreneur"}</span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-warm-muted line-clamp-2 min-h-[32px] pt-1">
                        {b.desc || "No description provided for this business."}
                      </p>

                      <div className="flex flex-col gap-1 text-[11px] text-slate-600 pt-2">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gold" /> 
                          <span className="truncate">{b.location || `${b.city || ""}, ${b.state || ""}`}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-gold" />
                          <span>{b.phone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 mt-auto border-t border-warm/60">
                      <a 
                        href={`https://wa.me/${b.whatsapp || b.phone}?text=Hello%20${encodeURIComponent(b.name)},%20I%20found%20your%20business%20on%20the%20Samaj%20Business%20Hub.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => handleTrackClick(b.id, "whatsapp")}
                        className="flex-1 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                      <a 
                        href={`tel:${b.phone}`}
                        onClick={() => handleTrackClick(b.id, "call")}
                        className="py-2 px-3 rounded-xl border border-warm hover:bg-sand/30 text-slate-600 font-semibold text-[11px] flex items-center justify-center transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                      <button 
                        onClick={() => handleOpenDetails(b)}
                        className="flex-1 py-2 bg-gold hover:bg-gold/90 text-white font-semibold rounded-xl text-[11px] transition shadow-sm"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        )}

        {/* Detailed Business Drawer View */}
        <DetailDrawer 
          open={!!openBusiness} 
          onClose={() => setOpenBusiness(null)} 
          title={openBusiness?.name || "Business Directory Details"}
        >
          {openBusiness && (() => {
            const hasLogo = getLogoImage(openBusiness) !== null;
            // Hours parsing
            const hoursData = openBusiness.hours && typeof openBusiness.hours === "object" 
              ? { ...DEFAULT_HOURS, ...openBusiness.hours } 
              : DEFAULT_HOURS;
            
            // Socials parsing
            const socialsData = openBusiness.socials && typeof openBusiness.socials === "object"
              ? openBusiness.socials
              : {};
              
            // Gallery decoding
            const galleryList: string[] = [];
            if (openBusiness.gallery) {
              if (Array.isArray(openBusiness.gallery)) {
                galleryList.push(...openBusiness.gallery);
              } else if (typeof openBusiness.gallery === "string") {
                try {
                  const parsed = JSON.parse(openBusiness.gallery);
                  if (Array.isArray(parsed)) galleryList.push(...parsed);
                } catch (_) {}
              }
            }

            return (
              <div className="space-y-6 pb-10">
                {/* Hero Cover Card */}
                <div className="relative h-48 rounded-2xl overflow-hidden bg-sand border border-warm shadow-inner">
                  <img src={getCoverImage(openBusiness)} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                  
                  {/* Floating Tags */}
                  <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-gold text-slate-950 px-3 py-1 rounded-full border border-gold/40">
                      {openBusiness.category}
                    </span>
                    {openBusiness.featured && (
                      <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-950/80 text-gold px-3 py-1 rounded-full border border-gold/30 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-gold text-gold" /> Featured Partner
                      </span>
                    )}
                  </div>

                  <div className="absolute top-4 right-4">
                    {(openBusiness.verified || openBusiness.status === "VERIFIED") && (
                      <StatusBadge status="Verified" />
                    )}
                  </div>
                </div>

                {/* Name, Owner, and Description Header */}
                <div className="flex gap-4 items-start">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-warm overflow-hidden flex items-center justify-center shadow-md -mt-10 relative z-10">
                    {hasLogo ? (
                      <img src={getLogoImage(openBusiness)!} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gold text-slate-950 flex items-center justify-center font-bold text-xl">
                        {openBusiness.name?.[0]?.toUpperCase() || "B"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h2 className="font-ui font-bold text-xl text-slate-800">{openBusiness.name}</h2>
                    <div className="text-xs text-warm-muted">
                      Managed by <span className="font-semibold text-slate-700">{openBusiness.owner || "Samaj Member"}</span>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">About the Business</h4>
                  <p className="text-sm text-slate-700 leading-relaxed bg-sand/20 p-4 rounded-xl border border-warm/40">
                    {openBusiness.desc || "No comprehensive description provided yet."}
                  </p>
                </div>

                {/* Quick Interactive Actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <a 
                    href={`tel:${openBusiness.phone}`}
                    onClick={() => handleTrackClick(openBusiness.id, "call")}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-warm bg-surface hover:bg-sand/30 transition text-slate-700 space-y-1 text-center"
                  >
                    <Phone className="w-5 h-5 text-gold" />
                    <span className="text-[10px] font-bold">Call Now</span>
                  </a>
                  <a 
                    href={`https://wa.me/${openBusiness.whatsapp || openBusiness.phone}?text=Hello%20${encodeURIComponent(openBusiness.name)},%20I%20found%20your%20business%20on%20the%20Samaj%20Business%20Hub.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleTrackClick(openBusiness.id, "whatsapp")}
                    className="flex flex-col items-center justify-center p-3 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100/60 transition text-emerald-800 space-y-1 text-center"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] font-bold">WhatsApp</span>
                  </a>
                  {openBusiness.email && (
                    <a 
                      href={`mailto:${openBusiness.email}`}
                      onClick={() => handleTrackClick(openBusiness.id, "email")}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-warm bg-surface hover:bg-sand/30 transition text-slate-700 space-y-1 text-center"
                    >
                      <Mail className="w-5 h-5 text-gold" />
                      <span className="text-[10px] font-bold">Email Shop</span>
                    </a>
                  )}
                  {openBusiness.website && (
                    <a 
                      href={openBusiness.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => handleTrackClick(openBusiness.id, "website")}
                      className="flex flex-col items-center justify-center p-3 rounded-xl border border-warm bg-surface hover:bg-sand/30 transition text-slate-700 space-y-1 text-center"
                    >
                      <Globe className="w-5 h-5 text-gold" />
                      <span className="text-[10px] font-bold">Website</span>
                    </a>
                  )}
                </div>

                {/* Location Detail & Map Link */}
                <div className="space-y-3 bg-surface border border-warm rounded-2xl p-4 shadow-sm">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gold" /> Business Address
                  </h4>
                  <div className="text-sm text-slate-700 space-y-2">
                    <p>{openBusiness.address || "Address details not verified."}</p>
                    <div className="grid grid-cols-2 gap-4 pt-1 text-xs">
                      <div>
                        <span className="text-warm-muted block">City</span>
                        <strong className="text-slate-800">{openBusiness.city || openBusiness.location || "N/A"}</strong>
                      </div>
                      <div>
                        <span className="text-warm-muted block">State</span>
                        <strong className="text-slate-800">{openBusiness.state || "Gujarat"}</strong>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-warm">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${openBusiness.name} ${openBusiness.address || ""} ${openBusiness.city || ""}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-gold font-bold hover:underline"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Navigate on Google Maps
                      </a>
                    </div>
                  </div>
                </div>

                {/* Image Gallery carousel */}
                {galleryList.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">Business Gallery</h4>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-warm scrollbar-track-transparent">
                      {galleryList.map((g, idx) => (
                        <div key={idx} className="w-36 h-24 rounded-xl overflow-hidden border border-warm bg-sand shrink-0">
                          <img src={getImageUrl(g)} alt="" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Operating Schedule */}
                <div className="bg-surface border border-warm rounded-2xl p-4 shadow-sm">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 flex items-center gap-1.5 mb-3">
                    <Clock className="w-4 h-4 text-gold" /> Operating Hours
                  </h4>
                  <div className="divide-y divide-warm/60">
                    {Object.entries(hoursData).map(([day, hrs]) => (
                      <div key={day} className="flex justify-between py-1.5 text-xs">
                        <span className="text-slate-600 font-medium">{day}</span>
                        <span className={cn(
                          "font-bold",
                          hrs === "Closed" ? "text-red-500" : "text-slate-800"
                        )}>{hrs}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Social Connect Link Handles */}
                {Object.keys(socialsData).length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">Social Connections</h4>
                    <div className="flex flex-wrap gap-2.5">
                      {socialsData.instagram && (
                        <a 
                          href={`https://instagram.com/${socialsData.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 text-white font-semibold text-xs flex items-center gap-2"
                        >
                          <Instagram className="w-4 h-4" /> Instagram
                        </a>
                      )}
                      {socialsData.facebook && (
                        <a 
                          href={`https://facebook.com/${socialsData.facebook}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold text-xs flex items-center gap-2"
                        >
                          <Facebook className="w-4 h-4" /> Facebook
                        </a>
                      )}
                      {socialsData.youtube && (
                        <a 
                          href={`https://youtube.com/${socialsData.youtube}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-red-600 text-white font-semibold text-xs flex items-center gap-2"
                        >
                          <Youtube className="w-4 h-4" /> YouTube
                        </a>
                      )}
                      {socialsData.linkedin && (
                        <a 
                          href={`https://linkedin.com/in/${socialsData.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 rounded-xl bg-blue-700 text-white font-semibold text-xs flex items-center gap-2"
                        >
                          <Linkedin className="w-4 h-4" /> LinkedIn
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Live Real-time Analytics Display (For Admins and Owners) */}
                {(user?.role === "community_admin" || user?.role === "super_admin") && (
                  <div className="bg-sand/30 border border-warm rounded-2xl p-4 space-y-2">
                    <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">Live Traffic Analytics</h4>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                      <div className="bg-white border border-warm/80 p-2 rounded-lg">
                        <span className="text-[10px] text-warm-muted block">Views</span>
                        <strong className="text-slate-800 text-sm">{openBusiness.views || 0}</strong>
                      </div>
                      <div className="bg-white border border-warm/80 p-2 rounded-lg">
                        <span className="text-[10px] text-warm-muted block">Opens</span>
                        <strong className="text-slate-800 text-sm">{openBusiness.opens || 0}</strong>
                      </div>
                      <div className="bg-white border border-warm/80 p-2 rounded-lg">
                        <span className="text-[10px] text-warm-muted block">WhatsApp</span>
                        <strong className="text-slate-800 text-sm">{openBusiness.whatsapp_clicks || 0}</strong>
                      </div>
                      <div className="bg-white border border-warm/80 p-2 rounded-lg">
                        <span className="text-[10px] text-warm-muted block">Calls</span>
                        <strong className="text-slate-800 text-sm">{openBusiness.call_clicks || 0}</strong>
                      </div>
                      <div className="bg-white border border-warm/80 p-2 rounded-lg">
                        <span className="text-[10px] text-warm-muted block">Web Click</span>
                        <strong className="text-slate-800 text-sm">{openBusiness.website_visits || 0}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DetailDrawer>
      </PageWrap>
    );
  },
});
