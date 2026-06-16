import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  HandHeart, 
  IndianRupee, 
  TrendingUp, 
  Users, 
  Calendar, 
  Heart, 
  ShieldCheck, 
  ArrowRight, 
  Award, 
  Receipt, 
  Clock, 
  Sparkles, 
  HelpCircle, 
  Download, 
  Check, 
  X, 
  FileText,
  Loader2,
  Printer,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatusBadge } from "@/components/wag/primitives";
import { api, getImageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export const Route = createFileRoute("/dashboard/donations")({
  component: MemberDonationsDashboard,
});

function MemberDonationsDashboard() {
  const { user } = useAuth();
  
  // State variables
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modals / Interactions
  const [activeTab, setActiveTab] = useState<"campaigns" | "history">("campaigns");
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);
  const [donationModalCampaign, setDonationModalCampaign] = useState<any | null>(null);
  const [receiptDonation, setReceiptDonation] = useState<any | null>(null);
  
  // Donation Form States
  const [donateAmount, setDonateAmount] = useState<number>(501);
  const [donateNote, setDonateNote] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<string>("UPI");
  const [submittingDonation, setSubmittingDonation] = useState<boolean>(false);
  const [donationSuccess, setDonationSuccess] = useState<any | null>(null);

  // Fetch campaign and donation data from backend
  const fetchData = async () => {
    try {
      // Fetch all campaigns and all donations
      const commId = user?.communityId;
      const ancestors = commId ? await api.getAncestorCommunityIds(commId) : [];
      const filterQuery = ancestors.join(",");

      // Fetch all campaigns and all donations
      const [cRes, dRes] = await Promise.all([
        api.getCampaigns({ community_id: filterQuery }),
        api.getDonations()
      ]);
      setCampaigns(cRes || []);
      setDonations(dRes || []);
    } catch (err) {
      console.error("Failed to fetch donations/campaigns from backend", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-polling for real-time updates every 8 seconds
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [user]);

  // Calculations for dashboard
  // Only Active campaigns appear to members
  const activeCampaignsList = campaigns.filter(c => c.status === "Active" || !c.status);
  
  const totalAmountRaised = campaigns.reduce((sum, c) => sum + Number(c.raised || 0), 0);
  
  const myDonationsList = donations.filter(d => {
    if (!user) return false;
    return d.email === user.email || d.donor === user.name;
  });
  
  const myTotalDonated = myDonationsList.reduce((sum, d) => sum + Number(d.amount || 0), 0);
  
  const totalContributorsCount = new Set(donations.map(d => d.donor.toLowerCase().trim())).size;

  // Handle new donation submission
  const handleDonateSubmit = async () => {
    if (!donationModalCampaign) return;
    if (!donateAmount || donateAmount <= 0) {
      alert("Please enter a valid donation amount.");
      return;
    }

    setSubmittingDonation(true);
    try {
      const donorName = isAnonymous ? "Anonymous" : (user?.name || "Anonymous Member");
      const donorEmail = user?.email || "";
      
      const payload = {
        donor: donorName,
        email: donorEmail,
        amount: donateAmount,
        campaign: donationModalCampaign.id,
        note: donateNote,
        method: paymentMethod,
        is_anonymous: isAnonymous,
        status: "Success",
        transaction_id: `TXN${Math.floor(10000000 + Math.random() * 90000000)}`,
        receipt_no: `REC${Math.floor(100000 + Math.random() * 900000)}`
      };

      const res = await api.createDonation(payload);
      
      // Update local state immediately for instant feedback
      setCampaigns(prevCampaigns => 
        prevCampaigns.map(c => 
          c.id === donationModalCampaign.id 
            ? { ...c, raised: (c.raised || 0) + donateAmount } 
            : c
        )
      );

      // Save success info to display success state
      setDonationSuccess({
        amount: donateAmount,
        campaignTitle: donationModalCampaign.title,
        transactionId: payload.transaction_id,
        receiptNo: payload.receipt_no,
        donorName: donorName
      });

      // Refetch full data immediately in background
      fetchData();

      // Reset form fields
      setDonateAmount(501);
      setDonateNote("");
      setIsAnonymous(false);
      
      // If we are currently looking at details of this campaign, refresh the selectedCampaign object
      if (selectedCampaign && selectedCampaign.id === donationModalCampaign.id) {
        setSelectedCampaign((prev: any) => ({
          ...prev,
          raised: (prev.raised || 0) + donateAmount
        }));
      }

    } catch (err: any) {
      alert("Donation failed: " + (err.message || "Unknown error"));
    } finally {
      setSubmittingDonation(false);
    }
  };

  // Helper to calculate days remaining
  const getDaysRemaining = (endDateStr: string) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <PageWrap 
      title="Donations & Crowdfunding" 
      desc="Contribute to community fundraising campaigns, check goals, and download donation receipts."
      action={
        <div className="flex bg-sand/80 p-1 rounded-xl border border-warm/80">
          <button 
            onClick={() => setActiveTab("campaigns")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "campaigns" ? "bg-primary text-white shadow-sm" : "text-warm-muted hover:text-foreground"}`}
          >
            Campaigns
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === "history" ? "bg-primary text-white shadow-sm" : "text-warm-muted hover:text-foreground"}`}
          >
            My Donations ({myDonationsList.length})
          </button>
        </div>
      }
    >
      {/* 1. Statistics Cards Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-primary/10 text-primary">
            <Heart className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-warm-muted block">Active Campaigns</span>
            <span className="text-xl font-bold font-ui text-foreground">{activeCampaignsList.length}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-gold/10 text-gold">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-warm-muted block">Total Raised</span>
            <span className="text-xl font-bold font-ui text-foreground">₹{totalAmountRaised.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-teal/10 text-teal">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-warm-muted block">My Donations</span>
            <span className="text-xl font-bold font-ui text-foreground">₹{myTotalDonated.toLocaleString()}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-warm shadow-sm flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-warm-muted/10 text-warm-muted">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-warm-muted block">Total Contributors</span>
            <span className="text-xl font-bold font-ui text-foreground">{totalContributorsCount}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : activeTab === "campaigns" ? (
        /* 2. Active Campaigns Tab */
        activeCampaignsList.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-warm/80 bg-surface min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
              <HandHeart className="w-8 h-8 animate-pulse" />
            </div>
            <h3 className="font-ui font-bold text-lg text-foreground mb-1">No Active Fundraising Campaigns</h3>
            <p className="text-sm text-warm-muted max-w-sm mb-6">
              There are no active fundraising campaigns available right now. Check back later or contact community admins for more information.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaignsList.map(c => {
              const progressPct = c.goal > 0 ? Math.min(100, Math.round((Number(c.raised || 0) / Number(c.goal)) * 100)) : 0;
              const daysLeft = getDaysRemaining(c.end_date);
              const campaignDonations = donations.filter(d => d.campaign === c.id);
              const donorsCount = c.donations_count ?? campaignDonations.length;

              return (
                <AnimatedCard key={c.id} className="flex flex-col justify-between border border-warm shadow-sm hover:shadow-md transition bg-surface">
                  <div>
                    {/* Image / Banner */}
                    <div className="h-44 w-full bg-sand relative overflow-hidden">
                      {(c.img || c.img_url) ? (
                        <img src={getImageUrl(c.img || c.img_url)} alt={c.title} className="w-full h-full object-cover transition hover:scale-105 duration-500" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-teal/10 to-primary/10 flex items-center justify-center">
                          <HandHeart className="w-12 h-12 text-primary/30" />
                        </div>
                      )}
                      
                      {/* Community Badge */}
                      <span className="absolute top-3 left-3 bg-surface/90 backdrop-blur-sm border border-warm/60 px-2.5 py-1 rounded-full text-[10px] font-bold text-foreground flex items-center gap-1 shadow-sm">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal" /> Verified Community
                      </span>
                      
                      {/* Days Remaining Badge */}
                      {daysLeft !== null && (
                        <span className="absolute top-3 right-3 bg-gold text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-sm">
                          {daysLeft} Days Left
                        </span>
                      )}
                    </div>

                    <div className="p-5 pb-0">
                      {/* Community Name */}
                      <span className="text-[10px] font-bold tracking-wider text-gold uppercase block mb-1">
                        {c.community_name || user?.communityName || "Verified Samaj Mandal"}
                      </span>
                      
                      {/* Title */}
                      <h4 className="font-ui font-bold text-base text-foreground leading-snug line-clamp-1 mb-1.5" title={c.title}>
                        {c.title}
                      </h4>
                      
                      {/* Description */}
                      <p className="text-xs text-warm-muted line-clamp-2 leading-relaxed mb-4">
                        {c.desc}
                      </p>

                      {/* Dates */}
                      {(c.start_date || c.end_date) && (
                        <div className="flex gap-4 text-[10px] text-warm-muted mb-4 border-b border-warm/40 pb-3">
                          {c.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-primary" /> Starts: {new Date(c.start_date).toLocaleDateString()}
                            </span>
                          )}
                          {c.end_date && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-gold" /> Ends: {new Date(c.end_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Progress Metrics */}
                      <div>
                        <div className="flex justify-between text-xs mb-1 font-semibold">
                          <span className="text-foreground">₹{(c.raised || 0).toLocaleString()} raised</span>
                          <span className="text-warm-muted">of ₹{(c.goal || 0).toLocaleString()}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full h-2.5 bg-sand rounded-full overflow-hidden mb-3 border border-warm/30">
                          <div 
                            className="h-full bg-gradient-to-r from-teal to-primary rounded-full transition-all duration-500" 
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center justify-between text-[11px] text-warm-muted font-medium pb-4">
                          <span className="text-teal font-bold">{progressPct}% Funded</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" /> {donorsCount} Supporters
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2.5">
                    <button 
                      onClick={() => {
                        setSelectedCampaign(c);
                      }} 
                      className="py-2 rounded-xl border border-warm text-xs font-semibold text-warm-muted hover:bg-sand/30 hover:text-foreground transition-all flex items-center justify-center gap-1"
                    >
                      View Details
                    </button>
                    <button 
                      onClick={() => {
                        setDonationModalCampaign(c);
                        setDonateAmount(501);
                      }}
                      className="py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-sm hover:bg-primary/95 transition-all flex items-center justify-center gap-1"
                    >
                      <HandHeart className="w-3.5 h-3.5" /> Donate Now
                    </button>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        )
      ) : (
        /* 3. My Donations Tab */
        myDonationsList.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-warm/80 bg-surface min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-teal/10 text-teal flex items-center justify-center mb-4">
              <Receipt className="w-8 h-8" />
            </div>
            <h3 className="font-ui font-bold text-lg text-foreground mb-1">No Donation History Found</h3>
            <p className="text-sm text-warm-muted max-w-sm mb-6">
              You haven't contributed to any fundraising campaigns yet. Any donations you make will show up here.
            </p>
            <button 
              onClick={() => setActiveTab("campaigns")}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold shadow-sm hover:bg-primary/95 transition flex items-center gap-1.5"
            >
              Browse campaigns <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <AnimatedCard className="overflow-hidden border border-warm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sand text-left text-xs uppercase tracking-wider text-warm-muted font-bold">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4">Campaign</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Payment Method</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-center">Receipt</th>
                    <th className="p-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm">
                  {myDonationsList.map(d => {
                    const camp = campaigns.find(c => c.id === d.campaign);
                    return (
                      <tr key={d.id} className="hover:bg-sand/30 transition-colors">
                        <td className="p-4 text-xs whitespace-nowrap text-warm-muted">
                          {new Date(d.date || d.created_at).toLocaleDateString("en-IN", {
                            year: "numeric",
                            month: "short",
                            day: "numeric"
                          })}
                        </td>
                        <td className="p-4 font-semibold text-foreground">
                          {d.campaign_title || camp?.title || "Community General Fund"}
                        </td>
                        <td className="p-4 font-bold text-teal">
                          ₹{Number(d.amount).toLocaleString()}
                        </td>
                        <td className="p-4 text-xs font-medium text-warm-muted">
                          {d.method}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            d.status === "Success" || d.status === "Approved"
                              ? "bg-teal/10 border-teal/30 text-teal"
                              : "bg-gold/10 border-gold/30 text-gold"
                          }`}>
                            {d.status || "Success"}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button 
                            onClick={() => setReceiptDonation({ ...d, campaign_title: d.campaign_title || camp?.title })}
                            className="p-2 rounded-lg bg-sand/60 hover:bg-sand text-primary transition-all border border-warm/40"
                            title="Download / View Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              const relatedCamp = campaigns.find(c => c.id === d.campaign);
                              if (relatedCamp) setSelectedCampaign(relatedCamp);
                            }}
                            className="text-xs font-semibold text-primary hover:underline"
                          >
                            View Campaign
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </AnimatedCard>
        )
      )}

      {/* ---------- MODAL 1: CAMPAIGN DETAILS ---------- */}
      <Modal 
        open={!!selectedCampaign} 
        onClose={() => setSelectedCampaign(null)} 
        title="Campaign Details"
        size="lg"
      >
        {selectedCampaign && (() => {
          const progressPct = selectedCampaign.goal > 0 ? Math.min(100, Math.round((Number(selectedCampaign.raised || 0) / Number(selectedCampaign.goal)) * 100)) : 0;
          const daysLeft = getDaysRemaining(selectedCampaign.end_date);
          const campaignDonations = donations.filter(d => d.campaign === selectedCampaign.id);
          const topDonors = [...campaignDonations].sort((a, b) => b.amount - a.amount).slice(0, 5);

          return (
            <div className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
              {/* Cover Banner */}
              <div className="relative rounded-2xl overflow-hidden h-56 bg-sand border border-warm/80">
                {(selectedCampaign.img || selectedCampaign.img_url) ? (
                  <img src={getImageUrl(selectedCampaign.img || selectedCampaign.img_url)} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-teal/10 to-primary/10 flex items-center justify-center">
                    <HandHeart className="w-16 h-16 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-4 left-4 bg-surface/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold text-foreground border border-warm flex items-center gap-1 shadow-sm">
                  <ShieldCheck className="w-3.5 h-3.5 text-teal" /> Verified Community Fundraiser
                </div>
                
                {daysLeft !== null && (
                  <div className="absolute top-4 right-4 bg-gold text-white px-2.5 py-1 rounded text-xs font-bold shadow-md">
                    {daysLeft} Days Remaining
                  </div>
                )}
              </div>

              {/* Title & Organization info */}
              <div>
                <span className="text-[10px] font-bold tracking-wider text-gold uppercase block mb-1">
                  {selectedCampaign.community_name || user?.communityName || "Samaj Mandal"}
                </span>
                <h3 className="font-ui font-extrabold text-xl text-foreground leading-tight">
                  {selectedCampaign.title}
                </h3>
              </div>

              {/* Progress Summary and Bar */}
              <div className="bg-sand/30 p-4.5 rounded-2xl border border-warm/60 grid sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-[10px] text-warm-muted uppercase font-bold block mb-0.5">Raised So Far</span>
                  <span className="text-xl font-black text-teal font-ui">₹{(selectedCampaign.raised || 0).toLocaleString()}</span>
                  <span className="text-[10px] text-warm-muted block mt-0.5">{progressPct}% of target</span>
                </div>
                <div>
                  <span className="text-[10px] text-warm-muted uppercase font-bold block mb-0.5">Campaign Goal</span>
                  <span className="text-xl font-bold text-foreground font-ui">₹{(selectedCampaign.goal || 0).toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-warm-muted uppercase font-bold block mb-0.5">Total Contributors</span>
                  <span className="text-xl font-bold text-foreground font-ui">{campaignDonations.length} Supporters</span>
                </div>
                
                {/* Progress bar spans full grid width */}
                <div className="col-span-full pt-1.5">
                  <div className="w-full h-3 bg-sand rounded-full overflow-hidden border border-warm/40">
                    <div 
                      className="h-full bg-gradient-to-r from-teal to-primary rounded-full transition-all duration-500" 
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Grid split for description & supporters */}
              <div className="grid md:grid-cols-3 gap-6">
                
                {/* Left Side: Campaign Description & Updates */}
                <div className="md:col-span-2 space-y-5">
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-warm-muted mb-2 border-b border-warm/50 pb-1.5 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" /> About this Fundraiser
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                      {selectedCampaign.desc}
                    </p>
                  </div>

                  {/* Fund utilization Updates */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-warm-muted mb-3 border-b border-warm/50 pb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-gold" /> Fund Utilization & Updates
                    </h4>
                    {selectedCampaign.updates ? (
                      <div className="relative pl-5 border-l-2 border-warm/80 space-y-4">
                        <div className="relative">
                          <div className="absolute -left-6.5 top-0.5 bg-gold text-white rounded-full p-0.5 border-2 border-surface">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                          <p className="text-xs text-warm-muted font-bold">Latest Update</p>
                          <p className="text-xs text-foreground mt-1 bg-sand/20 p-3 rounded-xl border border-warm/30">{selectedCampaign.updates}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-sand/25 p-4 rounded-xl border border-warm/30 text-xs text-warm-muted italic">
                        No official updates posted yet. The community admin will provide utilization reports as the campaign progresses.
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Donor Wall (Recent Supporters) & Top Contributors */}
                <div className="space-y-5">
                  
                  {/* Top Contributors */}
                  {topDonors.length > 0 && (
                    <div className="p-4 rounded-xl bg-gold/5 border border-gold/15">
                      <h4 className="text-[10px] uppercase font-bold tracking-wider text-gold mb-3 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Top Contributors
                      </h4>
                      <div className="space-y-2">
                        {topDonors.map((d, index) => (
                          <div key={d.id} className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-foreground truncate max-w-[120px]">
                              {d.is_anonymous ? "Anonymous Donor" : d.donor}
                            </span>
                            <span className="font-bold text-primary whitespace-nowrap">₹{Number(d.amount).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Supporters */}
                  <div>
                    <h4 className="text-xs uppercase font-bold tracking-wider text-warm-muted mb-3 border-b border-warm/50 pb-1.5 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-teal" /> Supporters Wall
                    </h4>
                    {campaignDonations.length === 0 ? (
                      <p className="text-xs text-warm-muted italic py-1">Be the first contributor to support this campaign!</p>
                    ) : (
                      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                        {campaignDonations.slice(0, 8).map(d => (
                          <div key={d.id} className="p-2.5 rounded-xl border border-warm/40 bg-sand/15 text-xs flex justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">
                                {d.is_anonymous ? "Anonymous Supporter" : d.donor}
                              </p>
                              {d.note && (
                                <p className="text-[10px] text-warm-muted italic mt-0.5">"{d.note}"</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span className="font-bold text-teal block">₹{Number(d.amount).toLocaleString()}</span>
                              <span className="text-[9px] text-warm-muted block mt-0.5">
                                {new Date(d.date || d.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Sticky bottom donate bar */}
              <div className="border-t border-warm pt-4.5 flex gap-3 items-center sticky bottom-0 bg-surface py-2">
                <div className="hidden sm:block">
                  <span className="text-[10px] text-warm-muted block">Support this campaign</span>
                  <span className="font-bold text-xs text-foreground block">100% direct fund utilization</span>
                </div>
                <button 
                  onClick={() => {
                    setSelectedCampaign(null);
                    setDonationModalCampaign(selectedCampaign);
                    setDonateAmount(501);
                  }}
                  className="w-full sm:w-auto sm:ml-auto px-8 py-3 rounded-xl bg-primary text-white text-xs font-extrabold shadow-md hover:bg-primary/95 transition flex items-center justify-center gap-1.5"
                >
                  <HandHeart className="w-4 h-4" /> Donate to this Fundraiser
                </button>
              </div>

            </div>
          );
        })()}
      </Modal>

      {/* ---------- MODAL 2: DONATION PAYMENT MODAL ---------- */}
      <Modal 
        open={!!donationModalCampaign} 
        onClose={() => {
          setDonationModalCampaign(null);
          setDonationSuccess(null);
        }} 
        title={donationSuccess ? "Donation Successful" : `Donate to ${donationModalCampaign?.title}`}
      >
        {donationSuccess ? (
          /* Success State */
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-teal/10 text-teal rounded-full flex items-center justify-center mx-auto mb-2 border border-teal/20">
              <Check className="w-8 h-8" />
            </div>
            
            <div>
              <h3 className="font-ui font-bold text-lg text-foreground">Heartfelt Thank You!</h3>
              <p className="text-xs text-warm-muted mt-1 px-4">
                Your donation of <span className="font-bold text-primary">₹{donationSuccess.amount.toLocaleString()}</span> has been successfully processed to <span className="font-semibold">{donationSuccess.campaignTitle}</span>.
              </p>
            </div>

            <div className="bg-sand/30 p-4 rounded-xl border border-warm/80 text-left max-w-sm mx-auto space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-warm-muted">Donor Name:</span><span className="font-semibold">{donationSuccess.donorName}</span></div>
              <div className="flex justify-between"><span className="text-warm-muted">Transaction ID:</span><span className="font-mono">{donationSuccess.transactionId}</span></div>
              <div className="flex justify-between"><span className="text-warm-muted">Receipt Number:</span><span className="font-mono">{donationSuccess.receiptNo}</span></div>
              <div className="flex justify-between"><span className="text-warm-muted">Status:</span><span className="font-bold text-teal">Success (Instant)</span></div>
            </div>

            <p className="text-[10px] text-warm-muted italic">A receipt has been dispatched to your email address.</p>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => {
                  setReceiptDonation({
                    donor: donationSuccess.donorName,
                    amount: donationSuccess.amount,
                    campaign_title: donationSuccess.campaignTitle,
                    transaction_id: donationSuccess.transactionId,
                    receipt_no: donationSuccess.receiptNo,
                    date: new Date(),
                    method: paymentMethod,
                    status: "Success"
                  });
                  setDonationModalCampaign(null);
                  setDonationSuccess(null);
                }}
                className="flex-1 py-2.5 rounded-xl border border-warm text-xs font-semibold hover:bg-sand transition flex items-center justify-center gap-1"
              >
                <Receipt className="w-3.5 h-3.5" /> View Receipt
              </button>
              <button 
                onClick={() => {
                  setDonationModalCampaign(null);
                  setDonationSuccess(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Donation Payment Form */
          <div className="space-y-4">
            
            {/* Quick buttons */}
            <div>
              <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1.5">Select Amount</label>
              <div className="grid grid-cols-4 gap-2">
                {[101, 501, 1001, 5001].map(amt => (
                  <button 
                    key={amt} 
                    type="button"
                    onClick={() => setDonateAmount(amt)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      donateAmount === amt 
                        ? "bg-primary text-white border-primary shadow-sm scale-[1.02]" 
                        : "border-warm bg-sand/25 text-warm-muted hover:bg-sand/50 hover:text-foreground"
                    }`}
                  >
                    ₹{amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount Input */}
            <div>
              <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1">Custom Amount (₹)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-warm-muted">₹</span>
                <input 
                  type="number" 
                  value={donateAmount || ""} 
                  onChange={e => setDonateAmount(Number(e.target.value))}
                  placeholder="Enter amount"
                  className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-sm font-bold text-foreground"
                />
              </div>
            </div>

            {/* Message/Note */}
            <div>
              <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1">Add a Message (Optional)</label>
              <textarea 
                rows={2} 
                value={donateNote}
                onChange={e => setDonateNote(e.target.value)}
                placeholder="E.g. In loving memory of... or Wishing the best!"
                className="w-full px-3.5 py-2 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-xs resize-none"
              />
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-sand/20 border border-warm/40">
              <div>
                <span className="text-xs font-bold text-foreground block">Donate Anonymously</span>
                <span className="text-[10px] text-warm-muted block">Your name won't be displayed on the public wall</span>
              </div>
              <input 
                type="checkbox" 
                checked={isAnonymous}
                onChange={e => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 rounded border-warm accent-primary focus:ring-primary cursor-pointer"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-[11px] font-bold text-warm-muted uppercase tracking-wider block mb-1.5">Select Payment Method</label>
              <select 
                value={paymentMethod} 
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-warm bg-surface focus:border-primary outline-none text-xs font-semibold"
              >
                <option value="UPI">UPI (Google Pay, PhonePe, Paytm)</option>
                <option value="Razorpay">Razorpay Gateway (All NetBanking/Cards)</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
              </select>
            </div>

            {/* Submit Action */}
            <div className="flex gap-2 pt-2 border-t border-warm">
              <button 
                type="button"
                onClick={() => setDonationModalCampaign(null)} 
                className="flex-1 py-3 rounded-xl border border-warm text-xs font-bold hover:bg-sand/30 transition text-warm-muted"
              >
                Cancel
              </button>
              <button 
                type="button"
                disabled={submittingDonation}
                onClick={handleDonateSubmit}
                className="flex-1 py-3 rounded-xl bg-primary text-white text-xs font-extrabold shadow-sm hover:bg-primary/95 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {submittingDonation && <Loader2 className="w-4 h-4 animate-spin" />}
                Donate ₹{donateAmount.toLocaleString()}
              </button>
            </div>

          </div>
        )}
      </Modal>

      {/* ---------- MODAL 3: PRINTABLE DONATION RECEIPT ---------- */}
      <Modal
        open={!!receiptDonation}
        onClose={() => setReceiptDonation(null)}
        title="Donation Receipt"
        size="md"
      >
        {receiptDonation && (
          <div className="space-y-6">
            
            {/* The printable receipt area */}
            <div id="printable-receipt" className="p-6 border-2 border-warm rounded-2xl bg-surface relative overflow-hidden font-ui shadow-inner">
              
              {/* Decorative side color bar */}
              <div className="absolute left-0 top-0 bottom-0 w-2.5 bg-gradient-to-b from-primary to-gold" />
              
              {/* Header */}
              <div className="flex justify-between items-start border-b border-warm/80 pb-4 ml-2">
                <div>
                  <span className="text-[10px] font-black text-gold uppercase tracking-wider block">SAMAJ CROWDFUNDING</span>
                  <h2 className="text-base font-extrabold text-foreground">{user?.communityName || "Verified Community"}</h2>
                  <p className="text-[10px] text-warm-muted mt-0.5">Registration: {user?.communityId ? `COMM-${user.communityId}` : "COMM-VERIFIED"}</p>
                </div>
                <div className="text-right">
                  <span className="bg-teal/10 text-teal px-2 py-0.5 rounded text-[9px] font-black border border-teal/20 uppercase tracking-widest">
                    Verified
                  </span>
                  <p className="text-[10px] text-warm-muted mt-1.5">Date: {new Date(receiptDonation.date || receiptDonation.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="py-5 space-y-4.5 ml-2 text-xs">
                <h4 className="text-center font-extrabold text-sm uppercase tracking-wider text-primary border border-warm/60 bg-sand/30 py-1.5 rounded-lg">
                  Donation Acknowledgment
                </h4>
                
                <p className="leading-relaxed text-foreground/90">
                  This receipt gratefully acknowledges that <span className="font-extrabold text-foreground">{receiptDonation.is_anonymous ? "Anonymous Supporter" : receiptDonation.donor}</span> has contributed a sum of <span className="font-black text-teal">₹{Number(receiptDonation.amount).toLocaleString()}</span> towards the campaign:
                </p>

                <div className="p-3 bg-sand/20 rounded-xl border border-warm/40 font-semibold text-foreground text-center">
                  "{receiptDonation.campaign_title || "General Welfare Fund"}"
                </div>

                <div className="grid grid-cols-2 gap-4 text-[11px] bg-sand/10 p-3 rounded-xl border border-warm/30">
                  <div>
                    <span className="text-warm-muted block mb-0.5">Receipt Number</span>
                    <span className="font-bold text-foreground font-mono">{receiptDonation.receipt_no || `REC${receiptDonation.id}`}</span>
                  </div>
                  <div>
                    <span className="text-warm-muted block mb-0.5">Transaction ID</span>
                    <span className="font-bold text-foreground font-mono">{receiptDonation.transaction_id || `TXN${receiptDonation.id}`}</span>
                  </div>
                  <div>
                    <span className="text-warm-muted block mb-0.5">Payment Channel</span>
                    <span className="font-bold text-foreground">{receiptDonation.method}</span>
                  </div>
                  <div>
                    <span className="text-warm-muted block mb-0.5">Payment Status</span>
                    <span className="font-bold text-teal">{receiptDonation.status || "Success"}</span>
                  </div>
                </div>

                <p className="text-[10px] text-warm-muted leading-snug">
                  * All contributions directly benefit the designated community members. This fundraiser is fully verified by the Community Governing Council. Thank you for your kindness and support!
                </p>
              </div>

              {/* Footer / Signatures */}
              <div className="flex justify-between items-end border-t border-warm/80 pt-4 ml-2">
                <div className="flex items-center gap-1.5 text-warm-muted">
                  <ShieldCheck className="w-5 h-5 text-teal" />
                  <span className="text-[10px] font-bold">Secured & Digitally Signed</span>
                </div>
                <div className="text-right">
                  <div className="w-24 border-b border-warm/80 inline-block mb-1" />
                  <p className="text-[9px] text-warm-muted">Authorized Signatory</p>
                </div>
              </div>

            </div>

            {/* Print controls */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setReceiptDonation(null)}
                className="flex-1 py-2.5 rounded-xl border border-warm text-xs font-semibold hover:bg-sand/30 transition text-warm-muted"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const printContents = document.getElementById("printable-receipt")?.innerHTML;
                  if (printContents) {
                    const printWindow = window.open("", "_blank");
                    printWindow?.document.write(`
                      <html>
                        <head>
                          <title>Donation Receipt</title>
                          <style>
                            body { font-family: sans-serif; padding: 40px; }
                            #printable-receipt { border: 2px solid #e2e8f0; border-radius: 12px; padding: 24px; position: relative; }
                            .absolute { position: absolute; }
                            .left-0 { left: 0; }
                            .top-0 { top: 0; }
                            .bottom-0 { bottom: 0; }
                            .w-2.5 { width: 10px; }
                            .bg-gradient-to-b { background: linear-gradient(to bottom, #d97706, #f59e0b); }
                            .flex { display: flex; }
                            .justify-between { justify-content: space-between; }
                            .items-start { align-items: flex-start; }
                            .items-end { align-items: flex-end; }
                            .border-b { border-bottom: 1px solid #e2e8f0; }
                            .pb-4 { padding-bottom: 16px; }
                            .text-right { text-align: right; }
                            .text-center { text-align: center; }
                            .py-5 { padding-top: 20px; padding-bottom: 20px; }
                            .space-y-4 { margin-top: 16px; }
                            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                            .bg-sand\\/30 { background-color: #f5f5f4; }
                            .bg-sand\\/20 { background-color: #fafaf9; }
                            .bg-sand\\/10 { background-color: #fafaf9; }
                            .p-3 { padding: 12px; }
                            .rounded-xl { border-radius: 8px; }
                            .border { border: 1px solid #e2e8f0; }
                            .font-bold { font-weight: bold; }
                            .font-black { font-weight: 900; }
                            .text-teal { color: #0d9488; }
                            .text-primary { color: #d97706; }
                            .text-warm-muted { color: #78716c; }
                            .text-foreground { color: #1c1917; }
                          </style>
                        </head>
                        <body>
                          <div id="printable-receipt">${printContents}</div>
                          <script>
                            window.onload = function() { window.print(); window.close(); }
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow?.document.close();
                  }
                }}
                className="flex-1 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-sm hover:bg-primary/95 transition flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>

          </div>
        )}
      </Modal>

    </PageWrap>
  );
}
