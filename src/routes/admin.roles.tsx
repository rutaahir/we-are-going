import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, Modal, StatusBadge } from "@/components/wag/primitives";
import { ShieldCheck, Plus, Check, Pencil, Trash2 } from "lucide-react";

const PERMISSIONS = [
  "Manage communities", "Approve members", "Manage subscriptions", "View transactions",
  "Manage advertisements", "Edit CMS pages", "Manage roles", "View reports",
  "Manage matrimony", "Manage events", "Manage donations", "Platform settings",
];

const ROLES = [
  { id: "r1", name: "Super Admin", color: "primary", users: 3, desc: "Full access to every module and setting", perms: PERMISSIONS },
  { id: "r2", name: "Platform Manager", color: "gold", users: 6, desc: "Day-to-day platform operations", perms: PERMISSIONS.filter((_, i) => i < 8) },
  { id: "r3", name: "Support", color: "teal", users: 14, desc: "Handle community and member queries", perms: ["Approve members", "View transactions", "View reports", "Manage events"] },
  { id: "r4", name: "Content Editor", color: "primary", users: 4, desc: "Manage CMS, banners and FAQs", perms: ["Edit CMS pages", "Manage advertisements"] },
  { id: "r5", name: "Finance", color: "gold", users: 2, desc: "Subscriptions, payouts and refunds", perms: ["Manage subscriptions", "View transactions", "View reports"] },
];

const STAFF = Array.from({ length: 8 }, (_, i) => ({
  id: `u${i+1}`, name: ["Anjali Mehta","Rohan Desai","Kavya Patel","Vihaan Sharma","Diya Nair","Arjun Kapoor","Meera Iyer","Yash Joshi"][i],
  email: ["anjali","rohan","kavya","vihaan","diya","arjun","meera","yash"][i] + "@wearegoing.in",
  role: ROLES[i % ROLES.length].name, status: i === 5 ? "Suspended" : "Active",
  avatar: `https://i.pravatar.cc/120?img=${i+10}`,
}));

function Body() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(ROLES[0]);
  const [tab, setTab] = useState<"roles" | "staff">("roles");
  return (
    <PageWrap title="Roles & Permissions" desc="Define internal staff roles and module-level permissions" action={
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow-sapphire"><Plus className="w-4 h-4" /> New role</button>
    }>
      <div className="flex gap-2 mb-5 border-b border-warm">
        {(["roles","staff"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition ${tab === t ? "border-primary text-primary" : "border-transparent text-warm-muted hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "roles" && (
        <div className="grid lg:grid-cols-[280px_1fr] gap-5">
          <div className="space-y-2">
            {ROLES.map(r => (
              <button key={r.id} onClick={() => setSelected(r)} className={`w-full text-left p-4 rounded-xl border transition ${selected.id === r.id ? "border-primary bg-primary/5 shadow-sapphire" : "border-warm bg-surface hover:bg-sand"}`}>
                <div className="flex items-start justify-between"><div className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary" /><span className="font-ui font-semibold text-sm">{r.name}</span></div><span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sand text-warm-muted">{r.users}</span></div>
                <p className="text-xs text-warm-muted mt-1 line-clamp-2">{r.desc}</p>
              </button>
            ))}
          </div>
          <AnimatedCard className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div><h3 className="font-ui font-bold text-xl">{selected.name}</h3><p className="text-sm text-warm-muted mt-1">{selected.desc}</p></div>
              <div className="flex gap-2"><button className="p-2 rounded-lg border border-warm hover:bg-sand"><Pencil className="w-4 h-4" /></button><button className="p-2 rounded-lg border border-warm text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button></div>
            </div>
            <h4 className="font-ui font-semibold text-sm mb-3">Permissions ({selected.perms.length}/{PERMISSIONS.length})</h4>
            <div className="grid sm:grid-cols-2 gap-2">
              {PERMISSIONS.map(p => {
                const has = selected.perms.includes(p);
                return (
                  <div key={p} className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${has ? "border-primary/30 bg-primary/5" : "border-warm bg-sand/40 opacity-60"}`}>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center ${has ? "bg-primary text-white" : "bg-warm/40"}`}>{has && <Check className="w-3.5 h-3.5" />}</div>
                    <span className="text-sm">{p}</span>
                  </div>
                );
              })}
            </div>
          </AnimatedCard>
        </div>
      )}

      {tab === "staff" && (
        <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand text-xs uppercase tracking-wide text-warm-muted"><tr>{["User","Email","Role","Status","Actions"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {STAFF.map(s => (
                <tr key={s.id} className="hover:bg-sand/40">
                  <td className="px-4 py-3"><div className="flex items-center gap-3"><AvatarCircle name={s.name} src={s.avatar} size={32} /><span className="font-medium">{s.name}</span></div></td>
                  <td className="px-4 py-3 text-warm-muted">{s.email}</td>
                  <td className="px-4 py-3"><span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"><ShieldCheck className="w-3 h-3" />{s.role}</span></td>
                  <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><button className="p-1.5 rounded hover:bg-sand"><Pencil className="w-4 h-4" /></button><button className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnimatedCard>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Create role" size="lg">
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-medium text-warm-muted">Role name</span><input className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" placeholder="e.g. Regional Manager" /></label>
            <label className="block"><span className="text-xs font-medium text-warm-muted">Description</span><input className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" placeholder="What can this role do?" /></label>
          </div>
          <div>
            <h4 className="font-ui font-semibold text-sm mb-2">Permissions</h4>
            <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {PERMISSIONS.map(p => (
                <label key={p} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-warm hover:bg-sand cursor-pointer text-sm"><input type="checkbox" className="accent-primary" />{p}</label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-warm"><button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-warm text-sm">Cancel</button><button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">Create role</button></div>
        </div>
      </Modal>
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/roles")({ component: Body });
