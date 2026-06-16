import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { Plus, Check, Pencil, Trash2, Loader2, Search, Users, ShieldAlert, X, Save, ShieldCheck, Box } from "lucide-react";
import api from "@/lib/api";

const MODULE_PERMISSIONS: Record<string, string[]> = {
  "Members": ["View Members", "Add Members", "Edit Members", "Delete Members", "Approve Members"],
  "Committee": ["View Committee", "Add Committee Members", "Edit Committee Members", "Remove Committee Members"],
  "Families": ["View Families", "Add Families", "Edit Families", "Delete Families"],
  "Events": ["View Events", "Create Events", "Edit Events", "Delete Events"],
  "News": ["View News", "Create News", "Edit News", "Delete News"],
  "Gallery": ["View Gallery", "Upload Photos", "Edit Photos", "Delete Photos"],
  "Donations": ["View Donations", "Manage Donations"],
  "Jobs": ["View Jobs", "Create Jobs", "Edit Jobs", "Delete Jobs"],
  "Businesses": ["View Businesses", "Add Businesses", "Edit Businesses", "Delete Businesses"],
  "Matrimony": ["View Profiles", "Approve Profiles", "Manage Matches", "Manage Interests"],
  "Reports": ["View Reports", "Export Reports"],
  "Settings": ["Edit Community Profile", "Manage Logo", "Manage Banner", "Manage Community Information"],
  "Hierarchy": ["View Hierarchy", "Manage Subsidiaries"]
};

const ALL_PERMISSIONS = Object.values(MODULE_PERMISSIONS).flat();

function getActionWord(perm: string) {
  const lower = perm.toLowerCase();
  if (lower.startsWith("view")) return "View";
  if (lower.startsWith("add")) return "Add";
  if (lower.startsWith("edit")) return "Edit";
  if (lower.startsWith("delete")) return "Delete";
  if (lower.startsWith("create")) return "Create";
  if (lower.startsWith("approve")) return "Approve";
  if (lower.startsWith("remove")) return "Remove";
  if (lower.startsWith("upload")) return "Upload";
  if (lower.startsWith("export")) return "Export";
  if (lower.startsWith("manage")) {
    return "Manage " + perm.replace(/^Manage /i, "");
  }
  return perm;
}

