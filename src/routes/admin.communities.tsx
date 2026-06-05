import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, FileText, AlertCircle, Calendar } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, DetailDrawer, PlanBadge, StatusBadge } from "@/components/wag/primitives";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/communities")({
  component: () => {
    const [communities, setCommunities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("All");
    const [open, setOpen] = useState<any | null>(null);
    const [remarks, setRemarks] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const tabs = ["All", "Pending Super Requests", "Pending Subsidiary Requests", "Approved Communities", "Rejected Communities"];

    const fetchCommunities = () => {
      setLoading(true);
      api.getCommunities()
        .then(res => {
          setCommunities(res || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    };

    useEffect(() => {
      fetchCommunities();
    }, []);

    useEffect(() => {
      if (open) {
        const fresh = communities.find(c => c.id === open.id);
        if (fresh) setOpen(fresh);
      }
    }, [communities]);

    const handleApprove = async (id: string) => {
      setErrorMsg(null);
      setActionLoading(true);
      try {
        await api.approveCommunity(id, remarks);
        setRemarks("");
        fetchCommunities();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to approve community.");
      } finally {
        setActionLoading(false);
      }
    };

    const handleReject = async (id: string) => {
      setErrorMsg(null);
      if (!remarks.trim()) {
        setErrorMsg("Rejection reason is mandatory.");
        return;
      }
      setActionLoading(true);
      try {
        await api.rejectCommunity(id, remarks);
        setRemarks("");
        fetchCommunities();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to reject community.");
      } finally {
        setActionLoading(false);
      }
    };

    const filteredList = communities.filter(c => {
      const typeIsSuper = c.type === "Super" || c.type === "Super Community";
      const typeIsSub = c.type === "Subsidiary" || c.type === "Subsidiary Community";
      
      if (tab === "All") return true;
      if (tab === "Pending Super Requests") {
        return typeIsSuper && (c.status === "Pending Super Admin Approval" || c.status === "Pending");
      }
      if (tab === "Pending Subsidiary Requests") {
        return typeIsSub && c.status === "Pending Super Admin Approval";
      }
      if (tab === "Approved Communities") {
        return c.status === "Active" || c.status === "Approved";
      }
      if (tab === "Rejected Communities") {
        return c.status?.startsWith("Rejected");
      }
      return true;
    });

    return (
      <PageWrap title="Communities" desc="All platform communities and registration requests">
        <div className="flex gap-2 border-b border-warm mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setErrorMsg(null); }}
              className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                tab === t ? "border-primary text-primary" : "border-transparent text-warm-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <AnimatedCard className="overflow-hidden shadow-sm border border-warm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-sand text-left">
                  <tr>
                    <th className="p-3 text-xs uppercase font-semibold text-warm-muted">Community</th>
                    <th className="p-3 text-xs uppercase font-semibold text-warm-muted">Type</th>
                    <th className="p-3 text-xs uppercase font-semibold text-warm-muted">Location</th>
                    <th className="p-3 text-xs uppercase font-semibold text-warm-muted">Members</th>
                    <th className="p-3 text-xs uppercase font-semibold text-warm-muted">Plan</th>
                    <th className="p-3 text-xs uppercase font-semibold text-warm-muted">Status</th>
                    <th className="p-3 text-xs uppercase font-semibold text-warm-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-warm-muted">
                        No communities found in this tab.
                      </td>
                    </tr>
                  ) : (
                    filteredList.map(c => (
                      <tr 
                        key={c.id} 
                        onClick={() => { setOpen(c); setErrorMsg(null); setRemarks(""); }} 
                        className="hover:bg-sand/30 cursor-pointer transition-colors"
                      >
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={c.logo_url || c.logo || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=120"} 
                              className="w-10 h-10 rounded-xl object-cover border border-warm shadow-sm" 
                              alt=""
                            />
                            <div>
                              <div className="font-semibold text-foreground">{c.name}</div>
                              <div className="text-xs text-warm-muted">{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            c.type === "Super" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {c.type === "Super" ? "Super Community" : "Subsidiary"}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-warm-muted">
                          {c.village ? `${c.village}, ` : ""}{c.district}, {c.state}
                        </td>
                        <td className="p-3 font-medium">
                          {(c.member_count ?? 0).toLocaleString()}
                        </td>
                        <td className="p-3">
                          <PlanBadge plan={c.plan} />
                        </td>
                        <td className="p-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="p-3 text-right" onClick={e => e.stopPropagation()}>
                          <div className="flex gap-2 justify-end">
                            {(c.status === "Pending Super Admin Approval" || c.status === "Pending") && (
                              <button 
                                onClick={() => { setOpen(c); setErrorMsg(null); }}
                                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-teal text-white hover:bg-teal-600 transition-colors"
                              >
                                Review
                              </button>
                            )}
                            <button 
                              onClick={() => { setOpen(c); setErrorMsg(null); }}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-warm hover:bg-sand/30 transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </AnimatedCard>
        )}

        <DetailDrawer open={!!open} onClose={() => setOpen(null)} title={open?.name}>
          {open && (
            <div className="space-y-6">
              <div className="relative">
                <img 
                  src={open.cover_url || open.cover || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800"} 
                  alt="" 
                  className="w-full h-40 object-cover rounded-xl shadow-inner border border-warm" 
                />
                <div className="absolute left-6 -bottom-8">
                  <img 
                    src={open.logo_url || open.logo || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=120"} 
                    className="w-20 h-20 rounded-2xl object-cover border-4 border-surface shadow-md" 
                    alt=""
                  />
                </div>
              </div>

              <div className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-ui font-bold text-xl text-foreground">{open.name}</h3>
                    <p className="text-xs text-warm-muted">
                      {open.village ? `${open.village}, ` : ""}{open.district}, {open.state}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusBadge status={open.status} />
                    <PlanBadge plan={open.plan} />
                  </div>
                </div>
              </div>

              <p className="text-sm text-warm-muted leading-relaxed bg-sand/35 p-3.5 rounded-xl border border-warm/40">
                {open.desc || "No description provided."}
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {["Members", "Type", "Est. Year", "Parent Community"].map(key => {
                  let val = "—";
                  if (key === "Members") val = (open.member_count ?? 0).toLocaleString();
                  if (key === "Type") val = open.type === "Super" ? "Super Community" : "Subsidiary";
                  if (key === "Est. Year") val = open.est_year || open.estYear || "N/A";
                  if (key === "Parent Community") val = open.parent_name || "None (Apex)";
                  return (
                    <div key={key} className="bg-sand/50 p-3 rounded-xl border border-warm/30">
                      <div className="text-warm-muted mb-0.5">{key}</div>
                      <div className="font-semibold text-sm">{val}</div>
                    </div>
                  );
                })}
              </div>

              {/* Submitted Registration Data */}
              <div className="border-t border-warm pt-4">
                <h4 className="font-ui font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  Submitted Registration Details
                </h4>
                <div className="bg-sand/35 p-4 rounded-xl border border-warm/40 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-warm-muted block">Caste / Sub-Caste</span>
                      <span className="font-semibold text-foreground">
                        {open.caste || "N/A"} {open.sub_caste ? `(${open.sub_caste})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Registration No.</span>
                      <span className="font-semibold text-foreground">{open.registration_no || open.registrationNo || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Email</span>
                      <span className="font-semibold text-foreground">{open.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Phone</span>
                      <span className="font-semibold text-foreground">{open.phone || "N/A"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-warm-muted block">Website</span>
                      {open.website ? (
                        <a href={open.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline truncate block">
                          {open.website}
                        </a>
                      ) : (
                        <span className="font-semibold text-foreground">N/A</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-warm/60 pt-2">
                    <span className="text-warm-muted block mb-1">Office Address</span>
                    <span className="font-semibold text-foreground block whitespace-pre-line">{open.office_address || open.officeAddress || "N/A"}</span>
                  </div>

                  <div className="border-t border-warm/60 pt-2">
                    <span className="text-warm-muted block mb-1">Vision & Mission</span>
                    <span className="font-semibold text-foreground block whitespace-pre-line">{open.vision_mission || open.visionMission || "N/A"}</span>
                  </div>

                  <div className="border-t border-warm/60 pt-2 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-warm-muted block">Facebook</span>
                      <span className="font-semibold text-foreground truncate block">{open.social_fb || open.socialFb || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Twitter</span>
                      <span className="font-semibold text-foreground truncate block">{open.social_tw || open.socialTw || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">YouTube</span>
                      <span className="font-semibold text-foreground truncate block">{open.social_yt || open.socialYt || "N/A"}</span>
                    </div>
                  </div>

                  {open.doc_name && (
                    <div className="border-t border-warm/60 pt-2">
                      <span className="text-warm-muted block mb-1">Verification Document Reference</span>
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> {open.doc_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Approval History / Audit Trail */}
              <div className="border-t border-warm pt-4">
                <h4 className="font-ui font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  Approval Workflow & Timeline
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-warm">
                  {open.approval_history && open.approval_history.length > 0 ? (
                    open.approval_history.map((hist: any, index: number) => (
                      <div key={index} className="relative text-xs">
                        <div className={`absolute -left-6 rounded-full w-4 h-4 border-2 bg-surface flex items-center justify-center ${
                          hist.status === "Approved" || hist.status === "Active"
                            ? "border-teal" 
                            : hist.status.startsWith("Rejected")
                            ? "border-red-500"
                            : "border-primary"
                        }`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            hist.status === "Approved" || hist.status === "Active"
                              ? "bg-teal"
                              : hist.status.startsWith("Rejected")
                              ? "bg-red-500"
                              : "bg-primary"
                          }`} />
                        </div>
                        <div className="flex justify-between font-semibold text-foreground">
                          <span>{hist.approval_level} Level</span>
                          <span className="text-[10px] text-warm-muted">
                            {new Date(hist.approved_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-warm-muted mt-0.5">
                          Status: <span className="font-medium">{hist.status}</span>
                          {hist.approved_by_username && ` by ${hist.approved_by_username}`}
                        </div>
                        {hist.remarks && (
                          <div className="bg-sand/30 p-2 rounded border border-warm/50 mt-1 text-[11px] text-warm-muted italic">
                            "{hist.remarks}"
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-warm-muted italic py-1">
                      No approval workflow timeline recorded yet.
                    </div>
                  )}
                </div>
              </div>

              {/* Action Panel */}
              {(open.status === "Pending Super Admin Approval" || open.status === "Pending") && (
                <div className="border-t border-warm pt-4 space-y-3.5">
                  <div>
                    <label className="text-xs font-semibold block mb-1.5 text-foreground">
                      Approval / Rejection Comments *
                    </label>
                    <textarea
                      rows={2.5}
                      placeholder="Add remarks or justification. Reason is mandatory for rejection."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-warm bg-surface focus:border-primary outline-none"
                    />
                  </div>

                  {errorMsg && (
                    <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3.5">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleApprove(open.id)}
                      className="py-2.5 rounded-xl bg-teal text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-teal/10 hover:bg-teal-600 transition-colors disabled:opacity-50"
                    >
                      <CheckCircle className="w-4.5 h-4.5" />
                      {actionLoading ? "Processing..." : "Approve"}
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleReject(open.id)}
                      className="py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/10 hover:bg-red-600 transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-4.5 h-4.5" />
                      {actionLoading ? "Processing..." : "Reject"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DetailDrawer>
      </PageWrap>
    );
  },
});
