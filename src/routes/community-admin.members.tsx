import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, CheckCircle, XCircle, MoreVertical, Loader2, AlertCircle } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, DetailDrawer, StatusBadge } from "@/components/wag/primitives";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

export const Route = createFileRoute("/community-admin/members")({
  component: () => {
    const { user } = useAuth();
    const [members, setMembers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("All");
    const [open, setOpen] = useState<any | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedVillage, setSelectedVillage] = useState("All");
    const [actionLoading, setActionLoading] = useState(false);

    const tabs = ["All", "Verified", "Pending", "Rejected", "Suspended"];

    const fetchMembers = () => {
      if (!user || !user.communityId) return;
      setLoading(true);
      api.getMembers({ communityId: user.communityId })
        .then(res => {
          setMembers(res || []);
        })
        .catch(err => console.error("Failed to load members", err))
        .finally(() => setLoading(false));
    };

    useEffect(() => {
      fetchMembers();
    }, [user]);

    const handleUpdateMember = async (memberId: string, data: any) => {
      setActionLoading(true);
      try {
        const updated = await api.updateMember(memberId, data);
        setOpen(prev => prev && prev.id === memberId ? { ...prev, ...updated } : prev);
        fetchMembers();
      } catch (e) {
        console.error("Failed to update member", e);
      } finally {
        setActionLoading(false);
      }
    };

    const handleUpdateStatus = async (memberId: string, status: string) => {
      await handleUpdateMember(memberId, { status });
    };

    const filteredList = members.filter(m => {
      const matchesTab = tab === "All" || m.status === tab;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (m.name || "").toLowerCase().includes(searchLower) ||
        (m.phone || "").includes(searchLower) ||
        (m.village || "").toLowerCase().includes(searchLower) ||
        (m.profession || "").toLowerCase().includes(searchLower);

      const matchesVillage = selectedVillage === "All" || m.village === selectedVillage;

      return matchesTab && matchesSearch && matchesVillage;
    });

    const uniqueVillages = Array.from(new Set(members.map(m => m.village).filter(Boolean)));

    return (
      <PageWrap title="Members" desc={`${filteredList.length} members in your samaj`}>
        <div className="flex gap-2 border-b border-warm mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button 
              key={t} 
              onClick={() => setTab(t)} 
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${tab===t?"border-primary text-primary":"border-transparent text-warm-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
        
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" />
            <input 
              placeholder="Search members" 
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-warm bg-surface" 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
            value={selectedVillage}
            onChange={e => setSelectedVillage(e.target.value)}
          >
            <option value="All">All villages</option>
            {uniqueVillages.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <AnimatedCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand">
                <tr>
                  {["Member","Phone","Status","Joined",""].map(h => (
                    <th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredList.map(m => (
                  <tr 
                    key={m.id} 
                    onClick={() => setOpen(m)} 
                    className="border-t border-warm hover:bg-sand cursor-pointer"
                  >
                    <td className="p-3 flex items-center gap-3">
                      <AvatarCircle name={m.name} src={m.avatar || m.avatar_url} size={36} />
                      <div>
                        <div className="font-medium">{m.name}</div>
                        <div className="text-xs text-warm-muted">{m.village}</div>
                      </div>
                    </td>
                    <td className="p-3">{m.phone}</td>
                    <td className="p-3">
                      <StatusBadge status={m.status} />
                    </td>
                    <td className="p-3">
                      {m.joined_date || m.joinedDate}
                    </td>
                    <td className="p-3">
                      <MoreVertical className="w-4 h-4 text-warm-muted" />
                    </td>
                  </tr>
                ))}
                {filteredList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-warm-muted">
                      No members found matching the criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </AnimatedCard>
        )}

        <DetailDrawer open={!!open} onClose={() => setOpen(null)} title="Member Details">
          {open && (
            <div className="space-y-4">
              <div className="text-center">
                <AvatarCircle name={open.name} src={open.avatar || open.avatar_url} size={100} />
                <h2 className="font-ui font-bold text-lg mt-3">{open.name}</h2>
                <div className="mt-1">
                  <StatusBadge status={open.status} />
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                {[
                  ["Phone", open.phone],
                  ["Email", open.email],
                  ["Profession", open.profession],
                  ["Village", open.village],
                  ["Joined", open.joined_date || open.joinedDate]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-warm pb-2">
                    <span className="text-warm-muted">{k}</span>
                    <span className="font-medium">{v || "N/A"}</span>
                  </div>
                ))}

                {/* Aadhaar Row with Status Badge */}
                <div className="flex justify-between border-b border-warm pb-2 items-center">
                  <span className="text-warm-muted">Aadhaar</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{open.aadhaar || "N/A"}</span>
                    <StatusBadge status={open.aadhaar_status || "Pending"} />
                  </div>
                </div>
              </div>
              
              {/* Step 1: Aadhaar Verification Action Panel */}
              <div className="bg-sand/50 rounded-xl p-3 border border-warm space-y-2">
                <div className="text-xs font-semibold text-warm-muted uppercase tracking-wider">Step 1: Aadhaar ID Status</div>
                
                {open.aadhaar_status === 'Approved' ? (
                  <div className="flex items-center justify-between bg-teal/10 border border-teal/20 text-teal-850 px-3 py-2 rounded-lg text-xs font-medium">
                    <span className="flex items-center gap-1 text-teal-800">
                      <CheckCircle className="w-3.5 h-3.5 text-teal" />
                      Aadhaar Approved & Verified
                    </span>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleUpdateMember(open.id, { aadhaar_status: 'Rejected' })}
                      className="text-[10px] text-red-500 hover:underline font-semibold"
                    >
                      Reject Aadhaar
                    </button>
                  </div>
                ) : open.aadhaar_status === 'Rejected' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-750 px-3 py-2 rounded-lg text-xs font-medium">
                      <span className="flex items-center gap-1 text-red-700">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        Aadhaar Rejected
                      </span>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateMember(open.id, { aadhaar_status: 'Approved' })}
                        className="text-[10px] text-teal hover:underline font-semibold"
                      >
                        Approve Aadhaar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-xs text-warm-muted leading-relaxed">
                      Please review the member's Aadhaar details. Approve the Aadhaar ID to enable profile actions.
                    </div>
                    <div className="flex gap-2">
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateMember(open.id, { aadhaar_status: 'Approved' })}
                        className="flex-1 py-1.5 rounded-lg bg-teal text-white text-xs font-medium flex items-center justify-center gap-1 hover:bg-teal-dark transition disabled:opacity-50"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        Approve Aadhaar
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleUpdateMember(open.id, { aadhaar_status: 'Rejected' })}
                        className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-650 transition disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject Aadhaar
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Member Profile Approval Action Panel */}
              <div className="bg-sand/50 rounded-xl p-3 border border-warm space-y-2">
                <div className="text-xs font-semibold text-warm-muted uppercase tracking-wider">Step 2: Profile Status</div>
                
                {open.aadhaar_status !== 'Approved' ? (
                  <div className="p-3 bg-amber-50 border border-amber-250 rounded-lg text-xs text-amber-800 leading-normal font-medium flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                    <span>Please approve the member's Aadhaar first to enable profile approval / rejection options.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {['Verified', 'Active'].includes(open.status) ? (
                      <div className="bg-teal/10 border border-teal/20 text-teal-850 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5 text-teal" />
                        Profile Approved & Active
                      </div>
                    ) : open.status === 'Rejected' ? (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        Profile Rejected
                      </div>
                    ) : open.status === 'Suspended' ? (
                      <div className="bg-gray-100 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1">
                        Profile Suspended
                      </div>
                    ) : (
                      <div className="text-xs text-warm-muted">
                        Aadhaar verified. You can now approve or reject this member's profile.
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* Only show Approve button if not already active/verified */}
                      {!['Verified', 'Active'].includes(open.status) && (
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(open.id, 'Verified')}
                          className="py-2 rounded-lg bg-teal text-white text-sm flex items-center justify-center gap-1 hover:bg-teal-dark transition disabled:opacity-50"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve Profile
                        </button>
                      )}
                      
                      {/* Only show Reject button if not already rejected */}
                      {open.status !== 'Rejected' && (
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(open.id, 'Rejected')}
                          className="py-2 rounded-lg bg-red-500 text-white text-sm flex items-center justify-center gap-1 hover:bg-red-650 transition disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject Profile
                        </button>
                      )}

                      {/* Other supporting status controls */}
                      {open.status !== 'Suspended' && (
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(open.id, 'Suspended')}
                          className="py-2 rounded-lg border border-warm text-sm hover:bg-sand transition disabled:opacity-50"
                        >
                          Suspend Profile
                        </button>
                      )}

                      {open.status !== 'Pending' && (
                        <button 
                          disabled={actionLoading}
                          onClick={() => handleUpdateStatus(open.id, 'Pending')}
                          className="py-2 rounded-lg border border-warm text-sm hover:bg-sand transition disabled:opacity-50"
                        >
                          Need Info
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DetailDrawer>
      </PageWrap>
    );
  },
});
