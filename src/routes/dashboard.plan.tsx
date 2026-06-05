import { createFileRoute } from "@tanstack/react-router";
import { Check, X, Download, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, PlanBadge, StatusBadge } from "@/components/wag/primitives";
import { PLANS, TRANSACTIONS } from "@/data/mock";

export const Route = createFileRoute("/dashboard/plan")({
  component: () => {
    const { user } = useAuth();
    const current = PLANS.find(p => p.name === user?.plan) || PLANS[0];
    return (
      <PageWrap title="My Plan" desc="Manage your subscription and billing">
        <AnimatedCard className="p-6 mb-6 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-gold/30 -mr-10 -mt-10" />
          <div className="relative">
            <div className="flex items-start justify-between"><div><PlanBadge plan={user?.plan || "Free"} /><h2 className="font-display text-3xl mt-3">{current.name} Plan</h2><p className="text-white/80 text-sm mt-1">Renews on {new Date(user?.planExpiry || "").toLocaleDateString("en-IN")}</p></div><div className="text-right"><div className="text-3xl font-bold font-ui">₹{current.price.yearly.toLocaleString()}</div><div className="text-xs text-white/80">per year</div></div></div>
            <div className="mt-5 grid sm:grid-cols-2 gap-3">{Object.entries(current.modules).filter(([_,v]:any)=>v.view).slice(0,8).map(([m]) => <div key={m} className="flex items-center gap-2 text-sm text-white/90"><Check className="w-4 h-4 text-gold" />{m}</div>)}</div>
          </div>
        </AnimatedCard>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-3 mb-6"><AlertTriangle className="w-5 h-5 text-amber-600" /><div className="text-sm"><b>Renewal coming up</b> — Your plan expires in 28 days. <button className="text-primary font-medium">Renew now</button></div></div>
        <h3 className="font-ui font-semibold text-lg mb-4">Compare plans</h3>
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          {PLANS.map(p => (
            <AnimatedCard key={p.id} className={`p-5 ${p.name===user?.plan?"ring-2 ring-primary":""} ${p.highlight?"border-2 border-gold":""}`}>
              {p.highlight && <div className="text-[10px] uppercase bg-gold text-white px-2 py-0.5 rounded-full inline-block mb-2">{p.highlight}</div>}
              <h4 className="font-ui font-bold">{p.name}</h4>
              <div className="mt-2"><span className="text-2xl font-bold">₹{p.price.yearly.toLocaleString()}</span><span className="text-xs text-warm-muted">/yr</span></div>
              <div className="text-xs text-warm-muted mt-1">Up to {p.memberLimit.toLocaleString()} members</div>
              <ul className="mt-4 space-y-1.5 text-xs">{Object.entries(p.modules).slice(0, 7).map(([m,v]:any) => <li key={m} className="flex items-center gap-2">{v.view ? <Check className="w-3 h-3 text-teal" /> : <X className="w-3 h-3 text-red-400" />}<span>{m}</span></li>)}</ul>
              <button disabled={p.name === user?.plan} className="mt-4 w-full py-2 rounded-lg bg-primary text-white text-xs disabled:opacity-50">{p.name===user?.plan?"Current":"Upgrade"}</button>
            </AnimatedCard>
          ))}
        </div>
        <h3 className="font-ui font-semibold mb-3">Billing history</h3>
        <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Date","Plan","Amount","Status",""].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
            {TRANSACTIONS.slice(0,5).map(t => <tr key={t.id} className="border-t border-warm hover:bg-sand"><td className="p-3">{t.date}</td><td className="p-3">{t.plan}</td><td className="p-3">₹{t.amount.toLocaleString()}</td><td className="p-3"><StatusBadge status={t.status} /></td><td className="p-3"><button className="text-primary"><Download className="w-4 h-4" /></button></td></tr>)}
          </tbody></table>
        </AnimatedCard>
      </PageWrap>
    );
  },
});
