import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, PlanBadge, StatusBadge, StatCard, Modal } from "@/components/wag/primitives";
import { TRANSACTIONS, COUPONS } from "@/data/mock";
import { CreditCard, IndianRupee, TrendingUp, Users, Plus, Check, Tag, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import api from "@/lib/api";

const mrr = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], v: 1200000 + i * 180000 + Math.floor(Math.random() * 150000) }));
const tt = { contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 } };

const MODULES = ["Member Management", "Committee Management", "Family Management", "Events", "News & Announcements", "Gallery", "Matrimony", "Job Portal", "Business Directory", "Donations", "Reports & Analytics", "API Access", "Priority Support"];

interface PlanBuilderProps {
  onClose: () => void;
  onSuccess: () => void;
  plan?: any;
}

function PlanBuilder({ onClose, onSuccess, plan }: PlanBuilderProps) {
  const [name, setName] = useState(plan?.name || "Custom Plan");
  const [monthly, setMonthly] = useState(plan?.monthly_price || 1499);
  const [yearly, setYearly] = useState(plan?.yearly_price || 14999);
  const [members, setMembers] = useState(plan?.member_limit || 1000);
  const [saving, setSaving] = useState(false);
  
  // Set modules state
  const [mods, setMods] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>(() => {
    if (plan?.modules) {
      return plan.modules;
    }
    return Object.fromEntries(MODULES.map(m => [m, { view: true, create: true, edit: false, delete: false }]));
  });

  const toggle = (m: string, k: "view" | "create" | "edit" | "delete") => setMods(p => ({ ...p, [m]: { ...p[m], [k]: !p[m][k] } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        monthly_price: monthly,
        yearly_price: yearly,
        member_limit: members,
        modules: mods,
      };

      if (plan?.id) {
        await api.updatePlan(plan.id, payload);
      } else {
        await api.createPlan(payload);
      }
      onSuccess();
    } catch (e) {
      console.error(e);
      alert("Error saving subscription plan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block"><span className="text-xs font-bold text-warm-muted">Plan Name</span><input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></label>
        <label className="block"><span className="text-xs font-bold text-warm-muted">Member Limit</span><input type="number" value={members} onChange={e => setMembers(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></label>
        <label className="block"><span className="text-xs font-bold text-warm-muted">Monthly Price (₹)</span><input type="number" value={monthly} onChange={e => setMonthly(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></label>
        <label className="block"><span className="text-xs font-bold text-warm-muted">Yearly Price (₹)</span><input type="number" value={yearly} onChange={e => setYearly(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></label>
      </div>
      <div>
        <h4 className="font-ui font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold" /> Module permissions</h4>
        <div className="border border-warm rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_repeat(4,60px)] gap-1 px-3 py-2 bg-sand text-[11px] font-semibold uppercase tracking-wide text-warm-muted">
            <span>Module</span><span className="text-center">View</span><span className="text-center">Create</span><span className="text-center">Edit</span><span className="text-center">Delete</span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-warm">
            {MODULES.map(m => (
              <div key={m} className="grid grid-cols-[1fr_repeat(4,60px)] gap-1 px-3 py-2 items-center text-sm bg-surface hover:bg-sand/20">
                <span className="truncate font-medium text-foreground">{m}</span>
                {(["view","create","edit","delete"] as const).map(k => (
                  <button key={k} onClick={() => toggle(m, k)} className={`mx-auto w-6 h-6 rounded-md flex items-center justify-center transition ${mods[m]?.[k] ? "bg-primary text-white" : "bg-sand text-warm-muted hover:bg-warm/40"}`}>{mods[m]?.[k] && <Check className="w-3.5 h-3.5" />}</button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-warm">
        <button onClick={onClose} disabled={saving} className="px-4 py-2 rounded-xl border border-warm text-sm disabled:opacity-50">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 flex items-center gap-2">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {plan?.id ? "Update Plan" : "Create Plan"}
        </button>
      </div>
    </div>
  );
}

function PageBody() {
  const [tab, setTab] = useState<"plans" | "transactions" | "coupons">("plans");
  const [builderOpen, setBuilderOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const data = await api.getPlans();
      setPlans(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleEditOpen = (p: any) => {
    setSelectedPlan(p);
    setBuilderOpen(true);
  };

  const handleCreateOpen = () => {
    setSelectedPlan(null);
    setBuilderOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this subscription plan?")) return;
    try {
      await api.deletePlan(id);
      await fetchPlans();
    } catch (e) {
      console.error(e);
      alert("Error deleting plan.");
    }
  };

  return (
    <PageWrap title="Subscriptions" desc="Plans, transactions and coupon codes" action={
      <button onClick={handleCreateOpen} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/95 transition"><Plus className="w-4 h-4" /> New plan</button>
    }>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<IndianRupee />} label="MRR (₹)" value={3800000} accent="primary" />
        <StatCard icon={<TrendingUp />} label="ARR (₹)" value={45600000} accent="gold" />
        <StatCard icon={<Users />} label="Paying customers" value={428} accent="teal" />
        <StatCard icon={<CreditCard />} label="Churn (%)" value={2} suffix=".4%" accent="primary" />
      </div>

      <AnimatedCard className="p-5 mb-6 border border-warm">
        <h3 className="font-ui font-semibold mb-3">Monthly recurring revenue</h3>
        <div className="h-60">
          <ResponsiveContainer>
            <LineChart data={mrr}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} />
              <Tooltip {...tt} />
              <Line type="monotone" dataKey="v" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </AnimatedCard>

      <div className="flex gap-2 mb-4 border-b border-warm overflow-x-auto whitespace-nowrap">
        {(["plans","transactions","coupons"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-semibold capitalize border-b-2 -mb-px transition ${tab === t ? "border-primary text-primary" : "border-transparent text-warm-muted hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "plans" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full py-10 text-center text-warm-muted flex justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
          ) : plans.length === 0 ? (
            <div className="col-span-full py-10 text-center text-warm-muted">No plans found. Create one!</div>
          ) : plans.map(p => (
            <AnimatedCard key={p.id} className="p-5 flex flex-col justify-between border border-warm">
              <div>
                {p.highlight && <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gold-light text-gold mb-2">{p.highlight}</span>}
                <PlanBadge plan={p.name} />
                <div className="mt-3 text-3xl font-bold font-ui">₹{(p.monthly_price || 0).toLocaleString("en-IN")}<span className="text-xs font-normal text-warm-muted">/mo</span></div>
                <p className="text-xs text-warm-muted mt-1">{p.description || "Access to selected community portals."}</p>
                <div className="mt-3 space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-warm-muted">Members</span><span className="font-semibold text-foreground">{(p.member_limit || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-warm-muted">Storage</span><span className="font-semibold text-foreground">{p.storage || "1 GB"}</span></div>
                  <div className="flex justify-between"><span className="text-warm-muted">Yearly</span><span className="font-semibold text-foreground">₹{(p.yearly_price || 0).toLocaleString("en-IN")}</span></div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-warm">
                <button onClick={() => handleEditOpen(p)} className="flex-1 px-3 py-1.5 rounded-lg border border-warm text-xs font-semibold hover:bg-sand text-primary transition inline-flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                <button onClick={() => handleDelete(p.id)} className="px-3 py-1.5 rounded-lg border border-warm text-xs text-red-600 hover:bg-red-50 transition"><Trash2 className="w-3 h-3" /></button>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {tab === "transactions" && (
        <AnimatedCard className="overflow-hidden border border-warm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs font-bold uppercase tracking-wide text-warm-muted">
                <tr>{["Txn ID","Subscriber","Type","Plan","Amount","Method","Date","Status"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-warm">
                {TRANSACTIONS.map(t => (
                  <tr key={t.id} className="hover:bg-sand/30 transition">
                    <td className="px-4 py-3 font-mono text-xs text-warm-muted">{t.id}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{t.subscriber}</td>
                    <td className="px-4 py-3 text-warm-muted text-xs font-medium">{t.type}</td>
                    <td className="px-4 py-3"><PlanBadge plan={t.plan} /></td>
                    <td className="px-4 py-3 font-bold text-foreground">₹{t.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-warm-muted text-xs">{t.method}</td>
                    <td className="px-4 py-3 text-warm-muted text-xs">{t.date}</td>
                    <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}

      {tab === "coupons" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {COUPONS.map(c => (
            <AnimatedCard key={c.code} className="p-5 border border-warm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-gold" /><span className="font-mono text-lg font-bold text-foreground">{c.code}</span></div>
                <StatusBadge status={c.status} />
              </div>
              <div className="mt-3 text-3xl font-bold font-ui text-primary">{c.type === "%" ? `${c.discount}%` : `₹${c.discount}`}<span className="text-xs font-normal text-warm-muted"> off</span></div>
              <div className="mt-3 text-xs text-warm-muted space-y-1">
                <div className="flex justify-between"><span>Plan</span><span className="text-foreground font-semibold">{c.plan}</span></div>
                <div className="flex justify-between"><span>Used</span><span className="text-foreground font-semibold">{c.used}/{c.limit}</span></div>
                <div className="flex justify-between"><span>Expires</span><span className="text-foreground font-semibold">{c.expiry}</span></div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-sand overflow-hidden border border-warm/30"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (c.used/c.limit)*100)}%` }} /></div>
            </AnimatedCard>
          ))}
        </div>
      )}

      <Modal open={builderOpen} onClose={() => setBuilderOpen(false)} title={selectedPlan ? "Edit subscription plan" : "Create subscription plan"} size="lg">
        <PlanBuilder plan={selectedPlan} onClose={() => setBuilderOpen(false)} onSuccess={() => { setBuilderOpen(false); fetchPlans(); }} />
      </Modal>
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/subscriptions")({ component: PageBody });
