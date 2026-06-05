import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { HandHeart } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatusBadge } from "@/components/wag/primitives";
import { CAMPAIGNS, DONATIONS } from "@/data/mock";

export const Route = createFileRoute("/dashboard/donations")({
  component: () => {
    const [active, setActive] = useState<typeof CAMPAIGNS[0] | null>(null);
    const [amount, setAmount] = useState(501);
    return (
      <PageWrap title="Donations" desc="Active community fundraising campaigns">
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {CAMPAIGNS.map(c => {
            const pct = Math.round(c.raised / c.goal * 100);
            return (<AnimatedCard key={c.id} className="overflow-hidden">
              <img src={c.img} alt="" className="h-40 w-full object-cover" />
              <div className="p-5">
                <h3 className="font-ui font-semibold">{c.title}</h3>
                <p className="text-xs text-warm-muted mt-1">{c.desc}</p>
                <div className="mt-4 flex items-center justify-between text-xs"><span className="font-medium">₹{(c.raised/100000).toFixed(1)}L raised</span><span className="text-warm-muted">of ₹{(c.goal/100000).toFixed(1)}L</span></div>
                <div className="h-2 bg-sand rounded-full overflow-hidden mt-2"><div style={{ width: `${pct}%` }} className="h-full bg-gradient-to-r from-primary to-gold" /></div>
                <button onClick={() => setActive(c)} className="mt-4 w-full py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center justify-center gap-1"><HandHeart className="w-4 h-4" />Donate</button>
              </div>
            </AnimatedCard>);
          })}
        </div>
        <h3 className="font-ui font-semibold mb-3">My donations</h3>
        <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Date","Campaign","Amount","Method","Status"].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
            {DONATIONS.slice(0, 8).map(d => <tr key={d.id} className="border-t border-warm hover:bg-sand"><td className="p-3">{d.date}</td><td className="p-3 font-medium">{d.campaign}</td><td className="p-3">₹{d.amount.toLocaleString()}</td><td className="p-3">{d.method}</td><td className="p-3"><StatusBadge status={d.status} /></td></tr>)}
          </tbody></table>
        </AnimatedCard>
        <Modal open={!!active} onClose={() => setActive(null)} title={`Donate to ${active?.title}`}>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">{[100,500,1000,5100].map(a => <button key={a} onClick={() => setAmount(a)} className={`py-2 rounded-lg border ${amount===a?"bg-primary text-white border-primary":"border-warm"}`}>₹{a}</button>)}</div>
            <input value={amount} onChange={e => setAmount(+e.target.value)} type="number" placeholder="Custom amount" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
            <textarea rows={2} placeholder="Optional message" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
            <button onClick={() => setActive(null)} className="w-full py-3 rounded-lg bg-primary text-white font-medium">Donate ₹{amount.toLocaleString()}</button>
          </div>
        </Modal>
      </PageWrap>
    );
  },
});
