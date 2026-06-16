import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Loader2, CheckCircle2, ShieldCheck, Trash2, AlertCircle, ExternalLink } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatusBadge, DetailDrawer } from "@/components/wag/primitives";
import { api, getImageUrl } from "@/lib/api";

const DEFAULT_HOURS = {
  Monday: "09:00 AM - 07:00 PM",
  Tuesday: "09:00 AM - 07:00 PM",
  Wednesday: "09:00 AM - 07:00 PM",
  Thursday: "09:00 AM - 07:00 PM",
  Friday: "09:00 AM - 07:00 PM",
  Saturday: "09:00 AM - 05:00 PM",
  Sunday: "Closed"
};

export const Route = createFileRoute("/admin/jobs-businesses")({
  component: JobsBusinessesAdminPage,
});

function JobsBusinessesAdminPage() {
  const [tab, setTab] = useState<"Jobs" | "Businesses">("Jobs");
  const [jobs, setJobs] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  // Drawer state
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchBusinesses = async () => {
    try {
      const data = await api.getBusinesses();
      setBusinesses(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchBusinesses()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleVerifyBusiness = async (id: number | string, currentVerified: boolean) => {
    setActionLoading(true);
    try {
      // Toggle verified status, backend will sync status field
      await api.updateBusiness(id, { verified: !currentVerified });
      await fetchBusinesses();
      
      // Update local drawer copy if open
      if (selectedBusiness && selectedBusiness.id === id) {
        setSelectedBusiness((prev: any) => prev ? { ...prev, verified: !currentVerified } : null);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to verify business");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBusiness = async (id: number | string) => {
    if (!confirm("Are you sure you want to remove this business profile?")) return;
    setActionLoading(true);
    try {
      await api.deleteBusiness(id);
      await fetchBusinesses();
      if (selectedBusiness && selectedBusiness.id === id) {
        setSelectedBusiness(null);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to delete business");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteJob = async (id: number | string) => {
    if (!confirm("Are you sure you want to remove this job posting?")) return;
    setActionLoading(true);
    try {
      await api.deleteJob(id);
      await fetchJobs();
    } catch (e) {
      console.error(e);
      alert("Failed to delete job");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredJobs = jobs.filter(j => 
    (j.role || "").toLowerCase().includes(search.toLowerCase()) ||
    (j.company || "").toLowerCase().includes(search.toLowerCase())
  );

  const filteredBusinesses = businesses.filter(b => 
    (b.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.category || "").toLowerCase().includes(search.toLowerCase()) ||
    (b.owner || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageWrap title="Jobs & Businesses" desc="Moderation and verification of platform job postings and local business listings">
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-center justify-between border-b border-warm pb-4">
        <div className="flex gap-2 w-full sm:w-auto">
          {(["Jobs", "Businesses"] as const).map(t => (
            <button 
              key={t} 
              onClick={() => { setTab(t); setSearch(""); }} 
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition ${tab === t ? "bg-primary text-white shadow-md shadow-primary/20" : "bg-transparent text-warm-muted hover:text-foreground"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" />
          <input 
            placeholder={`Search ${tab.toLowerCase()}…`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary transition text-sm" 
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : tab === "Jobs" ? (
        <AnimatedCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs font-bold uppercase tracking-wider text-warm-muted">
                <tr>
                  {["Role", "Company", "Location", "Category", "Applicants", "Actions"].map(h => (
                    <th key={h} className="text-left p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm">
                {filteredJobs.map(j => (
                  <tr key={j.id} className="hover:bg-sand/30 transition">
                    <td className="p-4 font-semibold text-foreground">{j.role}</td>
                    <td className="p-4 text-xs font-medium text-warm-muted">{j.company}</td>
                    <td className="p-4 text-xs text-warm-muted">{j.location}</td>
                    <td className="p-4"><span className="text-xs px-2.5 py-0.5 rounded bg-sand border border-warm/40 font-medium text-foreground">{j.category}</span></td>
                    <td className="p-4 text-xs font-semibold text-foreground">{j.applicants || 0}</td>
                    <td className="p-4 text-xs">
                      <button 
                        disabled={actionLoading}
                        onClick={() => handleDeleteJob(j.id)} 
                        className="text-red-500 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredJobs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-warm-muted">No job postings found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      ) : (
        <AnimatedCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs font-bold uppercase tracking-wider text-warm-muted">
                <tr>
                  {["Business", "Category", "Owner", "Location", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm">
                {filteredBusinesses.map(b => (
                  <tr 
                    key={b.id} 
                    onClick={() => setSelectedBusiness(b)}
                    className="hover:bg-sand/30 transition cursor-pointer"
                  >
                    <td className="p-4 flex items-center gap-3">
                      {b.img || b.img_url ? (
                        <img src={getImageUrl(b.img || b.img_url)} className="w-9 h-9 rounded-lg object-cover border border-warm" alt="" />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-sand flex items-center justify-center text-[10px] text-warm-muted font-bold">Biz</div>
                      )}
                      <span className="font-semibold text-foreground hover:text-primary transition-colors">{b.name}</span>
                    </td>
                    <td className="p-4 text-xs font-medium text-foreground">{b.category}</td>
                    <td className="p-4 text-xs text-warm-muted">{b.owner}</td>
                    <td className="p-4 text-xs text-warm-muted">{b.location}</td>
                    <td className="p-4">
                      <StatusBadge status={b.verified ? "Verified" : "Pending"} />
                    </td>
                    <td className="p-4 text-xs font-semibold">
                      <div className="flex gap-3">
                        <button 
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVerifyBusiness(b.id, b.verified);
                          }} 
                          className="text-primary hover:underline flex items-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> {b.verified ? "Unverify" : "Verify"}
                        </button>
                        <button 
                          disabled={actionLoading}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBusiness(b.id);
                          }} 
                          className="text-red-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBusinesses.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-warm-muted">No business profiles found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}

      {/* Super Admin Business Detail Drawer */}
      <DetailDrawer 
        open={!!selectedBusiness} 
        onClose={() => setSelectedBusiness(null)} 
        title={selectedBusiness?.name || "Business Details"}
      >
        {selectedBusiness && (() => {
          const b = selectedBusiness;
          const hasLogo = b.img || b.img_url;
          const coverImg = b.cover || b.cover_url || "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop";
          
          const hoursData = b.hours && typeof b.hours === "object" ? b.hours : DEFAULT_HOURS;
          const socialsData = b.socials && typeof b.socials === "object" ? b.socials : {};
          
          let galleryList: string[] = [];
          if (b.gallery) {
            if (Array.isArray(b.gallery)) {
              galleryList = b.gallery;
            } else if (typeof b.gallery === "string") {
              try {
                const parsed = JSON.parse(b.gallery);
                if (Array.isArray(parsed)) galleryList = parsed;
              } catch (_) {}
            }
          }

          return (
            <div className="space-y-6 pb-10">
              {/* Cover & Logo Header */}
              <div className="relative h-40 rounded-2xl overflow-hidden bg-sand border border-warm shadow-inner">
                <img src={getImageUrl(coverImg)} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-4 left-4 flex flex-wrap gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-widest bg-gold text-slate-950 px-3 py-1 rounded-full border border-gold/40">
                    {b.category}
                  </span>
                  {b.featured && (
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-slate-950/80 text-gold px-3 py-1 rounded-full border border-gold/30">
                      Featured Partner
                    </span>
                  )}
                </div>
                <div className="absolute top-4 right-4">
                  <StatusBadge status={b.verified ? "Verified" : "Pending"} />
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-16 h-16 rounded-2xl bg-white border border-warm overflow-hidden flex items-center justify-center shadow-md -mt-10 relative z-10">
                  {hasLogo ? (
                    <img src={getImageUrl(b.img || b.img_url)} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gold text-slate-950 flex items-center justify-center font-bold text-xl">
                      {b.name?.[0]?.toUpperCase() || "B"}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-ui font-bold text-xl text-slate-800">{b.name}</h2>
                  <div className="text-xs text-warm-muted">
                    Owner: <span className="font-semibold text-slate-700">{b.owner || "Samaj Entrepreneur"}</span>
                  </div>
                </div>
              </div>

              {/* About Description */}
              <div className="space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">Description</h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-sand/20 p-4 rounded-xl border border-warm/40">
                  {b.desc || "No comprehensive description provided."}
                </p>
              </div>

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-surface border border-warm p-4 rounded-2xl shadow-sm">
                <div>
                  <span className="text-warm-muted block">Phone Number</span>
                  <strong className="text-slate-800">{b.phone || "N/A"}</strong>
                </div>
                <div>
                  <span className="text-warm-muted block">WhatsApp Number</span>
                  <strong className="text-slate-800">{b.whatsapp || "N/A"}</strong>
                </div>
                <div className="mt-2">
                  <span className="text-warm-muted block">Email Address</span>
                  <strong className="text-slate-800 truncate block">{b.email || "N/A"}</strong>
                </div>
                <div className="mt-2">
                  <span className="text-warm-muted block">Website</span>
                  {b.website ? (
                    <a href={b.website} target="_blank" rel="noopener noreferrer" className="text-gold font-bold hover:underline flex items-center gap-1">
                      Visit Site <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <strong className="text-slate-800">N/A</strong>
                  )}
                </div>
              </div>

              {/* Location & Address */}
              <div className="bg-surface border border-warm rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-2">Location & Address</h4>
                <p className="text-sm text-slate-700">{b.address || "No physical address registered."}</p>
                <div className="grid grid-cols-2 gap-4 pt-2 text-xs">
                  <div>
                    <span className="text-warm-muted block">City</span>
                    <strong className="text-slate-800">{b.city || b.location || "N/A"}</strong>
                  </div>
                  <div>
                    <span className="text-warm-muted block">State</span>
                    <strong className="text-slate-800">{b.state || "N/A"}</strong>
                  </div>
                </div>
              </div>

              {/* Image Gallery */}
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

              {/* Hours */}
              <div className="bg-surface border border-warm rounded-2xl p-4 shadow-sm">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">Operating Hours</h4>
                <div className="divide-y divide-warm/60">
                  {Object.entries(hoursData).map(([day, hrs]) => (
                    <div key={day} className="flex justify-between py-1.5 text-xs">
                      <span className="text-slate-600 font-medium">{day}</span>
                      <span className={`font-bold ${hrs === "Closed" ? "text-red-500" : "text-slate-800"}`}>{hrs as string}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Social Connections */}
              {Object.keys(socialsData).length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">Social Connections</h4>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-700">
                    {Object.entries(socialsData).map(([platform, handle]) => handle && (
                      <span key={platform} className="px-3 py-1.5 rounded-lg bg-sand border border-warm capitalize">
                        {platform}: <strong>{handle as string}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Traffic Analytics */}
              <div className="bg-sand/30 border border-warm rounded-2xl p-4 space-y-2">
                <h4 className="text-xs uppercase font-bold tracking-wider text-slate-500">Traffic & Engagement Analytics</h4>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  <div className="bg-white border border-warm/80 p-2 rounded-lg">
                    <span className="text-[10px] text-warm-muted block">Views</span>
                    <strong className="text-slate-800 text-sm">{b.views || 0}</strong>
                  </div>
                  <div className="bg-white border border-warm/80 p-2 rounded-lg">
                    <span className="text-[10px] text-warm-muted block">Opens</span>
                    <strong className="text-slate-800 text-sm">{b.opens || 0}</strong>
                  </div>
                  <div className="bg-white border border-warm/80 p-2 rounded-lg">
                    <span className="text-[10px] text-warm-muted block">WhatsApp</span>
                    <strong className="text-slate-800 text-sm">{b.whatsapp_clicks || 0}</strong>
                  </div>
                  <div className="bg-white border border-warm/80 p-2 rounded-lg">
                    <span className="text-[10px] text-warm-muted block">Calls</span>
                    <strong className="text-slate-800 text-sm">{b.call_clicks || 0}</strong>
                  </div>
                  <div className="bg-white border border-warm/80 p-2 rounded-lg">
                    <span className="text-[10px] text-warm-muted block">Web Click</span>
                    <strong className="text-slate-800 text-sm">{b.website_visits || 0}</strong>
                  </div>
                </div>
              </div>

              {/* Verification & Removal Actions inside Drawer */}
              <div className="pt-4 border-t border-warm flex gap-2">
                <button 
                  disabled={actionLoading}
                  onClick={() => handleVerifyBusiness(b.id, b.verified)}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${b.verified ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100" : "bg-primary text-white hover:bg-primary/95"}`}
                >
                  <ShieldCheck className="w-4 h-4" /> {b.verified ? "Unverify Business" : "Verify & Approve"}
                </button>
                <button 
                  disabled={actionLoading}
                  onClick={() => handleDeleteBusiness(b.id)}
                  className="px-4 py-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition text-xs font-bold flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          );
        })()}
      </DetailDrawer>
    </PageWrap>
  );
}
