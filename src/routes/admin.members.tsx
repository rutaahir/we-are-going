import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Edit, Ban, CheckCircle, Loader2, XCircle, ShieldAlert } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, StatusBadge, DetailDrawer, Modal } from "@/components/wag/primitives";
import { api } from "@/lib/api";
import { calculateAge } from "@/lib/utils";

export const Route = createFileRoute("/admin/members")({
  component: MembersPage,
});

function MembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  
  // Edit Form State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [editTab, setEditTab] = useState("basic");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchMembers = async () => {
    try {
      const data = await api.getMembers();
      setMembers(data || []);
      // Keep selected member reference updated
      if (selectedMember) {
        const updatedSelected = data.find((m: any) => m.id === selectedMember.id);
        if (updatedSelected) {
          setSelectedMember(updatedSelected);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);



  const [birthdateError, setBirthdateError] = useState("");

  const handleBirthdateChange = (val: string) => {
    if (!val) {
      setBirthdateError("");
      setEditForm((prev: any) => ({
        ...prev,
        birthdate: "",
        age: ""
      }));
      return;
    }

    const birthDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) {
      setBirthdateError("Birthdate cannot be in the future.");
      setEditForm((prev: any) => ({
        ...prev,
        birthdate: val,
        age: ""
      }));
    } else {
      setBirthdateError("");
      const calculatedAge = calculateAge(val);
      setEditForm((prev: any) => ({
        ...prev,
        birthdate: val,
        age: calculatedAge
      }));
    }
  };

  const openEditModal = (member: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const initialBirthdate = member.birthdate || "";
    let initialAge = "";
    let initialError = "";

    if (initialBirthdate) {
      const birthDate = new Date(initialBirthdate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        initialError = "Birthdate cannot be in the future.";
      } else {
        initialAge = member.age ? member.age : calculateAge(initialBirthdate);
      }
    }

    setBirthdateError(initialError);
    setEditForm({ 
      ...member,
      birthdate: initialBirthdate,
      age: initialAge
    });
    setEditTab("basic");
    setIsEditOpen(true);
  };

  const handleSaveMember = async () => {
    if (editForm.birthdate) {
      const birthDate = new Date(editForm.birthdate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        return alert("Birthdate cannot be in the future.");
      }
    }

    setActionLoading(true);
    try {
      const updated = await api.updateMember(editForm.id, editForm);
      setIsEditOpen(false);
      await fetchMembers();
    } catch (e) {
      console.error("Failed to update member", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleSuspend = async (member: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = member.status === "Suspended" ? "Active" : "Suspended";
    
    setActionLoading(true);
    try {
      await api.updateMemberStatus(member.id, nextStatus);
      await fetchMembers();
    } catch (e) {
      console.error("Failed to update status", e);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (m.phone || "").includes(search)
  );

  return (
    <PageWrap title="Platform Members" desc={`${members.length} members registered on the platform`}>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" />
          <input 
            placeholder="Search by name, phone…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary transition text-sm" 
          />
        </div>
        <select className="px-3 py-2.5 rounded-xl border border-warm bg-surface text-sm focus:outline-none">
          <option>All states</option>
        </select>
        <select className="px-3 py-2.5 rounded-xl border border-warm bg-surface text-sm focus:outline-none">
          <option>All communities</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="md:hidden space-y-4">
            {filteredMembers.map(m => (
              <AnimatedCard key={m.id} className="p-4">
                <div onClick={() => setSelectedMember(m)} className="cursor-pointer space-y-3">
                  <div className="flex items-center justify-between">
                    <StatusBadge status={m.status || "Active"} />
                    <span className="text-[10px] text-warm-muted">{m.joined_date ? new Date(m.joined_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AvatarCircle name={m.name} src={m.avatar || m.avatar_url} size={48} />
                    <div>
                      <div className="font-semibold text-foreground">{m.name}</div>
                      <div className="text-xs text-warm-muted">{m.phone}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-warm-muted block text-[10px] uppercase">Community</span>
                      {m.community_name || 'N/A'}
                    </div>
                    <div>
                      <span className="text-warm-muted block text-[10px] uppercase">Profession</span>
                      {m.profession || m.profession_type || 'N/A'}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 border-t border-warm pt-3 mt-3">
                  <button onClick={(e) => openEditModal(m, e)} className="flex-1 py-1.5 flex justify-center items-center gap-1.5 rounded bg-sand text-xs font-semibold hover:bg-warm transition text-foreground">
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={(e) => handleToggleSuspend(m, e)} className={`flex-1 py-1.5 flex justify-center items-center gap-1.5 rounded text-xs font-semibold transition ${m.status === "Suspended" ? "bg-teal/10 text-teal hover:bg-teal/20" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                    <Ban className="w-3.5 h-3.5" /> {m.status === "Suspended" ? "Activate" : "Suspend"}
                  </button>
                </div>
              </AnimatedCard>
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block overflow-x-auto">
            <AnimatedCard className="overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-sand">
                  <tr>
                    {["Member","Community","Profession","Status","Joined","Actions"].map(h => 
                      <th key={h} className="text-left p-4 text-xs font-bold uppercase tracking-wider text-warm-muted">{h}</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm">
                  {filteredMembers.map(m => (
                    <tr key={m.id} className="hover:bg-sand/50 transition cursor-pointer" onClick={() => setSelectedMember(m)}>
                      <td className="p-4 flex items-center gap-3">
                        <AvatarCircle name={m.name} src={m.avatar || m.avatar_url} size={36} />
                        <div>
                          <div className="font-semibold text-foreground">{m.name}</div>
                          <div className="text-xs text-warm-muted">{m.phone}</div>
                        </div>
                      </td>
                      <td className="p-4 text-xs font-medium text-warm-muted">{m.community_name || 'N/A'}</td>
                      <td className="p-4 text-xs text-warm-muted">{m.profession || m.profession_type || 'N/A'}</td>
                      <td className="p-4"><StatusBadge status={m.status || "Active"} /></td>
                      <td className="p-4 text-xs text-warm-muted">{m.joined_date ? new Date(m.joined_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4 space-x-3 text-xs font-semibold">
                        <button onClick={(e) => openEditModal(m, e)} className="text-primary hover:underline">Edit</button>
                        <button onClick={(e) => handleToggleSuspend(m, e)} className="text-red-500 hover:underline">
                          {m.status === "Suspended" ? "Activate" : "Suspend"}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-warm-muted">No members found matching your search.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </AnimatedCard>
          </div>
        </>
      )}

      {/* Member Details Drawer */}
      <DetailDrawer open={!!selectedMember} onClose={() => setSelectedMember(null)} title="Member Details">
        {selectedMember && (
          <div className="space-y-6">
            <div className="text-center relative">
              <AvatarCircle name={selectedMember.name} src={selectedMember.avatar || selectedMember.avatar_url} size={90} />
              <h2 className="font-ui font-bold text-lg mt-3">{selectedMember.name}</h2>
              <div className="mt-1 flex items-center justify-center gap-2">
                <StatusBadge status={selectedMember.status} />
                <span className="text-[10px] text-warm-muted">Joined {selectedMember.joined_date ? new Date(selectedMember.joined_date).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex gap-2 p-3 bg-sand/30 rounded-xl border border-warm/80">
              <button onClick={(e) => { setSelectedMember(null); openEditModal(selectedMember); }} className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center gap-1">
                <Edit className="w-3.5 h-3.5" /> Edit Profile
              </button>
              <button onClick={(e) => handleToggleSuspend(selectedMember)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition ${selectedMember.status === "Suspended" ? "bg-teal text-white" : "bg-red-500 text-white"}`}>
                <Ban className="w-3.5 h-3.5" /> {selectedMember.status === "Suspended" ? "Activate" : "Suspend"}
              </button>
            </div>

            {/* Personal Details */}
            <div>
              <h3 className="text-xs font-bold text-warm-muted uppercase tracking-wider mb-2">Personal Information</h3>
              <div className="space-y-2 text-sm p-4 rounded-xl bg-surface border border-warm">
                {[
                  ["Email", selectedMember.email],
                  ["Phone", selectedMember.phone],
                  ["Gender", selectedMember.gender],
                  ["Birthdate", selectedMember.birthdate ? new Date(selectedMember.birthdate).toLocaleDateString("en-IN") : "N/A"],
                  ["Age", selectedMember.age || calculateAge(selectedMember.birthdate) || "N/A"],
                  ["Aadhaar Status", selectedMember.aadhaar_status],
                  ["Address", `${selectedMember.village || ""}, ${selectedMember.taluka || ""}, ${selectedMember.district || ""}, ${selectedMember.state || ""}`]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-warm/50 last:border-0 pb-1.5 last:pb-0">
                    <span className="text-warm-muted">{k}</span>
                    <span className="font-medium text-right max-w-[65%] truncate">{v || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Details */}
            <div>
              <h3 className="text-xs font-bold text-warm-muted uppercase tracking-wider mb-2">Education Details</h3>
              <div className="space-y-2 text-sm p-4 rounded-xl bg-surface border border-warm">
                {[
                  ["Highest Education", selectedMember.education],
                  ["Degree", selectedMember.degree],
                  ["Field of Study", selectedMember.field_of_study],
                  ["School / Institute", selectedMember.school],
                  ["College / University", selectedMember.college],
                  ["Passing Year", selectedMember.passing_year]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-warm/50 last:border-0 pb-1.5 last:pb-0">
                    <span className="text-warm-muted">{k}</span>
                    <span className="font-medium text-right max-w-[65%] truncate">{v || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Profession & Work Details */}
            <div>
              <h3 className="text-xs font-bold text-warm-muted uppercase tracking-wider mb-2">Profession Details</h3>
              <div className="space-y-2 text-sm p-4 rounded-xl bg-surface border border-warm">
                {[
                  ["Profession Category", selectedMember.profession_type || selectedMember.profession],
                  ["Specific Role / Job", selectedMember.profession],
                  ["Job Title", selectedMember.job_title],
                  ["Company Name", selectedMember.company],
                  ["Industry Type", selectedMember.industry],
                  ["Monthly Salary / Income", selectedMember.salary],
                  ["Business Name", selectedMember.business_name],
                  ["Business Category", selectedMember.business_category],
                  ["GST Number", selectedMember.gst_no],
                  ["Years in Business", selectedMember.business_years]
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-warm/50 last:border-0 pb-1.5 last:pb-0">
                    <span className="text-warm-muted">{k}</span>
                    <span className="font-medium text-right max-w-[65%] truncate">{v || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Edit Member Modal */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Edit Member Profile">
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
          {/* Tab Navigation */}
          <div className="flex border-b border-warm sticky top-0 bg-surface z-10">
            {["basic", "education", "profession"].map(tab => (
              <button 
                key={tab} 
                onClick={() => setEditTab(tab)} 
                className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 text-center capitalize ${editTab === tab ? "border-primary text-primary" : "border-transparent text-warm-muted"}`}
              >
                {tab}
              </button>
            ))}
          </div>

          {editTab === "basic" && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Full Name</label>
                <input value={editForm.name || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Phone Number</label>
                  <input value={editForm.phone || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, phone: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Email ID</label>
                  <input value={editForm.email || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, email: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Birthdate</label>
                  <input type="date" value={editForm.birthdate || ""} onChange={e => handleBirthdateChange(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                  {birthdateError && (
                    <p className="text-red-500 text-[10px] font-semibold mt-1">{birthdateError}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Age (Autofilled)</label>
                  <input type="number" readOnly value={editForm.age ?? ""} className="w-full px-3 py-2 rounded-lg border border-warm bg-sand text-sm font-medium focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Gender</label>
                  <select value={editForm.gender || "Male"} onChange={e => setEditForm((prev: any) => ({ ...prev, gender: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm">
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Status</label>
                  <select value={editForm.status || "Pending"} onChange={e => setEditForm((prev: any) => ({ ...prev, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm">
                    <option value="Pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Verified">Verified</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Village</label>
                  <input value={editForm.village || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, village: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Taluka</label>
                  <input value={editForm.taluka || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, taluka: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">District</label>
                  <input value={editForm.district || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, district: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">State</label>
                  <input value={editForm.state || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, state: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                </div>
              </div>
            </div>
          )}

          {editTab === "education" && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Highest Education</label>
                <input value={editForm.education || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, education: e.target.value }))} placeholder="e.g. Graduate" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Degree Name</label>
                  <input value={editForm.degree || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, degree: e.target.value }))} placeholder="e.g. B.Tech" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Field of Study</label>
                  <input value={editForm.field_of_study || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, field_of_study: e.target.value }))} placeholder="e.g. Computer Science" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">School / Institute</label>
                <input value={editForm.school || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, school: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">College / University</label>
                <input value={editForm.college || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, college: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Passing Year</label>
                <input value={editForm.passing_year || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, passing_year: e.target.value }))} placeholder="e.g. 2024" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
              </div>
            </div>
          )}

          {editTab === "profession" && (
            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Profession Type</label>
                <select value={editForm.profession_type || "Job"} onChange={e => setEditForm((prev: any) => ({ ...prev, profession_type: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm">
                  <option value="Job">Job / Employed</option>
                  <option value="Business">Business / Self-Employed</option>
                  <option value="Student">Student</option>
                  <option value="Homemaker">Homemaker</option>
                  <option value="Unemployed">Unemployed</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              {editForm.profession_type !== "Business" ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-warm-muted mb-1">Specific Profession / Role</label>
                      <input value={editForm.profession || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, profession: e.target.value }))} placeholder="e.g. Software Engineer" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-muted mb-1">Job Title</label>
                      <input value={editForm.job_title || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, job_title: e.target.value }))} placeholder="e.g. Senior Associate" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-warm-muted mb-1">Company Name</label>
                      <input value={editForm.company || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, company: e.target.value }))} placeholder="e.g. Google" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-muted mb-1">Industry Type</label>
                      <input value={editForm.industry || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, industry: e.target.value }))} placeholder="e.g. Information Technology" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-warm-muted mb-1">Monthly Salary / Income</label>
                    <input value={editForm.salary || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, salary: e.target.value }))} placeholder="e.g. ₹50,000" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-warm-muted mb-1">Business Name</label>
                      <input value={editForm.business_name || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, business_name: e.target.value }))} placeholder="e.g. Rajula Enterprises" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-muted mb-1">Business Category</label>
                      <input value={editForm.business_category || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, business_category: e.target.value }))} placeholder="e.g. Retail" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-warm-muted mb-1">GST Number</label>
                      <input value={editForm.gst_no || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, gst_no: e.target.value }))} placeholder="24AAAAA1111A1Z1" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-warm-muted mb-1">Years in Business</label>
                      <input value={editForm.business_years || ""} onChange={e => setEditForm((prev: any) => ({ ...prev, business_years: e.target.value }))} placeholder="e.g. 5" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-warm sticky bottom-0 bg-surface">
            <button type="button" onClick={() => setIsEditOpen(false)} className="flex-1 py-2.5 rounded-xl border border-warm text-sm font-semibold hover:bg-sand transition">
              Cancel
            </button>
            <button 
              type="button" 
              disabled={actionLoading}
              onClick={handleSaveMember} 
              className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>
    </PageWrap>
  );
}
