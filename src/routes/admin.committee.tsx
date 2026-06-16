import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, Modal, DetailDrawer } from "@/components/wag/primitives";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/committee")({
  component: CommitteePage,
});

function CommitteePage() {
  const [committee, setCommittee] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("All");

  // Add/Edit State
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: "", designation: "", since: "", phone: "", email: "", community: "", photo_url: "" });
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [saving, setSaving] = useState(false);

  const [roles, setRoles] = useState<any[]>([]);

  const fetchCommittee = async () => {
    try {
      const data = await api.getCommittee();
      setCommittee(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommunities = async () => {
    try {
      const data = await api.getCommunities();
      setCommunities(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRoles = async () => {
    try {
      const data = await api.getRoles();
      setRoles(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchCommittee(), fetchCommunities(), fetchRoles()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      name: "",
      designation: "",
      role_id: "",
      since: new Date().toISOString().split("T")[0],
      phone: "",
      email: "",
      password: "",
      confirm_password: "",
      community: communities[0]?.id || "",
      photo_url: ""
    });
    setOpen(true);
  };

  const handleOpenEdit = (m: any) => {
    setEditingId(m.id);
    setForm({
      name: m.name || "",
      designation: m.designation || "",
      role_id: m.role_id || "",
      since: m.since || "",
      phone: m.phone || "",
      email: m.email || "",
      password: "",
      confirm_password: "",
      community: m.community || "",
      photo_url: m.photo_url || m.photo || ""
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.designation.trim() || !form.community || !form.email) {
      alert("Please fill all required fields (Name, Designation, Email, Community).");
      return;
    }
    if (!editingId && (!form.password || form.password !== form.confirm_password)) {
      alert("Please provide a matching password for the new member's login account.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.updateCommitteeMember(editingId, form);
      } else {
        await api.createCommitteeMember(form);
      }
      setOpen(false);
      await fetchCommittee();
    } catch (e: any) {
      alert(e.message || "Failed to save committee member");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Are you sure you want to remove this committee member and their login access?")) return;
    try {
      await api.deleteCommitteeMember(id);
      await fetchCommittee();
    } catch (e: any) {
      alert(e.message || "Failed to delete");
    }
  };

  const filteredCommittee = committee.filter(m => {
    const matchesSearch = 
      (m.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (m.designation || "").toLowerCase().includes(search.toLowerCase());
    const matchesCommunity = selectedCommunity === "All" || m.community?.toString() === selectedCommunity.toString();
    return matchesSearch && matchesCommunity;
  });

  return (
    <PageWrap 
      title="Platform Committee" 
      desc="Manage central and community committee members"
      action={
        <button 
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 hover:bg-primary/95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Committee Member
        </button>
      }
    >
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" />
          <input 
            placeholder="Search by name, role…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary transition text-sm" 
          />
        </div>
        <select 
          value={selectedCommunity} 
          onChange={(e) => setSelectedCommunity(e.target.value)}
          className="px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none"
        >
          <option value="All">All communities</option>
          {communities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <AnimatedCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs font-bold uppercase tracking-wider text-warm-muted">
                <tr>
                  {["Member", "Community", "Designation", "Since", "Contact", "Actions"].map(h => (
                    <th key={h} className="text-left p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm">
                {filteredCommittee.map(m => {
                  const comm = communities.find(c => c.id === m.community);
                  return (
                    <tr key={m.id} className="hover:bg-sand/30 transition cursor-pointer" onClick={() => setSelectedMember(m)}>
                      <td className="p-4 flex items-center gap-3">
                        <AvatarCircle name={m.name} src={m.photo || m.photo_url} size={36} />
                        <span className="font-semibold text-foreground">{m.name}</span>
                      </td>
                      <td className="p-4 text-xs font-medium text-warm-muted">{comm?.name || "Platform Central"}</td>
                      <td className="p-4">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-gold-light text-gold font-bold uppercase tracking-wider border border-gold/15">
                          {m.designation}
                        </span>
                      </td>
                      <td className="p-4 text-xs text-warm-muted">{m.since ? new Date(m.since).toLocaleDateString() : 'N/A'}</td>
                      <td className="p-4 text-xs">
                        <div className="font-medium">{m.phone || 'N/A'}</div>
                        <div className="text-warm-muted">{m.email}</div>
                      </td>
                      <td className="p-4 text-xs font-semibold">
                        <div className="flex gap-2.5">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(m); }} className="text-primary hover:underline flex items-center gap-1">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }} className="text-red-500 hover:underline flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredCommittee.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-warm-muted">No committee members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}

      {/* Add / Edit Committee Member Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Edit Committee Member" : "Add Committee Member"}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Full Name *</label>
              <input 
                value={form.name || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, name: e.target.value }))} 
                placeholder="e.g. Arvindbhai Ahir" 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Role / Designation *</label>
              <select 
                value={form.role_id || ""} 
                onChange={e => {
                  const sel = roles.find(r => r.id.toString() === e.target.value);
                  setForm((prev: any) => ({ ...prev, role_id: e.target.value, designation: sel ? sel.name : "" }));
                }} 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
              >
                <option value="">Select a Role</option>
                {roles.filter(r => r.active).map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Phone Number</label>
              <input 
                value={form.phone || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, phone: e.target.value }))} 
                placeholder="e.g. 9876543210" 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Email ID *</label>
              <input 
                value={form.email || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, email: e.target.value }))} 
                placeholder="e.g. member@samaj.org" 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
              />
            </div>
          </div>

          {!editingId && (
            <div className="grid grid-cols-2 gap-3 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
              <div className="col-span-2">
                <p className="text-xs text-amber-800 font-semibold mb-2">Login Account Credentials</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Password *</label>
                <input 
                  type="password"
                  value={form.password || ""} 
                  onChange={e => setForm((prev: any) => ({ ...prev, password: e.target.value }))} 
                  placeholder="••••••••" 
                  className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Confirm Password *</label>
                <input 
                  type="password"
                  value={form.confirm_password || ""} 
                  onChange={e => setForm((prev: any) => ({ ...prev, confirm_password: e.target.value }))} 
                  placeholder="••••••••" 
                  className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Term Start Date (Since)</label>
              <input 
                type="date"
                value={form.since || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, since: e.target.value }))} 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Community Association *</label>
              <select 
                value={form.community || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, community: e.target.value }))} 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
              >
                <option value="">Select Community</option>
                {communities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-muted mb-1">Photo URL (Optional)</label>
            <input 
              value={form.photo_url || ""} 
              onChange={e => setForm((prev: any) => ({ ...prev, photo_url: e.target.value }))} 
              placeholder="https://images.unsplash.com/..." 
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-warm text-sm font-semibold hover:bg-sand transition">
              Cancel
            </button>
            <button 
              type="button" 
              disabled={saving}
              onClick={handleSave} 
              className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Member
            </button>
          </div>
        </div>
      </Modal>

      {/* Committee Member Details Drawer */}
      <DetailDrawer open={!!selectedMember} onClose={() => setSelectedMember(null)} title="Committee Member Details">
        {selectedMember && (
          <div className="space-y-6">
            <div className="text-center relative">
              <AvatarCircle name={selectedMember.name} src={selectedMember.photo || selectedMember.photo_url} size={90} />
              <h2 className="font-ui font-bold text-lg mt-3">{selectedMember.name}</h2>
              <div className="mt-1 flex items-center justify-center gap-2">
                <span className="text-xs px-2.5 py-1 rounded-full bg-gold-light text-gold font-bold uppercase tracking-wider border border-gold/15">
                  {selectedMember.designation}
                </span>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="flex gap-2 p-3 bg-sand/30 rounded-xl border border-warm/80">
              <button onClick={(e) => { e.stopPropagation(); setSelectedMember(null); handleOpenEdit(selectedMember); }} className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-bold flex items-center justify-center gap-1">
                <Edit className="w-3.5 h-3.5" /> Edit Member
              </button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedMember(null); handleDelete(selectedMember.id); }} className="flex-1 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold flex items-center justify-center gap-1">
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            </div>

            {/* Personal Details */}
            <div>
              <h3 className="text-xs font-bold text-warm-muted uppercase tracking-wider mb-2">Member Information</h3>
              <div className="space-y-2 text-sm p-4 rounded-xl bg-surface border border-warm">
                {[
                  ["Community", communities.find(c => c.id === selectedMember.community)?.name || "Platform Central"],
                  ["Email", selectedMember.email],
                  ["Phone", selectedMember.phone],
                  ["Since", selectedMember.since ? new Date(selectedMember.since).toLocaleDateString() : "N/A"]
                ].map(([k, v]) => (
                  <div key={k as string} className="flex justify-between border-b border-warm/50 last:border-0 pb-1.5 last:pb-0">
                    <span className="text-warm-muted">{k as string}</span>
                    <span className="font-medium text-right max-w-[65%] truncate">{v as string || "N/A"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </PageWrap>
  );
}
