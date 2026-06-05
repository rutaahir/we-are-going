import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Users, UserCheck, Calendar, HandHeart, UsersRound, Building2, CheckCircle, XCircle, AlertCircle, FileText } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from "recharts";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, StatCard, StatusBadge, DetailDrawer, PlanBadge } from "@/components/wag/primitives";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { MEMBERS, NEWS } from "@/data/mock";

const growth = [{ m: "Jan", v: 920 }, { m: "Feb", v: 980 }, { m: "Mar", v: 1040 }, { m: "Apr", v: 1110 }, { m: "May", v: 1180 }, { m: "Jun", v: 1240 }];
const donations = [{ m: "Jan", v: 124000 }, { m: "Feb", v: 86000 }, { m: "Mar", v: 192000 }, { m: "Apr", v: 154000 }, { m: "May", v: 218000 }, { m: "Jun", v: 247000 }];
const tooltip = { contentStyle: { background: "#FFFDF7", border: "1px solid #E2D9CC", borderRadius: 12, fontSize: 12 } };

export const Route = createFileRoute("/community-admin/")({
  component: () => {
    const { user } = useAuth();
    const [communities, setCommunities] = useState<any[]>([]);
    const [subsidiaries, setSubsidiaries] = useState<any[]>([]);
    const [selectedSub, setSelectedSub] = useState<any | null>(null);
    const [remarks, setRemarks] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchCommunities = () => {
      if (!user || !user.communityId) return;
      api.getCommunities()
        .then(res => {
          setCommunities(res || []);
          // Filter subsidiaries where parent matches user.communityId and status is Pending Parent Community Approval
          const subs = (res || []).filter((c: any) => 
            String(c.parent) === String(user.communityId) && 
            c.status === "Pending Parent Community Approval"
          );
          setSubsidiaries(subs);
        })
        .catch(err => console.error("Failed to load communities", err));
    };

    useEffect(() => {
      fetchCommunities();
    }, [user]);

    const handleApproveSub = async (id: string) => {
      setErrorMsg(null);
      setActionLoading(true);
      try {
        await api.approveCommunity(id, remarks || "Approved by Parent Community Admin.");
        setRemarks("");
        setSelectedSub(null);
        fetchCommunities();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to approve subsidiary.");
      } finally {
        setActionLoading(false);
      }
    };

    const handleRejectSub = async (id: string) => {
      setErrorMsg(null);
      if (!remarks.trim()) {
        setErrorMsg("Rejection reason is mandatory.");
        return;
      }
      setActionLoading(true);
      try {
        await api.rejectCommunity(id, remarks);
        setRemarks("");
        setSelectedSub(null);
        fetchCommunities();
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to reject subsidiary.");
      } finally {
        setActionLoading(false);
      }
    };

    return (
      <PageWrap title="Samaj Overview" desc={`${user?.communityName || "Rampara Ahir Samaj"} · Admin Panel`}>
        {/* Pending Subsidiaries Widget (Visible only to Parent Community Admins when pending exists) */}
        {user?.role === "community_admin" && subsidiaries.length > 0 && (
          <div className="mb-8">
            <AnimatedCard className="overflow-hidden border border-amber-200 bg-amber-50/10">
              <div className="p-5 border-b border-amber-200 bg-amber-50/30 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-ui font-bold text-base text-amber-900 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-amber-600" />
                    Pending Subsidiary Registrations
                  </h3>
                  <p className="text-xs text-amber-700/80 mt-0.5">
                    As Parent Community Admin, you must review and approve/reject these registrations.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-850 animate-pulse border border-amber-200">
                  {subsidiaries.length} Pending Approval
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-sand/35 text-left text-xs text-warm-muted uppercase">
                    <tr>
                      <th className="p-3">Community Info</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subsidiaries.map(sub => (
                      <tr key={sub.id} className="border-t border-warm hover:bg-sand/15 transition-colors">
                        <td className="p-3 flex items-center gap-3">
                          <img 
                            src={sub.logo_url || sub.logo || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=120"} 
                            className="w-10 h-10 rounded-xl object-cover border border-warm shadow-sm"
                            alt=""
                          />
                          <div>
                            <div className="font-semibold text-foreground">{sub.name}</div>
                            <div className="text-xs text-warm-muted">Admin: {sub.admin_name || sub.email}</div>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-warm-muted">
                          {sub.village ? `${sub.village}, ` : ""}{sub.district}, {sub.state}
                        </td>
                        <td className="p-3">
                          <PlanBadge plan={sub.plan} />
                        </td>
                        <td className="p-3 text-right">
                          <button 
                            onClick={() => { setSelectedSub(sub); setErrorMsg(null); setRemarks(""); }}
                            className="px-3 py-1.5 rounded-lg bg-teal text-white text-xs font-semibold hover:bg-teal-650 transition-colors"
                          >
                            Review Request
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AnimatedCard>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard icon={<Users />} label="Total Members" value={1240} accent="primary" />
          <StatCard icon={<UserCheck />} label="Pending Approvals" value={18} accent="gold" />
          <StatCard icon={<Calendar />} label="Active Events" value={6} accent="teal" />
          <StatCard icon={<HandHeart />} label="Donations (₹)" value={1840000} accent="primary" />
          <StatCard icon={<UsersRound />} label="Families" value={342} accent="gold" />
          <StatCard icon={<Building2 />} label="Businesses" value={48} accent="teal" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-6">
          <AnimatedCard className="p-5">
            <h3 className="font-ui font-semibold mb-3">Member growth (6 months)</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <LineChart data={growth}>
                  <CartesianGrid stroke="#E2D9CC" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#6B5E4E" fontSize={11} />
                  <YAxis stroke="#6B5E4E" fontSize={11} />
                  <Tooltip {...tooltip} />
                  <Line type="monotone" dataKey="v" stroke="oklch(0.46 0.21 265)" strokeWidth={2.5} dot={{ fill: "oklch(0.46 0.21 265)", r: 4 }} isAnimationActive />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>
          <AnimatedCard className="p-5">
            <h3 className="font-ui font-semibold mb-3">Monthly donations</h3>
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={donations}>
                  <CartesianGrid stroke="#E2D9CC" strokeDasharray="3 3" />
                  <XAxis dataKey="m" stroke="#6B5E4E" fontSize={11} />
                  <YAxis stroke="#6B5E4E" fontSize={11} />
                  <Tooltip {...tooltip} />
                  <Bar dataKey="v" fill="oklch(0.68 0.14 75)" radius={[8,8,0,0]} isAnimationActive />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </AnimatedCard>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <AnimatedCard className="overflow-hidden">
              <div className="p-5 border-b border-warm">
                <h3 className="font-ui font-semibold">Pending Member Approvals</h3>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {MEMBERS.filter(m => m.status === "Pending").slice(0, 6).map(m => (
                    <tr key={m.id} className="border-t border-warm">
                      <td className="p-3 flex items-center gap-2">
                        <AvatarCircle name={m.name} src={m.avatar} size={32} />
                        <div>
                          <div className="font-medium">{m.name}</div>
                          <div className="text-xs text-warm-muted">{m.phone}</div>
                        </div>
                      </td>
                      <td className="p-3 text-xs">{m.joinedDate}</td>
                      <td className="p-3 text-right">
                        <button className="px-2 py-1 rounded bg-teal text-white text-xs mr-1"><CheckCircle className="w-3 h-3 inline" /></button>
                        <button className="px-2 py-1 rounded bg-red-500 text-white text-xs mr-1"><XCircle className="w-3 h-3 inline" /></button>
                        <button className="px-2 py-1 rounded bg-amber-500 text-white text-xs"><AlertCircle className="w-3 h-3 inline" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </AnimatedCard>
          </div>
          <AnimatedCard className="p-5">
            <h3 className="font-ui font-semibold mb-3">Recent activity</h3>
            <div className="space-y-3 text-sm">
              {NEWS.slice(0,5).map(n => (
                <div key={n.id} className="flex gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <div className="font-medium line-clamp-1">{n.title}</div>
                    <div className="text-xs text-warm-muted">{n.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedCard>
        </div>

        {/* Detailed Drawer for Subsidiary Approval review */}
        <DetailDrawer open={!!selectedSub} onClose={() => setSelectedSub(null)} title={selectedSub?.name}>
          {selectedSub && (
            <div className="space-y-6">
              <div className="relative">
                <img 
                  src={selectedSub.cover_url || selectedSub.cover || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800"} 
                  alt="" 
                  className="w-full h-40 object-cover rounded-xl border border-warm" 
                />
                <div className="absolute left-6 -bottom-8">
                  <img 
                    src={selectedSub.logo_url || selectedSub.logo || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=120"} 
                    className="w-16 h-16 rounded-2xl object-cover border-4 border-surface shadow-md" 
                    alt=""
                  />
                </div>
              </div>

              <div className="pt-6">
                <h3 className="font-ui font-bold text-lg text-foreground">{selectedSub.name}</h3>
                <p className="text-xs text-warm-muted mt-0.5">
                  {selectedSub.village ? `${selectedSub.village}, ` : ""}{selectedSub.district}, {selectedSub.state}
                </p>
              </div>

              <p className="text-sm text-warm-muted leading-relaxed bg-sand/35 p-3 rounded-xl border border-warm/40">
                {selectedSub.desc || "No description provided."}
              </p>

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
                        {selectedSub.caste || "N/A"} {selectedSub.sub_caste ? `(${selectedSub.sub_caste})` : ""}
                      </span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Est. Year</span>
                      <span className="font-semibold text-foreground">{selectedSub.est_year || selectedSub.estYear || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Registration No.</span>
                      <span className="font-semibold text-foreground">{selectedSub.registration_no || selectedSub.registrationNo || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Email</span>
                      <span className="font-semibold text-foreground">{selectedSub.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Phone</span>
                      <span className="font-semibold text-foreground">{selectedSub.phone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Website</span>
                      {selectedSub.website ? (
                        <a href={selectedSub.website} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline truncate block">
                          {selectedSub.website}
                        </a>
                      ) : (
                        <span className="font-semibold text-foreground">N/A</span>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-warm/60 pt-2">
                    <span className="text-warm-muted block mb-1">Office Address</span>
                    <span className="font-semibold text-foreground block whitespace-pre-line">{selectedSub.office_address || selectedSub.officeAddress || "N/A"}</span>
                  </div>

                  <div className="border-t border-warm/60 pt-2">
                    <span className="text-warm-muted block mb-1">Vision & Mission</span>
                    <span className="font-semibold text-foreground block whitespace-pre-line">{selectedSub.vision_mission || selectedSub.visionMission || "N/A"}</span>
                  </div>

                  <div className="border-t border-warm/60 pt-2 grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-warm-muted block">Facebook</span>
                      <span className="font-semibold text-foreground truncate block">{selectedSub.social_fb || selectedSub.socialFb || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">Twitter</span>
                      <span className="font-semibold text-foreground truncate block">{selectedSub.social_tw || selectedSub.socialTw || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-warm-muted block">YouTube</span>
                      <span className="font-semibold text-foreground truncate block">{selectedSub.social_yt || selectedSub.socialYt || "N/A"}</span>
                    </div>
                  </div>

                  {selectedSub.doc_name && (
                    <div className="border-t border-warm/60 pt-2">
                      <span className="text-warm-muted block mb-1">Verification Document Reference</span>
                      <span className="font-semibold text-primary flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> {selectedSub.doc_name}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="border-t border-warm pt-4">
                <h4 className="font-ui font-bold text-sm text-foreground mb-3 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />
                  Approval Workflow & Timeline
                </h4>
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-warm">
                  {selectedSub.approval_history && selectedSub.approval_history.length > 0 ? (
                    selectedSub.approval_history.map((hist: any, index: number) => (
                      <div key={index} className="relative text-xs">
                        <div className="absolute -left-6 rounded-full w-4 h-4 border-2 bg-surface flex items-center justify-center border-primary">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
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

              <div className="border-t border-warm pt-4 space-y-3.5">
                <div>
                  <label className="text-xs font-semibold block mb-1.5 text-foreground">
                    Remarks / Comments *
                  </label>
                  <textarea
                    rows={2.5}
                    placeholder="Provide justification or remarks. Mandatory for rejection."
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
                    onClick={() => handleApproveSub(selectedSub.id)}
                    className="py-2.5 rounded-xl bg-teal text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-teal-600 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {actionLoading ? "Processing..." : "Approve"}
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={() => handleRejectSub(selectedSub.id)}
                    className="py-2.5 rounded-xl bg-red-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-red-600 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading ? "Processing..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </DetailDrawer>
      </PageWrap>
    );
  },
});
