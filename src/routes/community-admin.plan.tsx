import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, PlanBadge } from "@/components/wag/primitives";
import { PLANS } from "@/data/mock";

export const Route = createFileRoute("/community-admin/plan")({
  component: () => (
    <PageWrap title="My Plan" desc="Manage your community subscription">
      <AnimatedCard className="p-6 mb-6 bg-gradient-to-br from-primary to-primary-dark text-white">
        <PlanBadge plan="Pro" />
        <h2 className="font-display text-3xl mt-3">Pro Plan</h2>
        <p className="text-white/80 text-sm">Renews 31 Dec 2026 · auto-renew enabled</p>
        <div className="grid sm:grid-cols-2 gap-4 mt-5">
          <div className="bg-white/10 rounded-xl p-4"><div className="text-xs text-white/70">Members</div><div className="text-2xl font-bold mt-1">1,240 / 2,000</div><div className="h-2 bg-white/20 rounded-full mt-2 overflow-hidden"><div style={{ width: "62%" }} className="h-full bg-gold" /></div></div>
          <div className="bg-white/10 rounded-xl p-4"><div className="text-xs text-white/70">Storage</div><div className="text-2xl font-bold mt-1">28 / 50 GB</div><div className="h-2 bg-white/20 rounded-full mt-2 overflow-hidden"><div style={{ width: "56%" }} className="h-full bg-gold" /></div></div>
        </div>
        <label className="flex items-center gap-2 mt-4 text-sm"><input type="checkbox" defaultChecked /> Auto-renew on expiry</label>
      </AnimatedCard>
      <h3 className="font-ui font-semibold mb-4">Upgrade options</h3>
      <div className="grid md:grid-cols-4 gap-4">
        {PLANS.map(p => (
          <AnimatedCard key={p.id} className={`p-5 ${p.highlight?"border-2 border-gold":""}`}>
            {p.highlight && <div className="text-[10px] uppercase bg-gold text-white px-2 py-0.5 rounded-full inline-block mb-2">{p.highlight}</div>}
            <h4 className="font-ui font-bold">{p.name}</h4>
            <div className="text-2xl font-bold mt-1">₹{p.price.yearly.toLocaleString()}<span className="text-xs text-warm-muted font-normal">/yr</span></div>
            <ul className="mt-4 space-y-1.5 text-xs">{Object.entries(p.modules).filter(([_,v]:any)=>v.view).slice(0,5).map(([m]) => <li key={m} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-teal" />{m}</li>)}</ul>
            <button className="mt-4 w-full py-2 rounded-lg bg-primary text-white text-xs">Choose</button>
          </AnimatedCard>
        ))}
      </div>
    </PageWrap>
  ),
});
