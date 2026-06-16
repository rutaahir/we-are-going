import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Search, Grid3x3, List, MapPin, Phone, Briefcase, Users, 
  CheckCircle, Crown, Calendar, Sparkles, Filter, X, 
  ChevronRight, ChevronDown, Mail, Globe, Map, Award, Store, 
  User, Check, Heart, MessageSquare, Loader2, ArrowRight, SlidersHorizontal,
  Clock, XCircle, AlertCircle, Download, ShieldCheck
} from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, DetailDrawer, StatusBadge } from "@/components/wag/primitives";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/dashboard/directory")({
  component: MemberDirectory,
});

// Helper to safely extract community ID from member representation
const getMemberCommunityId = (m: any): number | null => {
  if (m.community_id) return Number(m.community_id);
  if (m.community) {
    if (typeof m.community === "object") {
      return m.community.id ? Number(m.community.id) : null;
    }
    return Number(m.community);
  }
  return null;
};

function MemberDirectory() {
  const { user } = useAuth();
  
  // States
  const [members, setMembers] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and suggestions
  const [q, setQ] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // View style
  const [view, setView] = useState<"grid" | "list" | "map">("grid");

  // Advanced Filters
  const [showFilters, setShowFilters] = useState(false);
  const [filterCommunity, setFilterCommunity] = useState<string>("All");
  const [filterProfession, setFilterProfession] = useState<string>("All");
  const [filterCity, setFilterCity] = useState<string>("All");
  const [filterState, setFilterState] = useState<string>("All");
  const [filterGender, setFilterGender] = useState<string>("All");
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>("All");
  const [filterBusinessOwner, setFilterBusinessOwner] = useState<boolean>(false);
  const [filterCommittee, setFilterCommittee] = useState<boolean>(false);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState<boolean>(false);

  // Selected member for detail drawer
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "contact" | "activity" | "business" | "gallery">("about");

  // Connect & Message interaction states
  const [connections, setConnections] = useState<Record<string, boolean>>({});
  const [messageRequests, setMessageRequests] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  
  // Send Message Request Modal states
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestTarget, setRequestTarget] = useState<any | null>(null);
  const [reqSubject, setReqSubject] = useState("");
  const [reqIntro, setReqIntro] = useState("");
  const [reqReason, setReqReason] = useState("Networking");
  const [reqCustomReason, setReqCustomReason] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");

  // Pagination / Infinite scroll
  const [visibleCount, setVisibleCount] = useState(12);

  // Fetch directory data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [mList, cList, reqList, convsList] = await Promise.all([
          api.getMembers(),
          api.getCommunities(),
          api.getMessageRequests(),
          api.getConversations()
        ]);
        setMembers(mList || []);
        setCommunities(cList || []);
        setMessageRequests(reqList || []);
        setConversations(convsList || []);
      } catch (e) {
        console.error("Failed to load directory data", e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Hierarchy Visibility Logic
  const userCommunityId = user?.communityId ? Number(user.communityId) : null;

  const allowedCommunityIds = useMemo(() => {
    if (!userCommunityId || user?.role === "super_admin") {
      return null; // Show all if super admin or no community ID
    }

    const ancestors = new Set<number>();
    let currentId = userCommunityId;
    while (currentId) {
      const comm = communities.find(c => c.id === currentId);
      if (!comm) break;
      ancestors.add(comm.id);
      currentId = comm.parent_id || comm.parent || null;
    }

    const descendants = new Set<number>();
    const getChildren = (parentId: number) => {
      communities.forEach(c => {
        const parentVal = c.parent_id || c.parent;
        if (Number(parentVal) === parentId && !descendants.has(c.id)) {
          descendants.add(c.id);
          getChildren(c.id);
        }
      });
    };
    getChildren(userCommunityId);

    const allowed = new Set<number>([userCommunityId]);
    ancestors.forEach(id => allowed.add(id));
    descendants.forEach(id => allowed.add(id));
    return allowed;
  }, [userCommunityId, communities, user?.role]);

  // Helper to get community name safely
  const getCommunityName = (m: any) => {
    if (m.community_name) return m.community_name;
    const commId = getMemberCommunityId(m);
    if (commId) {
      const comm = communities.find(c => c.id === commId);
      if (comm) return comm.name;
    }
    return "Local Samaj";
  };

  // Filter out pending, draft, rejected, suspended status
  const approvedMembers = useMemo(() => {
    return members.filter(m => {
      // Rule 1: Status must be verified/approved/active
      const status = (m.status || "").toLowerCase();
      const isApproved = status === "verified" || status === "active" || status === "approved";
      if (!isApproved) return false;

      // Rule 2: Hierarchy visibility rule
      if (allowedCommunityIds) {
        const mCommId = getMemberCommunityId(m);
        if (!mCommId || !allowedCommunityIds.has(Number(mCommId))) {
          return false;
        }
      }
      return true;
    });
  }, [members, allowedCommunityIds]);

  // Compute lists of filter options
  const professionsList = useMemo(() => {
    const list = approvedMembers.map(m => m.profession).filter(Boolean);
    return Array.from(new Set(list)).sort() as string[];
  }, [approvedMembers]);

  const citiesList = useMemo(() => {
    const list = approvedMembers.map(m => m.village).filter(Boolean);
    return Array.from(new Set(list)).sort() as string[];
  }, [approvedMembers]);

  const statesList = useMemo(() => {
    const list = approvedMembers.map(m => m.state).filter(Boolean);
    return Array.from(new Set(list)).sort() as string[];
  }, [approvedMembers]);

  // Handle Autocomplete Suggestions
  const searchSuggestions = useMemo(() => {
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase();
    
    // Get unique suggestions for Name, Profession, Village, or Community
    const results: { type: "name" | "profession" | "city" | "community"; text: string }[] = [];
    
    approvedMembers.forEach(m => {
      if (m.name?.toLowerCase().includes(lower)) {
        results.push({ type: "name", text: m.name });
      }
      if (m.profession?.toLowerCase().includes(lower)) {
        results.push({ type: "profession", text: m.profession });
      }
      if (m.village?.toLowerCase().includes(lower)) {
        results.push({ type: "city", text: m.village });
      }
    });

    communities.forEach(c => {
      if (c.name?.toLowerCase().includes(lower)) {
        results.push({ type: "community", text: c.name });
      }
    });

    // Remove duplicates
    const seen = new Set<string>();
    return results.filter(item => {
      const key = `${item.type}-${item.text}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 5);
  }, [q, approvedMembers, communities]);

  // Main list processing (search & advanced filters)
  const filteredMembers = useMemo(() => {
    return approvedMembers.filter(m => {
      // 1. Text Search
      if (q) {
        const query = q.toLowerCase();
        const matchesName = m.name?.toLowerCase().includes(query);
        const matchesProfession = m.profession?.toLowerCase().includes(query);
        const matchesBusiness = (m.business_name || m.company)?.toLowerCase().includes(query);
        const matchesCity = m.village?.toLowerCase().includes(query);
        const matchesCommunity = getCommunityName(m).toLowerCase().includes(query);
        
        if (!matchesName && !matchesProfession && !matchesBusiness && !matchesCity && !matchesCommunity) {
          return false;
        }
      }

      // 2. Advanced Filters
      if (filterCommunity !== "All") {
        const mCommId = getMemberCommunityId(m);
        if (String(mCommId) !== filterCommunity) return false;
      }
      if (filterProfession !== "All" && m.profession !== filterProfession) return false;
      if (filterCity !== "All" && m.village !== filterCity) return false;
      if (filterState !== "All" && m.state !== filterState) return false;
      
      // Gender Filter
      if (filterGender !== "All" && (m.gender || "").toLowerCase() !== filterGender.toLowerCase()) return false;
      
      // Age Group Filter
      if (filterAgeGroup !== "All" && m.age) {
        const age = Number(m.age);
        if (filterAgeGroup === "under-25" && age >= 25) return false;
        if (filterAgeGroup === "25-35" && (age < 25 || age > 35)) return false;
        if (filterAgeGroup === "36-50" && (age < 36 || age > 50)) return false;
        if (filterAgeGroup === "50-plus" && age <= 50) return false;
      }

      // Toggle Filters
      if (filterBusinessOwner && !m.business_name && m.profession_type !== "Business") return false;
      if (filterCommittee && m.role !== "community_admin" && m.role !== "committee") return false;
      if (filterVerifiedOnly && m.aadhaar_status !== "Approved") return false;

      return true;
    });
  }, [approvedMembers, q, filterCommunity, filterProfession, filterCity, filterState, filterGender, filterAgeGroup, filterBusinessOwner, filterCommittee, filterVerifiedOnly]);

  // Statistics calculation based on allowed hierarchy members
  const stats = useMemo(() => {
    const total = approvedMembers.length;
    const verified = approvedMembers.filter(m => m.aadhaar_status === "Approved" || m.status === "Verified").length;
    const businessOwners = approvedMembers.filter(m => m.business_name || m.profession_type === "Business").length;
    const committee = approvedMembers.filter(m => m.role === "community_admin" || m.role === "committee").length;
    
    // Joined this month (last 30 days fallback)
    const thisMonth = approvedMembers.filter(m => {
      const dateStr = m.joined_date || m.joinedDate;
      if (!dateStr) return false;
      const joinedDate = new Date(dateStr);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - joinedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    }).length;

    return { total, verified, businessOwners, committee, thisMonth };
  }, [approvedMembers]);

  // Dynamic tree structure for Allowed Communities
  const hierarchyTree = useMemo(() => {
    if (communities.length === 0) return null;

    // Find the highest ancestor in our allowed list
    let rootId = userCommunityId;
    if (rootId) {
      let currentId = rootId;
      while (currentId) {
        const comm = communities.find(c => c.id === currentId);
        if (!comm) break;
        const parentVal = comm.parent_id || comm.parent;
        if (parentVal && (allowedCommunityIds === null || allowedCommunityIds.has(Number(parentVal)))) {
          currentId = Number(parentVal);
        } else {
          break;
        }
      }
      rootId = currentId;
    }

    if (!rootId && communities.length > 0) {
      // Default to the first root community if no community ID (e.g. Super Admin)
      const roots = communities.filter(c => !c.parent && !c.parent_id);
      rootId = roots[0]?.id || communities[0]?.id;
    }

    // Build tree recursively
    const buildNode = (commId: number): any => {
      const comm = communities.find(c => c.id === commId);
      if (!comm) return null;

      const children = communities
        .filter(c => Number(c.parent_id || c.parent) === commId)
        .filter(c => allowedCommunityIds === null || allowedCommunityIds.has(c.id))
        .map(c => buildNode(c.id))
        .filter(Boolean);

      // Count members belonging directly to this community
      const memberCount = approvedMembers.filter(m => {
        const mCommId = getMemberCommunityId(m);
        return Number(mCommId) === commId;
      }).length;

      return {
        id: comm.id,
        name: comm.name,
        type: comm.type || (comm.parent_id || comm.parent ? "Subsidiary" : "Super"),
        memberCount,
        children
      };
    };

    return rootId ? buildNode(rootId) : null;
  }, [communities, allowedCommunityIds, userCommunityId, approvedMembers]);

  // Reset all filters helper
  const handleResetFilters = () => {
    setQ("");
    setFilterCommunity("All");
    setFilterProfession("All");
    setFilterCity("All");
    setFilterState("All");
    setFilterGender("All");
    setFilterAgeGroup("All");
    setFilterBusinessOwner(false);
    setFilterCommittee(false);
    setFilterVerifiedOnly(false);
    setVisibleCount(12);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filterCommunity !== "All") count++;
    if (filterProfession !== "All") count++;
    if (filterCity !== "All") count++;
    if (filterState !== "All") count++;
    if (filterGender !== "All") count++;
    if (filterAgeGroup !== "All") count++;
    if (filterBusinessOwner) count++;
    if (filterCommittee) count++;
    if (filterVerifiedOnly) count++;
    if (q) count++;
    return count;
  }, [q, filterCommunity, filterProfession, filterCity, filterState, filterGender, filterAgeGroup, filterBusinessOwner, filterCommittee, filterVerifiedOnly]);

  const navigate = useNavigate();

  // Simulate Connection Request
  const handleConnect = (id: string, name: string) => {
    setConnections(prev => {
      const next = { ...prev, [id]: !prev[id] };
      return next;
    });
  };

  const currentMember = useMemo(() => {
    return members.find(m => m.email === user?.email);
  }, [members, user]);
  
  const currentMemberId = currentMember?.id || Number((user as any)?.member?.id || user?.id);

  const getMessageState = (targetMemberId: number) => {
    const conv = conversations.find(c => 
      (c.participant_1 === currentMemberId && c.participant_2 === targetMemberId) ||
      (c.participant_1 === targetMemberId && c.participant_2 === currentMemberId)
    );
    if (conv) return { type: "approved", convId: conv.id };

    const req = messageRequests.find(r => 
      (r.sender === currentMemberId && r.receiver === targetMemberId) ||
      (r.sender === targetMemberId && r.receiver === currentMemberId)
    );

    if (req) {
      if (req.status === "pending") {
        if (req.sender === currentMemberId) {
          return { type: "pending_sent", reqId: req.id };
        } else {
          return { type: "pending_received", reqId: req.id };
        }
      } else if (req.status === "rejected") {
        return { type: "rejected", reqId: req.id, sender: req.sender, updatedAt: req.updated_at };
      }
    }

    return { type: "none" };
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTarget) return;
    setSendingRequest(true);
    setRequestError("");
    setRequestSuccess("");

    try {
      await api.createMessageRequest({
        receiver: requestTarget.id,
        subject: reqSubject,
        introduction_message: reqIntro,
        reason: reqReason,
        custom_reason: reqReason === "Other" ? reqCustomReason : ""
      });

      setRequestSuccess(`Connection request sent successfully to ${requestTarget.name}!`);
      
      const reqList = await api.getMessageRequests();
      setMessageRequests(reqList || []);

      setTimeout(() => {
        setShowRequestModal(false);
        setRequestTarget(null);
        setReqSubject("");
        setReqIntro("");
        setReqReason("Networking");
        setReqCustomReason("");
        setRequestSuccess("");
      }, 1500);

    } catch (err: any) {
      setRequestError(err.message || "Failed to send connection request.");
    } finally {
      setSendingRequest(false);
    }
  };

  const renderMessageButton = (member: any, isFullSize = false) => {
    if (member.id === currentMemberId) return null;
    const msgState = getMessageState(member.id);

    if (msgState.type === "approved") {
      return (
        <button
          onClick={() => navigate({ to: `/dashboard/messages?chat=${msgState.convId}` })}
          className={`py-1.5 px-2 rounded-lg bg-teal text-white hover:bg-teal-dark font-bold transition flex items-center justify-center gap-1 ${isFullSize ? "w-full text-xs py-2 px-4" : "col-span-1 text-[10px]"}`}
        >
          <MessageSquare className="w-3 h-3" /> Open Chat
        </button>
      );
    }

    if (msgState.type === "pending_sent") {
      return (
        <button
          disabled
          className={`py-1.5 px-2 rounded-lg bg-sand border border-warm/60 text-warm-muted/70 font-bold transition flex items-center justify-center gap-1 cursor-not-allowed ${isFullSize ? "w-full text-xs py-2 px-4" : "col-span-1 text-[10px]"}`}
        >
          <Clock className="w-3 h-3" /> Pending
        </button>
      );
    }

    if (msgState.type === "pending_received") {
      return (
        <button
          onClick={() => navigate({ to: `/dashboard/messages?review=${msgState.reqId}` })}
          className={`py-1.5 px-2 rounded-lg bg-primary text-white hover:bg-primary-dark font-bold transition flex items-center justify-center gap-1 shadow-xs ${isFullSize ? "w-full text-xs py-2 px-4" : "col-span-1 text-[10px]"}`}
        >
          <AlertCircle className="w-3 h-3" /> Review
        </button>
      );
    }

    if (msgState.type === "rejected") {
      const diff = new Date().getTime() - new Date(msgState.updatedAt).getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      if (days < 7) {
        return (
          <button
            disabled
            className={`py-1.5 px-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-800/70 font-bold transition flex items-center justify-center gap-1 cursor-not-allowed ${isFullSize ? "w-full text-xs py-2 px-4" : "col-span-1 text-[10px]"}`}
          >
            <XCircle className="w-3 h-3" /> Declined
          </button>
        );
      }
    }

    return (
      <button
        onClick={() => {
          setRequestTarget(member);
          setShowRequestModal(true);
        }}
        className={`py-1.5 px-2 rounded-lg bg-sand/40 hover:bg-sand/70 border border-warm/50 text-warm-muted hover:text-foreground font-bold transition flex items-center justify-center gap-1 ${isFullSize ? "w-full text-xs py-2 px-4" : "col-span-1 text-[10px]"}`}
      >
        <MessageSquare className="w-3.5 h-3.5 text-primary shrink-0" /> Message
      </button>
    );
  };

  // Paged members for scroll / lazy loading
  const pagedMembers = useMemo(() => {
    return filteredMembers.slice(0, visibleCount);
  }, [filteredMembers, visibleCount]);

  // Load more function
  const handleLoadMore = () => {
    setVisibleCount(prev => prev + 12);
  };

  const handleDownloadDirectory = () => {
    if (filteredMembers.length === 0) {
      alert("No members matching the current filters to download.");
      return;
    }
    const headers = ["Name", "Email", "Phone", "Gender", "Birthdate", "Age", "Role", "State", "District", "Taluka", "Village", "Profession", "Education"];
    const rows = filteredMembers.map(m => [
      m.name || "",
      m.email || "",
      m.phone || "",
      m.gender || "",
      m.birthdate || "",
      m.age || "",
      m.role || "",
      m.state || "",
      m.district || "",
      m.taluka || "",
      m.village || "",
      m.profession || "",
      m.education || ""
    ]);
    
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.map(val => {
      const stringVal = val === null || val === undefined ? "" : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    }).join(","))].join("\n");
      
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Member_Directory_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Click suggestion handler
  const handleSuggestionClick = (text: string) => {
    setQ(text);
    setShowSuggestions(false);
  };

  // Community tree node renderer
  const [collapsedNodes, setCollapsedNodes] = useState<Record<number, boolean>>({});
  const toggleNodeCollapse = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderCommunityTree = (node: any) => {
    if (!node) return null;
    const isCollapsed = collapsedNodes[node.id];
    const isCurrentActive = String(node.id) === filterCommunity;
    const hasChildren = node.children && node.children.length > 0;

    return (
      <div key={node.id} className="pl-3 mt-1.5 select-none">
        <div 
          onClick={() => setFilterCommunity(isCurrentActive ? "All" : String(node.id))}
          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs font-semibold ${
            isCurrentActive 
              ? "bg-primary text-white shadow-sm" 
              : "hover:bg-sand/65 text-foreground/80"
          }`}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            {hasChildren ? (
              <button 
                onClick={(e) => toggleNodeCollapse(node.id, e)}
                className="w-4 h-4 flex items-center justify-center rounded hover:bg-black/10 transition"
              >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            ) : (
              <span className="w-4" />
            )}
            <span className="truncate">{node.name}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${
              isCurrentActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
            }`}>
              {node.type === "Super" ? "Parent" : "Local"}
            </span>
          </div>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
            isCurrentActive ? "bg-white/20 text-white" : "bg-sand text-warm-muted"
          }`}>
            {node.memberCount}
          </span>
        </div>
        
        {hasChildren && !isCollapsed && (
          <div className="border-l border-warm/60 ml-2.5 pl-1.5 mt-0.5">
            {node.children.map((child: any) => renderCommunityTree(child))}
          </div>
        )}
      </div>
    );
  };

  // Mock data generator helper for the drawer
  const getDynamicBio = (m: any) => {
    if (m.bio) return m.bio;
    return `An active member of ${m.community_name || m.community?.name || "our Community"} since ${m.joined_date || m.joinedDate || "registration"}. Committed to local initiatives, professional development, and community networking. Always eager to connect with like-minded individuals.`;
  };

  const getDynamicSkills = (m: any) => {
    const defaultSkills = ["Community Engagement", "Public Relations", "Teamwork", "Social Work"];
    if (m.profession === "Software Engineer" || m.profession?.includes("Developer") || m.profession?.includes("IT")) {
      return ["Web Development", "React/Node.js", "System Design", "JavaScript", "Problem Solving", "Database Management"];
    }
    if (m.profession?.includes("Business") || m.profession_type === "Business") {
      return ["Business Administration", "Marketing", "Strategic Planning", "Financial Analysis", "Negotiation", "Leadership"];
    }
    if (m.profession?.includes("Doctor") || m.profession?.includes("Nurse") || m.profession?.includes("Medical")) {
      return ["Patient Care", "Healthcare Management", "Diagnosis", "Clinical Research", "Emergency Response"];
    }
    return defaultSkills;
  };

  const getDynamicInterests = (m: any) => {
    return ["Community upliftment", "Networking events", "Charitable donations", "Social seminars", "Career guidance"];
  };

  const getDynamicGallery = (m: any) => {
    // Generate beautiful colored blocks with icon details to mock gallery photos
    return [
      { id: 1, title: "Samaj Mahotsav 2026", date: "Jan 2026", color: "from-orange-400 to-amber-500" },
      { id: 2, title: "Blood Donation Camp", date: "Feb 2026", color: "from-red-400 to-rose-500" },
      { id: 3, title: "Career Guidance Seminar", date: "Mar 2026", color: "from-blue-400 to-indigo-500" },
      { id: 4, title: "Tree Plantation Drive", date: "Apr 2026", color: "from-emerald-400 to-teal-500" },
    ];
  };

  return (
    <PageWrap 
      title="Member Directory" 
      desc="Discover, collaborate, and connect with verified members across your community hierarchy."
      action={
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadDirectory}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E6D9C8] hover:bg-sand/35 bg-white text-xs font-bold text-foreground/80 hover:text-foreground transition shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-warm-muted" /> Download Directory
          </button>
          <Sparkles className="w-6 h-6 text-primary animate-pulse hidden sm:block" />
        </div>
      }
    >
      
      {/* Stats Section */}
      <div className="mb-8 p-5 sm:p-6 bg-gradient-to-r from-orange-50/20 to-amber-50/25 rounded-3xl border border-warm/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[
            {
              label: "Total Members",
              sub: "Across community",
              val: stats.total,
              icon: Users,
              bg: "bg-[#FFF3E0]",
              color: "text-[#FF6F00]"
            },
            {
              label: "Verified Aadhaars",
              sub: "Trusted members",
              val: stats.verified,
              icon: ShieldCheck,
              bg: "bg-[#E8F5E9]",
              color: "text-[#2E7D32]"
            },
            {
              label: "Business Owners",
              sub: "Verified businesses",
              val: stats.businessOwners,
              icon: Briefcase,
              bg: "bg-[#FFFDE7]",
              color: "text-[#F57F17]"
            },
            {
              label: "Committee Members",
              sub: "Active in community",
              val: stats.committee,
              icon: Award,
              bg: "bg-[#E8EAF6]",
              color: "text-[#3F51B5]"
            },
            {
              label: "New This Month",
              sub: "Recently joined",
              val: stats.thisMonth,
              icon: Calendar,
              bg: "bg-[#FCE4EC]",
              color: "text-[#C2185B]"
            }
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-warm/60 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-300 flex items-center gap-4"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-2xl font-extrabold text-foreground tracking-tight leading-none font-ui">
                  {loading ? "..." : item.val}
                </div>
                <div className="text-[11px] font-bold text-foreground mt-1 truncate">
                  {item.label}
                </div>
                <div className="text-[9px] font-medium text-warm-muted truncate">
                  {item.sub}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ─── SECTION 2: SMART SEARCH BAR ─── */}
      <div className="mb-6 relative">
        <div className="relative flex items-center bg-white border border-[#E6D9C8] rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition p-1">
          <div className="pl-3 shrink-0">
            <Search className={`w-5 h-5 ${q ? "text-primary animate-pulse" : "text-warm-muted"}`} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search by name, profession, business, village, or community..."
            className="w-full pl-3 pr-4 py-3 text-sm focus:outline-hidden text-foreground bg-transparent"
          />
          {q && (
            <button 
              onClick={() => { setQ(""); setShowSuggestions(false); }}
              className="p-2 mr-1 rounded-full hover:bg-sand transition text-warm-muted"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition mr-1 ${
              showFilters || activeFilterCount > 0
                ? "bg-primary text-white" 
                : "bg-sand hover:bg-sand/80 text-warm-muted"
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>
        </div>

        {/* Suggestions Autocomplete Dropdown */}
        <AnimatePresence>
          {showSuggestions && searchSuggestions.length > 0 && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowSuggestions(false)} 
              />
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-warm shadow-xl z-20 overflow-hidden divide-y divide-warm/30"
              >
                <div className="p-2 px-3 text-[10px] font-extrabold uppercase tracking-wider text-warm-muted bg-sand/35">
                  Suggestions
                </div>
                {searchSuggestions.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item.text)}
                    className="w-full text-left p-3 hover:bg-sand/50 transition flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {item.type === "name" && <User className="w-3.5 h-3.5 text-primary shrink-0" />}
                      {item.type === "profession" && <Briefcase className="w-3.5 h-3.5 text-gold shrink-0" />}
                      {item.type === "city" && <MapPin className="w-3.5 h-3.5 text-teal shrink-0" />}
                      {item.type === "community" && <Users className="w-3.5 h-3.5 text-indigo-500 shrink-0" />}
                      <span className="font-semibold text-foreground truncate">{item.text}</span>
                    </div>
                    <span className="text-[10px] font-extrabold text-warm-muted uppercase tracking-wider shrink-0 bg-sand px-2 py-0.5 rounded">
                      {item.type}
                    </span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ─── SECTION 3: ADVANCED FILTERS PANEL ─── */}
      <AnimatePresence>
        {(showFilters || activeFilterCount > 0) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6"
          >
            <div className="p-5 bg-sand/25 border border-warm rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-warm-muted uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Advanced Filters
                </h3>
                {activeFilterCount > 0 && (
                  <button 
                    onClick={handleResetFilters}
                    className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    Reset All Filters
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Community select */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted block mb-1.5">
                    Filter by Community
                  </label>
                  <select
                    value={filterCommunity}
                    onChange={(e) => setFilterCommunity(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-warm bg-white font-semibold focus:outline-hidden"
                  >
                    <option value="All">All Communities</option>
                    {communities
                      .filter(c => allowedCommunityIds === null || allowedCommunityIds.has(c.id))
                      .map(c => (
                        <option key={c.id} value={String(c.id)}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Profession select */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted block mb-1.5">
                    Profession
                  </label>
                  <select
                    value={filterProfession}
                    onChange={(e) => setFilterProfession(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-warm bg-white font-semibold focus:outline-hidden"
                  >
                    <option value="All">All Professions</option>
                    {professionsList.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Village / City select */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted block mb-1.5">
                    Village / City
                  </label>
                  <select
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-warm bg-white font-semibold focus:outline-hidden"
                  >
                    <option value="All">All Locations</option>
                    {citiesList.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                {/* State select */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted block mb-1.5">
                    State
                  </label>
                  <select
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value)}
                    className="w-full p-2 text-xs rounded-lg border border-warm bg-white font-semibold focus:outline-hidden"
                  >
                    <option value="All">All States</option>
                    {statesList.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Toggles & Segmented buttons */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-warm/40">
                {/* Gender pills */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted block mb-1.5">
                    Gender
                  </label>
                  <div className="flex gap-1">
                    {["All", "Male", "Female", "Other"].map(g => (
                      <button
                        key={g}
                        onClick={() => setFilterGender(g)}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                          filterGender === g 
                            ? "bg-primary text-white shadow-xs" 
                            : "bg-white border border-warm text-foreground/80 hover:bg-sand/40"
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age group pills */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-warm-muted block mb-1.5">
                    Age Range
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: "All", label: "All" },
                      { id: "under-25", label: "< 25" },
                      { id: "25-35", label: "25-35" },
                      { id: "36-50", label: "36-50" },
                      { id: "50-plus", label: "50+" },
                    ].map(a => (
                      <button
                        key={a.id}
                        onClick={() => setFilterAgeGroup(a.id)}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition ${
                          filterAgeGroup === a.id 
                            ? "bg-primary text-white shadow-xs" 
                            : "bg-white border border-warm text-foreground/80 hover:bg-sand/40"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Boolean Switch Pills */}
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { state: filterBusinessOwner, setter: setFilterBusinessOwner, label: "Business Owner", icon: Store },
                    { state: filterCommittee, setter: setFilterCommittee, label: "Committee Representative", icon: Award },
                    { state: filterVerifiedOnly, setter: setFilterVerifiedOnly, label: "Verified Aadhaar", icon: CheckCircle },
                  ].map((pill, i) => (
                    <button
                      key={i}
                      onClick={() => pill.setter(!pill.state)}
                      className={`flex items-center gap-1.5 py-1.5 px-3 rounded-full text-xs font-bold border transition ${
                        pill.state
                          ? "bg-teal/10 text-teal border-teal/30"
                          : "bg-white border-warm text-warm-muted hover:border-primary/30"
                      }`}
                    >
                      <pill.icon className={`w-3.5 h-3.5 ${pill.state ? "text-teal" : "text-warm-muted"}`} />
                      {pill.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main layout container (Navigator + Cards Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* ─── SECTION 4: COMMUNITY HIERARCHY NAVIGATOR (Left Sidebar on Desktop) ─── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-4 bg-white border border-warm rounded-2xl shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-warm">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-warm-muted flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Community Hierarchy
              </h3>
              {filterCommunity !== "All" && (
                <button 
                  onClick={() => setFilterCommunity("All")}
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Show All
                </button>
              )}
            </div>
            
            {loading ? (
              <div className="space-y-2 py-4">
                <div className="h-6 bg-sand/50 rounded-lg animate-pulse" />
                <div className="h-6 bg-sand/50 rounded-lg animate-pulse pl-4" />
                <div className="h-6 bg-sand/50 rounded-lg animate-pulse pl-8" />
              </div>
            ) : hierarchyTree ? (
              <div className="py-2 overflow-y-auto max-h-[350px]">
                {renderCommunityTree(hierarchyTree)}
              </div>
            ) : (
              <p className="text-xs text-warm-muted py-4 text-center">
                No hierarchical data loaded.
              </p>
            )}
          </div>

          {/* Quick view switcher pills */}
          <div className="bg-sand p-1 rounded-xl flex">
            {[
              { id: "grid", label: "Grid View", icon: Grid3x3 },
              { id: "list", label: "List View", icon: List },
              { id: "map", label: "Location Pins", icon: Map }
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setView(v.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
                  view === v.id
                    ? "bg-white text-primary shadow-sm"
                    : "text-warm-muted hover:text-foreground"
                }`}
              >
                <v.icon className="w-3.5 h-3.5" />
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Members content space */}
        <div className="lg:col-span-3">

          {/* Skeletons Loading State */}
          {loading ? (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-6 bg-white border border-warm rounded-2xl shadow-xs space-y-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-sand" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-sand rounded w-3/4" />
                      <div className="h-3 bg-sand rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-sand rounded w-full" />
                    <div className="h-3 bg-sand rounded w-5/6" />
                  </div>
                  <div className="h-9 bg-sand rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* ─── SECTION 5: MEMBERS CARD GRID / LIST / MAP ─── */}
              {view === "grid" && (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {pagedMembers.map((m, index) => {
                    const isConnected = connections[m.id];
                    const hasBusiness = m.business_name || m.profession_type === "Business";
                    const isCommittee = m.role === "community_admin" || m.role === "committee";
                    const isVerified = m.aadhaar_status === "Approved" || m.status === "Verified";
                    
                    return (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: (index % 6) * 0.05 }}
                        className="group relative bg-white border border-warm rounded-2xl p-5 hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Top Section */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="relative">
                              <AvatarCircle name={m.name} src={m.avatar || m.avatar_url} size={60} />
                              {/* Pulsing online status dot */}
                              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20 animate-pulse" />
                            </div>
                            
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              {isVerified && (
                                <span className="flex items-center gap-0.5 text-[9px] font-extrabold bg-teal/10 text-teal px-2 py-0.5 rounded-full uppercase">
                                  <CheckCircle className="w-2.5 h-2.5" /> Verified
                                </span>
                              )}
                              {hasBusiness && (
                                <span className="flex items-center gap-0.5 text-[9px] font-extrabold bg-gold-light text-gold px-2 py-0.5 rounded-full uppercase">
                                  <Store className="w-2.5 h-2.5" /> Business
                                </span>
                              )}
                              {isCommittee && (
                                <span className="flex items-center gap-0.5 text-[9px] font-extrabold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full uppercase border border-indigo-100">
                                  <Award className="w-2.5 h-2.5" /> Leader
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Member Information */}
                          <div className="mt-4">
                            <h3 className="font-ui font-extrabold text-base text-foreground leading-tight group-hover:text-primary transition">
                              {m.name}
                            </h3>
                            <p className="text-xs font-semibold text-warm-muted mt-1 flex items-center gap-1">
                              <Briefcase className="w-3.5 h-3.5 shrink-0 text-gold" />
                              {m.job_title || m.profession || "Community Member"}
                            </p>
                            {m.company && (
                              <p className="text-[11px] text-warm-muted/80 pl-4.5 font-medium">
                                at {m.company}
                              </p>
                            )}

                            <div className="mt-3 flex items-center gap-1 text-[11px] text-warm-muted font-bold">
                              <MapPin className="w-3.5 h-3.5 shrink-0 text-teal" />
                              <span>{m.village || m.district || "Gujarat"}</span>
                              {m.state && <span className="opacity-60">• {m.state}</span>}
                            </div>
                          </div>

                          {/* Community Breadcrumb Tag */}
                          <div className="mt-4 pt-3 border-t border-warm/40 text-[10px] text-warm-muted/75 font-semibold">
                            📁 {getCommunityName(m)}
                          </div>
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="mt-5 pt-3 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setSelectedMember(m);
                              setActiveTab("about");
                            }}
                            className="py-1.5 px-2 rounded-lg border border-warm hover:bg-sand text-xs font-bold text-foreground transition flex items-center justify-center gap-1"
                          >
                            View Details
                          </button>
                          
                          <button
                            onClick={() => handleConnect(m.id, m.name)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                              isConnected 
                                ? "bg-teal text-white" 
                                : "bg-primary text-white hover:bg-primary-dark shadow-xs"
                            }`}
                          >
                            {isConnected ? (
                              <>
                                <Check className="w-3 h-3" /> Connected
                              </>
                            ) : (
                              <>
                                <Heart className="w-3 h-3" /> Connect
                              </>
                            )}
                          </button>

                          {m.phone && (
                            <a
                              href={`tel:${m.phone}`}
                              className="col-span-1 py-1 px-2 rounded-lg bg-sand/40 hover:bg-sand/70 border border-warm/50 text-[10px] font-bold text-warm-muted flex items-center justify-center gap-1 transition"
                            >
                              <Phone className="w-3 h-3" /> Call
                            </a>
                          )}

                          {renderMessageButton(m)}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* List view list table */}
              {view === "list" && (
                <div className="bg-white border border-warm rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-sand/45 border-b border-warm text-xs font-extrabold uppercase tracking-wider text-warm-muted">
                        <tr>
                          <th className="p-4">Member Name</th>
                          <th className="p-4">Profession</th>
                          <th className="p-4">Village / City</th>
                          <th className="p-4">Community Scope</th>
                          <th className="p-4">Quick Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm/30">
                        {pagedMembers.map(m => (
                          <tr key={m.id} className="hover:bg-sand/25 transition">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <AvatarCircle name={m.name} src={m.avatar || m.avatar_url} size={40} />
                                <div>
                                  <div className="font-extrabold text-foreground">{m.name}</div>
                                  <div className="text-[10px] font-semibold text-warm-muted flex items-center gap-1 mt-0.5">
                                    {m.aadhaar_status === "Approved" && (
                                      <span className="text-teal bg-teal/10 px-1 rounded text-[9px]">Verified</span>
                                    )}
                                    <span>Joined: {m.joined_date || m.joinedDate || "—"}</span>
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-semibold text-warm-muted text-xs">
                              {m.job_title || m.profession || "—"}
                            </td>
                            <td className="p-4 text-xs font-bold text-foreground">
                              {m.village || m.district || "—"}
                            </td>
                            <td className="p-4 text-[11px] font-semibold text-warm-muted">
                              {getCommunityName(m)}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedMember(m);
                                    setActiveTab("about");
                                  }}
                                  className="px-2.5 py-1 text-xs font-bold text-primary hover:underline"
                                >
                                  Details
                                </button>
                                {m.phone && (
                                  <a
                                    href={`tel:${m.phone}`}
                                    className="p-1.5 rounded-lg bg-sand/40 hover:bg-sand/80 transition"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-warm-muted" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Map/Location pins view */}
              {view === "map" && (
                <div className="relative bg-white border border-warm rounded-2xl p-5 shadow-xs overflow-hidden">
                  <div className="h-96 relative rounded-xl overflow-hidden bg-sand/30 border border-warm flex items-center justify-center">
                    {/* SVG map grid */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#ffedd5,transparent_60%),radial-gradient(circle_at_70%_60%,#ccfbf1,transparent_60%),#f5efe6]" />
                    
                    {/* Stylized dots & regions */}
                    <svg className="absolute inset-0 w-full h-full opacity-40" viewBox="0 0 800 400" fill="none">
                      <path d="M150 100 C 200 80, 250 150, 300 120 C 350 90, 400 200, 450 180 C 500 160, 550 250, 600 220" stroke="#E6D9C8" strokeWidth="3" strokeDasharray="5 5" />
                      <circle cx="200" cy="150" r="80" stroke="#EA580C" strokeWidth="1" strokeDasharray="2 4" />
                      <circle cx="500" cy="220" r="100" stroke="#0D9488" strokeWidth="1" strokeDasharray="2 4" />
                    </svg>

                    {/* Plot unique locations dynamically */}
                    {citiesList.map((city, idx) => {
                      const count = approvedMembers.filter(m => m.village === city).length;
                      // Seeded position coordinate generator
                      const seedX = 100 + (idx * 137) % 600;
                      const seedY = 80 + (idx * 89) % 240;

                      return (
                        <motion.div
                          key={city}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          style={{ left: `${(seedX / 800) * 100}%`, top: `${(seedY / 400) * 100}%` }}
                          className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                        >
                          <div className="relative flex items-center justify-center">
                            <span className="absolute inline-flex h-8 w-8 rounded-full bg-primary/30 animate-ping" />
                            <div className="relative w-5 h-5 rounded-full bg-primary border-2 border-white shadow-md flex items-center justify-center text-[8px] font-extrabold text-white">
                              {count}
                            </div>
                            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-foreground text-white text-[9px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition whitespace-nowrap shadow-lg">
                              {city}: {count} members
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur border border-warm px-3.5 py-2 rounded-xl text-xs font-bold text-warm-muted shadow-md">
                      📍 {citiesList.length} active villages mapped
                    </div>
                  </div>
                </div>
              )}

              {/* Empty state component if no members matched search/filter */}
              {filteredMembers.length === 0 && (
                <div className="p-12 text-center bg-white border border-warm rounded-2xl shadow-xs">
                  <div className="w-16 h-16 bg-sand rounded-full flex items-center justify-center mx-auto text-warm-muted mb-4">
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-base font-extrabold text-foreground">No Members Found</h3>
                  <p className="text-xs text-warm-muted mt-2 max-w-xs mx-auto">
                    Try relaxing your search terms, modifying your filters, or broadening your community scope selection.
                  </p>
                  <button
                    onClick={handleResetFilters}
                    className="mt-5 py-2 px-5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark transition shadow-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              )}

              {/* Load more button */}
              {filteredMembers.length > visibleCount && (
                <div className="mt-8 text-center">
                  <button
                    onClick={handleLoadMore}
                    className="py-2.5 px-6 border border-warm hover:bg-sand text-xs font-bold text-foreground rounded-xl transition inline-flex items-center gap-2"
                  >
                    Load More Members <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ─── SECTION 6: MEMBER DETAIL DRAWER ─── */}
      <DetailDrawer 
        open={!!selectedMember} 
        onClose={() => setSelectedMember(null)} 
        title="Member Profile Detail"
        size="lg"
      >
        {selectedMember && (
          <div className="space-y-6">
            
            {/* Cover image & Profile Image Container */}
            <div className="relative rounded-2xl overflow-hidden border border-warm bg-gradient-to-r from-orange-400 to-amber-500 h-36">
              <div className="absolute inset-0 bg-black/10 backdrop-blur-xs" />
              <div className="absolute -bottom-10 left-6">
                <div className="relative">
                  <AvatarCircle name={selectedMember.name} src={selectedMember.avatar || selectedMember.avatar_url} size={90} />
                  <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-2 ring-emerald-500/20" />
                </div>
              </div>
            </div>

            {/* Profile Info Summary */}
            <div className="pt-6 pl-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-foreground flex items-center gap-2 leading-tight">
                  {selectedMember.name}
                  {selectedMember.aadhaar_status === "Approved" && (
                    <CheckCircle className="w-5 h-5 text-teal shrink-0" />
                  )}
                </h2>
                <p className="text-xs font-bold text-primary mt-1 flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 shrink-0" />
                  {selectedMember.job_title || selectedMember.profession || "Community Member"}
                </p>
                <p className="text-[11px] text-warm-muted font-semibold mt-1">
                  📍 {selectedMember.village || "Gujarat"} • {selectedMember.community_name || selectedMember.community?.name || "Local Samaj"}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleConnect(selectedMember.id, selectedMember.name)}
                  className={`py-1.5 px-4 rounded-xl text-xs font-bold transition shadow-xs ${
                    connections[selectedMember.id]
                      ? "bg-teal text-white"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
                >
                  {connections[selectedMember.id] ? "✓ Connected" : "Connect"}
                </button>
                {renderMessageButton(selectedMember, false)}
                {selectedMember.phone && (
                  <a
                    href={`tel:${selectedMember.phone}`}
                    className="py-1.5 px-3 border border-warm rounded-xl bg-sand/30 hover:bg-sand/70 text-xs font-bold text-warm-muted transition flex items-center justify-center"
                  >
                    Call
                  </a>
                )}
              </div>
            </div>

            {/* Tab Controls */}
            <div className="border-b border-warm/60 flex overflow-x-auto gap-1">
              {[
                { id: "about", label: "About" },
                { id: "contact", label: "Contact" },
                { id: "activity", label: "Community Activity" },
                { id: "business", label: "Business" },
                { id: "gallery", label: "Gallery" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2.5 px-4 text-xs font-bold whitespace-nowrap border-b-2 transition ${
                    activeTab === tab.id
                      ? "border-primary text-primary"
                      : "border-transparent text-warm-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Contents */}
            <div className="py-2">
              
              {/* Tab: About */}
              {activeTab === "about" && (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Bio</h4>
                    <p className="text-xs text-foreground/80 leading-relaxed bg-sand/15 p-4 border border-warm/40 rounded-xl">
                      {getDynamicBio(selectedMember)}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {getDynamicSkills(selectedMember).map((skill, idx) => (
                        <span key={idx} className="bg-sand text-warm-muted text-[10px] font-bold px-2.5 py-1 rounded-full border border-warm/60">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted">Interests</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {getDynamicInterests(selectedMember).map((interest, idx) => (
                        <span key={idx} className="bg-primary/5 text-primary text-[10px] font-bold px-2.5 py-1 rounded-full border border-primary/10">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedMember.education && (
                    <div className="pt-2 grid grid-cols-2 gap-4 border-t border-warm/40">
                      <div>
                        <span className="text-[10px] font-extrabold text-warm-muted block uppercase">Education Level</span>
                        <span className="text-xs font-bold text-foreground mt-1 block">{selectedMember.education}</span>
                      </div>
                      {selectedMember.degree && (
                        <div>
                          <span className="text-[10px] font-extrabold text-warm-muted block uppercase">Degree</span>
                          <span className="text-xs font-bold text-foreground mt-1 block">{selectedMember.degree}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Contact */}
              {activeTab === "contact" && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2.5 border-b border-warm/40">
                    <span className="text-xs text-warm-muted font-bold flex items-center gap-1.5">
                      <Phone className="w-4 h-4 text-primary" /> Phone Number
                    </span>
                    <a href={`tel:${selectedMember.phone}`} className="text-xs font-extrabold text-primary hover:underline">
                      {selectedMember.phone || "—"}
                    </a>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-warm/40">
                    <span className="text-xs text-warm-muted font-bold flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-teal" /> Email Address
                    </span>
                    <a href={`mailto:${selectedMember.email}`} className="text-xs font-extrabold text-teal hover:underline">
                      {selectedMember.email || "—"}
                    </a>
                  </div>

                  <div className="flex justify-between items-center py-2.5 border-b border-warm/40">
                    <span className="text-xs text-warm-muted font-bold flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-gold" /> Personal Web
                    </span>
                    <span className="text-xs font-semibold text-warm-muted">
                      {selectedMember.website || `http://samaj.org/member/${selectedMember.id}`}
                    </span>
                  </div>
                </div>
              )}

              {/* Tab: Community Activity */}
              {activeTab === "activity" && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted mb-2">Events Attended</h4>
                    <div className="space-y-2">
                      <div className="p-3 bg-sand/20 border border-warm/50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-extrabold text-foreground">Annual Samaj Mahotsav 2026</div>
                          <div className="text-[10px] text-warm-muted mt-0.5">Gujarat Community Hall</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px]">ATTENDED</span>
                      </div>
                      <div className="p-3 bg-sand/20 border border-warm/50 rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <div className="font-extrabold text-foreground">Samaj Youth Seminar</div>
                          <div className="text-[10px] text-warm-muted mt-0.5">Surat Community Auditorium</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[9px]">ATTENDED</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted mb-2">Donations & Contributions</h4>
                    <div className="p-3 bg-primary/5 border border-primary/10 rounded-xl text-xs flex justify-between items-center">
                      <div>
                        <div className="font-extrabold text-foreground">Samaj Community Hall Support</div>
                        <div className="text-[10px] text-warm-muted mt-0.5">Contributor since 2025</div>
                      </div>
                      <span className="text-xs font-extrabold text-primary">₹ 5,000</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Business */}
              {activeTab === "business" && (
                <div className="space-y-4">
                  {selectedMember.business_name ? (
                    <div className="p-4 bg-white border border-warm rounded-2xl shadow-xs space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gold-light rounded-xl flex items-center justify-center text-gold shrink-0">
                          <Store className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-foreground text-sm">{selectedMember.business_name}</h4>
                          <span className="px-2 py-0.5 rounded-full bg-sand text-warm-muted font-bold text-[9px] uppercase tracking-wider">
                            {selectedMember.business_category || "General Business"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-t border-warm/40 pt-3">
                        <div>
                          <span className="text-[10px] font-extrabold text-warm-muted uppercase block">GST Registration</span>
                          <span className="font-mono font-semibold text-foreground mt-0.5 block">{selectedMember.gst_no || "Not Registered"}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-extrabold text-warm-muted uppercase block">Years in Business</span>
                          <span className="font-semibold text-foreground mt-0.5 block">{selectedMember.business_years ? `${selectedMember.business_years} Years` : "—"}</span>
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] font-extrabold text-warm-muted uppercase block">Business Website / Profile</span>
                        <a href="#" className="text-xs font-bold text-primary hover:underline mt-0.5 block truncate">
                          http://ahirnetwork.org/business/{selectedMember.id}
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-sand/15 border border-warm/40 rounded-2xl">
                      <Store className="w-8 h-8 text-warm-muted mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-semibold text-warm-muted">No business profile registered under this member.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Gallery */}
              {activeTab === "gallery" && (
                <div>
                  <h4 className="text-[10px] font-extrabold uppercase tracking-widest text-warm-muted mb-3">Community Gallery Contributions</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {getDynamicGallery(selectedMember).map(photo => (
                      <div key={photo.id} className="group relative rounded-xl overflow-hidden aspect-video border border-warm">
                        <div className={`absolute inset-0 bg-gradient-to-br ${photo.color}`} />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center p-3">
                          <span className="text-[10px] font-extrabold text-white uppercase tracking-wider text-center">{photo.title}</span>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-[9px] font-bold text-white bg-black/20 backdrop-blur-md px-2 py-1 rounded-md">
                          <span>{photo.title}</span>
                          <span className="opacity-80">{photo.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        )}
      </DetailDrawer>

      {/* ─── MESSAGE REQUEST MODAL ─── */}
      <AnimatePresence>
        {showRequestModal && requestTarget && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity" 
              onClick={() => { if (!sendingRequest) setShowRequestModal(false); }} 
            />
            <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white border border-warm rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative"
              >
                <div className="p-6 border-b border-warm flex items-center justify-between bg-sand/15">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800">Send Message Request</h3>
                    <p className="text-[10px] text-warm-muted font-bold uppercase tracking-wider mt-0.5">
                      To: {requestTarget.name}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    disabled={sendingRequest}
                    className="p-1 rounded-full hover:bg-sand text-warm-muted hover:text-foreground font-black text-sm"
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleSendRequest} className="p-6 space-y-4">
                  {requestError && (
                    <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{requestError}</span>
                    </div>
                  )}

                  {requestSuccess && (
                    <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0" />
                      <span>{requestSuccess}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-warm-muted block mb-1">
                      Reason for Contact
                    </label>
                    <select
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      className="w-full p-2.5 text-xs rounded-xl border border-warm bg-white font-bold text-foreground focus:outline-hidden"
                      required
                    >
                      <option value="Networking">Networking</option>
                      <option value="Business">Business</option>
                      <option value="Community Help">Community Help</option>
                      <option value="Matrimony">Matrimony</option>
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {reqReason === "Other" && (
                    <div>
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-warm-muted block mb-1">
                        Please specify reason
                      </label>
                      <input
                        type="text"
                        value={reqCustomReason}
                        onChange={(e) => setReqCustomReason(e.target.value)}
                        placeholder="e.g. Social Event Collab"
                        className="w-full px-3 py-2 border border-warm rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-hidden font-semibold"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-warm-muted block mb-1">
                      Subject (Optional)
                    </label>
                    <input
                      type="text"
                      value={reqSubject}
                      onChange={(e) => setReqSubject(e.target.value)}
                      placeholder="e.g. Professional networking inquiry"
                      className="w-full px-3 py-2 border border-warm rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-extrabold uppercase tracking-wider text-warm-muted block mb-1">
                      Introduction Message (Required)
                    </label>
                    <textarea
                      value={reqIntro}
                      onChange={(e) => setReqIntro(e.target.value)}
                      placeholder="Introduce yourself and explain why you want to connect..."
                      rows={4}
                      className="w-full px-3 py-2 border border-warm rounded-xl text-xs focus:ring-1 focus:ring-primary focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-3 border-t border-warm">
                    <button
                      type="button"
                      onClick={() => setShowRequestModal(false)}
                      disabled={sendingRequest}
                      className="py-2 px-4 rounded-xl border border-warm hover:bg-sand text-xs font-bold text-warm-muted transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingRequest || !reqIntro.trim()}
                      className="py-2 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold shadow-xs transition flex items-center gap-1.5"
                    >
                      {sendingRequest && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Send Request
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

    </PageWrap>
  );
}
