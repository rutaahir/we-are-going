import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles, Download, Flag } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatCard, StatusBadge } from "@/components/wag/primitives";
import { MATRIMONY, COMMUNITIES } from "@/data/mock";

export const Route = createFileRoute("/admin/matrimony")({
  component: () => {
    const [tab, setTab] = useState("All"); const [match, setMatch] = useState(false); const [confetti, setConfetti] = useState(false);
    const list = tab === "All" ? MATRIMONY : MATRIMONY.filter(m => m.gender === tab || m.status === tab);
    return (
      <PageWrap title="Matrimony — Platform" desc="Approve, feature and match across communities" action={<div className="flex gap-2"><button className="px-4 py-2 rounded-lg border border-warm text-sm flex items-center gap-2"><Download className="w-4 h-4" />Export</button><button onClick={() => setMatch(true)} className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4" />Create Match</button></div>}>
        <div className="grid sm:grid-cols-5 gap-3 mb-6">
          <StatCard icon={<Heart />} label="Brides" value={1840} accent="primary" />
          <StatCard icon={<Heart />} label="Grooms" value={2120} accent="gold" />
          <StatCard icon={<Heart />} label="Matches" value={184} accent="teal" />
          <StatCard icon={<Flag />} label="Pending" value={48} accent="primary" />
          <StatCard icon={<Flag />} label="Flagged" value={6} accent="gold" />
        </div>
        <div className="flex gap-2 border-b border-warm mb-6 overflow-x-auto">{["All","Bride","Groom","Matched","Pending","Rejected","Flagged"].map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${tab===t?"border-primary text-primary":"border-transparent text-warm-muted"}`}>{t}</button>)}</div>
        <div className="flex gap-3 mb-4"><select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All communities</option>{COMMUNITIES.map(c=><option key={c.id}>{c.name}</option>)}</select></div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map(p => (
            <AnimatedCard key={p.id} className={`overflow-hidden ${p.status === "Featured" ? "ring-2 ring-gold" : ""}`}>
              <div className="aspect-[4/5] relative"><img src={p.photo} className="w-full h-full object-cover" /><div className="absolute top-2 left-2"><span className="text-[10px] bg-surface/90 px-2 py-0.5 rounded-full">{p.gender}</span></div><div className="absolute top-2 right-2"><StatusBadge status={p.status} /></div></div>
              <div className="p-4"><div className="font-ui font-semibold text-sm">{p.name}, {p.age}</div><div className="text-xs text-warm-muted line-clamp-1">{p.community}</div><div className="grid grid-cols-2 gap-1 mt-3"><button className="text-xs py-1 rounded bg-teal/15 text-teal">Approve</button><button className="text-xs py-1 rounded bg-red-50 text-red-500">Reject</button><button className="text-xs py-1 rounded bg-gold-light text-gold">Feature</button><button className="text-xs py-1 rounded bg-amber-50 text-amber-600">Flag</button></div></div>
            </AnimatedCard>
          ))}
        </div>
        <Modal open={match} onClose={() => setMatch(false)} title="Create Manual Match" size="xl">
          <div className="grid sm:grid-cols-2 gap-4">
            {(["Bride", "Groom"] as const).map(g => (
              <div key={g}><h4 className="font-ui font-semibold mb-2 text-sm">Select {g}</h4><input placeholder="Search…" className="w-full px-3 py-2 mb-2 rounded-lg border border-warm bg-surface text-sm" /><div className="space-y-2 max-h-64 overflow-y-auto">{MATRIMONY.filter(m => m.gender === g).map(m => <label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-sand cursor-pointer"><input type="radio" name={g} /><img src={m.photo} className="w-10 h-10 rounded-lg object-cover" /><div><div className="text-sm font-medium">{m.name}, {m.age}</div><div className="text-xs text-warm-muted">{m.community}</div></div></label>)}</div></div>
            ))}
          </div>
          <button onClick={() => { setConfetti(true); setTimeout(() => { setConfetti(false); setMatch(false); }, 2000); }} className="mt-5 w-full py-2.5 rounded-lg bg-gold text-white font-medium flex items-center justify-center gap-2"><Heart className="w-4 h-4" />Confirm Match</button>
          {confetti && <div className="fixed inset-0 pointer-events-none z-[60]">{Array.from({length: 50}).map((_, i) => <motion.div key={i} initial={{ x: typeof window !== "undefined" ? window.innerWidth/2 : 500, y: typeof window !== "undefined" ? window.innerHeight/2 : 400, opacity: 1 }} animate={{ x: Math.random() * (typeof window !== "undefined" ? window.innerWidth : 1000), y: Math.random() * (typeof window !== "undefined" ? window.innerHeight : 800), opacity: 0, rotate: 360 }} transition={{ duration: 1.5 }} className="absolute w-3 h-3 rounded" style={{ background: ["#C9860A", "#1B4FD8", "#0D7377", "#B91C1C"][i % 4] }} />)}</div>}
        </Modal>
      </PageWrap>
    );
  },
});
