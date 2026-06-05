import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, PlanBadge, StatusBadge, StatCard, Modal } from "@/components/wag/primitives";
import { PLANS, TRANSACTIONS, COUPONS } from "@/data/mock";
import { CreditCard, IndianRupee, TrendingUp, Users, Plus, Check, Tag, Pencil, Trash2, Sparkles } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const mrr = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], v: 1200000 + i * 180000 + Math.floor(Math.random() * 150000) }));
const tt = { contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 } };

const MODULES = ["Member Management", "Committee Management", "Family Management", "Events", "News & Announcements", "Gallery", "Matrimony", "Job Portal", "Business Directory", "Donations", "Reports & Analytics", "API Access", "Priority Support"];

function PlanBuilder({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("Custom Plan");
  const [monthly, setMonthly] = useState(1499);
  const [yearly, setYearly] = useState(14999);
  const [members, setMembers] = useState(1000);
  const [mods, setMods] = useState<Record<string, { view: boolean; create: boolean; edit: boolean; delete: boolean }>>(
    Object.fromEntries(MODULES.map(m => [m, { view: true, create: true, edit: false, delete: false }]))
  );
  const toggle = (m: string, k: "view" | "create" | "edit" | "delete") => setMods(p => ({ ...p, [m]: { ...p[m], [k]: !p[m][k] } }));
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block"><span className="text-xs font-medium text-warm-muted">Plan name</span><input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></label>
        <label className="block"><span className="text-xs font-medium text-warm-muted">Member limit</span><input type="number" value={members} onChange={e => setMembers(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></label>
        <label className="block"><span className="text-xs font-medium text-warm-muted">Monthly ₹</span><input type="number" value={monthly} onChange={e => setMonthly(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></label>
        <label className="block"><span className="text-xs font-medium text-warm-muted">Yearly ₹</span><input type="number" value={yearly} onChange={e => setYearly(+e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></label>
      </div>
      <div>
        <h4 className="font-ui font-semibold text-sm mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-gold" /> Module permissions</h4>
        <div className="border border-warm rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_repeat(4,60px)] gap-1 px-3 py-2 bg-sand text-[11px] font-semibold uppercase tracking-wide text-warm-muted">
            <span>Module</span><span className="text-center">View</span><span className="text-center">Create</span><span className="text-center">Edit</span><span className="text-center">Delete</span>
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-[var(--border)]">
            {MODULES.map(m => (
              <div key={m} className="grid grid-cols-[1fr_repeat(4,60px)] gap-1 px-3 py-2 items-center text-sm">
                <span className="truncate">{m}</span>
                {(["view","create","edit","delete"] as const).map(k => (
                  <button key={k} onClick={() => toggle(m, k)} className={`mx-auto w-6 h-6 rounded-md flex items-center justify-center transition ${mods[m][k] ? "bg-primary text-white" : "bg-sand text-warm-muted hover:bg-warm/40"}`}>{mods[m][k] && <Check className="w-3.5 h-3.5" />}</button>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2 border-t border-warm">
        <button onClick={onClose} className="px-4 py-2 rounded-lg border border-warm text-sm">Cancel</button>
        <button onClick={onClose} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">Create plan</button>
      </div>
    </div>
  );
}

function PageBody() {
  const [tab, setTab] = useState<"plans" | "transactions" | "coupons">("plans");
  const [builderOpen, setBuilderOpen] = useState(false);
  return (
    <PageWrap title="Subscriptions" desc="Plans, transactions and coupon codes" action={
      <button onClick={() => setBuilderOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow-sapphire"><Plus className="w-4 h-4" /> New plan</button>
    }>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<IndianRupee />} label="MRR (₹)" value={3800000} accent="primary" />
        <StatCard icon={<TrendingUp />} label="ARR (₹)" value={45600000} accent="gold" />
        <StatCard icon={<Users />} label="Paying customers" value={428} accent="teal" />
        <StatCard icon={<CreditCard />} label="Churn (%)" value={2} suffix=".4%" accent="primary" />
      </div>

      <AnimatedCard className="p-5 mb-6">
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

      <div className="flex gap-2 mb-4 border-b border-warm">
        {(["plans","transactions","coupons"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition ${tab === t ? "border-primary text-primary" : "border-transparent text-warm-muted hover:text-foreground"}`}>{t}</button>
        ))}
      </div>

      {tab === "plans" && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map(p => (
            <AnimatedCard key={p.id} className="p-5 flex flex-col">
              {p.highlight && <span className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gold-light text-gold mb-2">{p.highlight}</span>}
              <PlanBadge plan={p.name} />
              <div className="mt-3 text-3xl font-bold font-ui">₹{p.price.monthly.toLocaleString("en-IN")}<span className="text-xs font-normal text-warm-muted">/mo</span></div>
              <p className="text-xs text-warm-muted mt-1">{p.description}</p>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-warm-muted">Members</span><span className="font-medium">{p.memberLimit.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-warm-muted">Storage</span><span className="font-medium">{p.storage}</span></div>
                <div className="flex justify-between"><span className="text-warm-muted">Yearly</span><span className="font-medium">₹{p.price.yearly.toLocaleString("en-IN")}</span></div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-warm">
                <button className="flex-1 px-3 py-1.5 rounded-lg border border-warm text-xs font-medium hover:bg-sand inline-flex items-center justify-center gap-1"><Pencil className="w-3 h-3" /> Edit</button>
                <button className="px-3 py-1.5 rounded-lg border border-warm text-xs text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {tab === "transactions" && (
        <AnimatedCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs uppercase tracking-wide text-warm-muted">
                <tr>{["Txn ID","Subscriber","Type","Plan","Amount","Method","Date","Status"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {TRANSACTIONS.map(t => (
                  <tr key={t.id} className="hover:bg-sand/40">
                    <td className="px-4 py-3 font-mono text-xs">{t.id}</td>
                    <td className="px-4 py-3 font-medium">{t.subscriber}</td>
                    <td className="px-4 py-3 text-warm-muted">{t.type}</td>
                    <td className="px-4 py-3"><PlanBadge plan={t.plan} /></td>
                    <td className="px-4 py-3 font-semibold">₹{t.amount.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-warm-muted">{t.method}</td>
                    <td className="px-4 py-3 text-warm-muted">{t.date}</td>
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
            <AnimatedCard key={c.code} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2"><Tag className="w-4 h-4 text-gold" /><span className="font-mono text-lg font-bold">{c.code}</span></div>
                <StatusBadge status={c.status} />
              </div>
              <div className="mt-3 text-3xl font-bold font-ui text-primary">{c.type === "%" ? `${c.discount}%` : `₹${c.discount}`}<span className="text-xs font-normal text-warm-muted"> off</span></div>
              <div className="mt-3 text-xs text-warm-muted space-y-1">
                <div className="flex justify-between"><span>Plan</span><span className="text-foreground font-medium">{c.plan}</span></div>
                <div className="flex justify-between"><span>Used</span><span className="text-foreground font-medium">{c.used}/{c.limit}</span></div>
                <div className="flex justify-between"><span>Expires</span><span className="text-foreground font-medium">{c.expiry}</span></div>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-sand overflow-hidden"><div className="h-full bg-primary" style={{ width: `${Math.min(100, (c.used/c.limit)*100)}%` }} /></div>
            </AnimatedCard>
          ))}
        </div>
      )}

      <Modal open={builderOpen} onClose={() => setBuilderOpen(false)} title="Create subscription plan" size="lg">
        <PlanBuilder onClose={() => setBuilderOpen(false)} />
      </Modal>
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/subscriptions")({ component: PageBody });