function RoleEditor() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRole, setActiveRole] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [perms, setPerms] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await api.getRoles();
      setRoles(data || []);
      if (data && data.length > 0 && !activeRole && !isEditing) {
        handleSelectRole(data[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleSelectRole = (r: any) => {
    setActiveRole(r);
    setIsEditing(false);
    setName(r.name);
    setDesc(r.description || "");
    setPerms(Array.isArray(r.permissions) ? r.permissions : []);
    setSearch("");
  };

  const handleCreateNew = () => {
    setActiveRole(null);
    setIsEditing(true);
    setName("");
    setDesc("");
    setPerms([]);
    setSearch("");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = { name, description: desc, permissions: perms };
      if (activeRole?.id) {
        await api.updateRole(activeRole.id, payload);
      } else {
        await api.createRole(payload);
      }
      setIsEditing(false);
      await fetchRoles();
    } catch (e) {
      alert("Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeRole) return;
    if (!confirm(`Delete role "${activeRole.name}"?`)) return;
    try {
      await api.deleteRole(activeRole.id);
      setActiveRole(null);
      await fetchRoles();
    } catch (e) {
      alert("Error deleting role");
    }
  };

  const togglePerm = (p: string) => {
    if (!isEditing) return;
    setPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const toggleModule = (modPerms: string[]) => {
    if (!isEditing) return;
    const hasAll = modPerms.every(p => perms.includes(p));
    if (hasAll) {
      setPerms(prev => prev.filter(p => !modPerms.includes(p)));
    } else {
      setPerms(prev => Array.from(new Set([...prev, ...modPerms])));
    }
  };

  const filteredModules = useMemo(() => {
    if (!search.trim()) return MODULE_PERMISSIONS;
    const q = search.toLowerCase();
    const res: Record<string, string[]> = {};
    for (const [mod, modPerms] of Object.entries(MODULE_PERMISSIONS)) {
      if (mod.toLowerCase().includes(q)) {
        res[mod] = modPerms;
      } else {
        const matching = modPerms.filter(p => p.toLowerCase().includes(q));
        if (matching.length > 0) res[mod] = matching;
      }
    }
    return res;
  }, [search]);

  const totalModulesEnabled = Object.values(MODULE_PERMISSIONS).filter(mp => mp.some(p => perms.includes(p))).length;
  const accessLevel = perms.length === ALL_PERMISSIONS.length ? "Full Access" : perms.length > ALL_PERMISSIONS.length / 2 ? "High Access" : perms.length > 0 ? "Custom Access" : "No Access";

  return (
    <div className="flex gap-6 h-[calc(100vh-140px)] min-h-[650px] overflow-hidden mt-4">
      {/* 1. LEFT: Role List */}
      <div className="w-[280px] flex-shrink-0 flex flex-col bg-surface border border-warm rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-warm bg-sand/50 flex justify-between items-center">
          <h3 className="font-ui font-bold text-sm text-foreground flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /> Roles</h3>
          <button onClick={handleCreateNew} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition tooltip-trigger" title="Create New Role">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2 relative">
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : roles.map(r => {
            const count = Array.isArray(r.permissions) ? r.permissions.length : 0;
            const isActive = activeRole?.id === r.id && !isEditing;
            return (
              <button 
                key={r.id} 
                onClick={() => handleSelectRole(r)}
                className={`w-full text-left p-3 rounded-xl transition flex flex-col gap-1.5 ${isActive ? "bg-primary text-white shadow-md border-transparent" : "bg-surface hover:bg-sand border-warm border"}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-sm truncate pr-2">{r.name}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${isActive ? "bg-white/20 text-white" : "bg-warm/30 text-warm-muted"}`}>{count} Perms</span>
                </div>
                {r.description && <span className={`text-xs line-clamp-1 ${isActive ? "text-white/80" : "text-warm-muted"}`}>{r.description}</span>}
              </button>
            );
          })}
          {!loading && roles.length === 0 && (
            <div className="text-center p-6 text-warm-muted text-sm border border-dashed border-warm rounded-xl">No roles found.</div>
          )}
        </div>
      </div>

      {/* 2. CENTER: Role Details & Summary */}
      <div className="w-[340px] flex-shrink-0 flex flex-col bg-surface border border-warm rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-warm bg-gradient-to-br from-sand/50 to-surface">
          {isEditing ? (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-warm-muted uppercase tracking-wider mb-1 block">Role Name</label>
                <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Regional Manager" className="w-full px-3 py-2 bg-white border border-warm rounded-lg text-sm font-semibold text-foreground focus:outline-none focus:border-primary shadow-sm" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-warm-muted uppercase tracking-wider mb-1 block">Description</label>
                <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="What can this role do?" rows={3} className="w-full px-3 py-2 bg-white border border-warm rounded-lg text-sm text-foreground focus:outline-none focus:border-primary shadow-sm resize-none" />
              </div>
              <div className="flex gap-2 pt-2 border-t border-warm/50">
                <button onClick={() => activeRole ? handleSelectRole(activeRole) : handleCreateNew()} className="flex-1 py-2 rounded-xl border border-warm bg-white hover:bg-sand text-sm font-semibold text-warm-muted transition">Cancel</button>
                <button onClick={handleSave} disabled={!name.trim() || saving} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-2xl font-ui font-bold text-foreground">{name || "Create a Role"}</h2>
                <p className="text-sm text-warm-muted mt-1 leading-relaxed">{desc || "No description provided."}</p>
              </div>
              {activeRole && (
                <div className="flex gap-2 pt-2 border-t border-warm/50">
                  <button onClick={() => setIsEditing(true)} className="flex-1 py-2 rounded-xl border border-warm bg-white hover:bg-sand text-sm font-semibold text-foreground transition flex items-center justify-center gap-2"><Pencil className="w-4 h-4" /> Edit Role</button>
                  <button onClick={handleDelete} className="py-2 px-3 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-sm font-semibold text-red-600 transition flex items-center justify-center"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Summary Stats */}
        <div className="p-6 space-y-6 flex-1 overflow-y-auto bg-surface">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0"><ShieldAlert className="w-6 h-6" /></div>
            <div>
              <p className="text-[10px] font-bold text-warm-muted uppercase tracking-wider">Access Level</p>
              <p className="text-base font-bold text-foreground mt-0.5">{accessLevel}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-sand/50 border border-warm/50">
              <p className="text-[10px] font-bold text-warm-muted uppercase tracking-wider flex items-center gap-1.5"><Box className="w-3 h-3" /> Modules</p>
              <p className="text-2xl font-ui font-bold text-foreground mt-1">{totalModulesEnabled} <span className="text-sm font-medium text-warm-muted">/ {Object.keys(MODULE_PERMISSIONS).length}</span></p>
            </div>
            <div className="p-4 rounded-2xl bg-sand/50 border border-warm/50">
              <p className="text-[10px] font-bold text-warm-muted uppercase tracking-wider flex items-center gap-1.5"><ShieldCheck className="w-3 h-3" /> Perms</p>
              <p className="text-2xl font-ui font-bold text-foreground mt-1">{perms.length} <span className="text-sm font-medium text-warm-muted">/ {ALL_PERMISSIONS.length}</span></p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-sand/50 border border-warm/50">
            <p className="text-[10px] font-bold text-warm-muted uppercase tracking-wider flex items-center gap-1.5 mb-2"><Users className="w-3 h-3" /> Assigned Members</p>
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-surface bg-warm flex items-center justify-center text-[10px] font-bold text-warm-dark">N/A</div>
            </div>
            <p className="text-xs text-warm-muted mt-2">Member assignment is managed by Community Admins dynamically.</p>
          </div>
        </div>
      </div>

      {/* 3. RIGHT: Permission Management Grid */}
      <div className="flex-1 flex flex-col bg-surface border border-warm rounded-2xl overflow-hidden shadow-sm min-w-0">
        <div className="p-4 border-b border-warm bg-sand/50 flex justify-between items-center gap-4">
          <h3 className="font-ui font-bold text-sm text-foreground whitespace-nowrap">Permission Settings</h3>
          <div className="relative w-full max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-warm-muted" />
            <input 
              value={search} onChange={e => setSearch(e.target.value)} 
              placeholder="Search permissions..." 
              className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-warm rounded-full focus:outline-none focus:border-primary transition shadow-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 bg-surface/50">
          <div className="grid 2xl:grid-cols-2 gap-5 auto-rows-max">
            {Object.entries(filteredModules).map(([mod, modPerms]) => {
              const enabledCount = modPerms.filter(p => perms.includes(p)).length;
              const hasAll = enabledCount === modPerms.length && modPerms.length > 0;
              
              return (
                <div key={mod} className={`p-4 rounded-2xl border transition-all duration-200 ${enabledCount > 0 ? "border-primary/30 bg-primary/[0.02]" : "border-warm bg-white shadow-sm"}`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-foreground">{mod}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${enabledCount === modPerms.length ? "bg-primary text-white" : enabledCount > 0 ? "bg-primary/10 text-primary" : "bg-sand text-warm-muted"}`}>
                        {enabledCount}/{modPerms.length}
                      </span>
                    </div>
                    {isEditing && (
                      <button 
                        onClick={() => toggleModule(modPerms)}
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md transition ${hasAll ? "bg-primary text-white" : "bg-sand text-warm-muted hover:bg-warm/50"}`}
                      >
                        {hasAll ? "Deselect All" : "Select All"}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    {modPerms.map(p => {
                      const isChecked = perms.includes(p);
                      const actionWord = getActionWord(p);
                      
                      return (
                        <button
                          key={p}
                          onClick={() => togglePerm(p)}
                          disabled={!isEditing}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all select-none
                            ${isChecked 
                              ? 'bg-primary/10 border-primary/30 text-primary' 
                              : isEditing 
                                ? 'bg-surface border-warm text-warm-muted hover:border-warm-dark hover:bg-sand' 
                                : 'bg-sand/30 border-warm/50 text-warm-muted opacity-60 cursor-default'}`}
                        >
                          <span className={`w-3.5 h-3.5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${isChecked ? "bg-primary text-white" : "bg-transparent border border-warm"}`}>
                            {isChecked ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5 opacity-0" />}
                          </span>
                          {actionWord}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
            {Object.keys(filteredModules).length === 0 && (
              <div className="col-span-full text-center py-16 text-warm-muted text-sm border border-warm border-dashed rounded-2xl bg-sand/30">
                No permissions found matching "{search}"
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Body() {
  return (
    <PageWrap title="Roles & Permissions" desc="Enterprise Access Management">
      <RoleEditor />
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/roles")({ component: Body });


