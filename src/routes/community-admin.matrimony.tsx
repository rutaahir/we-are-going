import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Sparkles } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatusBadge } from "@/components/wag/primitives";
import { MATRIMONY } from "@/data/mock";

export const Route = createFileRoute("/community-admin/matrimony")({
  component: () => {
    const [tab, setTab] = useState("All");
    const [matchOpen, setMatchOpen] = useState(false); const [confetti, setConfetti] = useState(false);
    const list = MATRIMONY.filter(p => tab === "All" || p.gender === tab);
    return (
      <PageWrap title="Matrimony Management" desc="Approve, feature and create matches" action={<button onClick={() => setMatchOpen(true)} className="px-4 py-2 rounded-lg bg-gold text-white text-sm font-medium flex items-center gap-2"><Sparkles className="w-4 h-4" />Create Match</button>}>
        <div className="flex gap-2 border-b border-warm mb-6">{["All","Bride","Groom","Matched","Flagged"].map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab===t?"border-primary text-primary":"border-transparent text-warm-muted"}`}>{t}</button>)}</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map(p => (
            <AnimatedCard key={p.id} className={`overflow-hidden ${p.status==="Featured"?"ring-2 ring-gold":""}`}>
              <div className="aspect-[4/5] relative"><img src={p.photo} className="w-full h-full object-cover" /><div className="absolute top-2 right-2"><StatusBadge status={p.status} /></div></div>
              <div className="p-4"><div className="font-ui font-semibold text-sm">{p.name}, {p.age}</div><div className="text-xs text-warm-muted">{p.education} · {p.location}</div><div className="grid grid-cols-2 gap-1 mt-3"><button className="text-xs py-1 rounded bg-teal/15 text-teal">Approve</button><button className="text-xs py-1 rounded bg-red-50 text-red-500">Reject</button><button className="text-xs py-1 rounded bg-gold-light text-gold">Feature</button><button className="text-xs py-1 rounded bg-amber-50 text-amber-600">Flag</button></div></div>
            </AnimatedCard>
          ))}
        </div>
        <Modal open={matchOpen} onClose={() => setMatchOpen(false)} title="Create Match" size="lg">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><h4 className="font-ui font-semibold mb-2 text-sm">Select Bride</h4><div className="space-y-2 max-h-72 overflow-y-auto">{MATRIMONY.filter(m=>m.gender==="Bride").map(m=><label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-sand cursor-pointer"><input type="radio" name="b" /><img src={m.photo} className="w-10 h-10 rounded-lg object-cover" /><div className="text-sm">{m.name}, {m.age}</div></label>)}</div></div>
            <div><h4 className="font-ui font-semibold mb-2 text-sm">Select Groom</h4><div className="space-y-2 max-h-72 overflow-y-auto">{MATRIMONY.filter(m=>m.gender==="Groom").map(m=><label key={m.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-sand cursor-pointer"><input type="radio" name="g" /><img src={m.photo} className="w-10 h-10 rounded-lg object-cover" /><div className="text-sm">{m.name}, {m.age}</div></label>)}</div></div>
          </div>
          <button onClick={() => { setConfetti(true); setTimeout(() => { setConfetti(false); setMatchOpen(false); }, 2000); }} className="mt-5 w-full py-2.5 rounded-lg bg-gold text-white font-medium flex items-center justify-center gap-2"><Heart className="w-4 h-4" />Confirm Match</button>
          {confetti && <div className="fixed inset-0 pointer-events-none z-[60]">{Array.from({length:40}).map((_,i) => <motion.div key={i} initial={{ x: window.innerWidth/2, y: window.innerHeight/2, opacity: 1 }} animate={{ x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, opacity: 0, rotate: 360 }} transition={{ duration: 1.5 }} className="absolute w-3 h-3 rounded" style={{ background: ["#C9860A","#1B4FD8","#0D7377","#B91C1C"][i%4] }} />)}</div>}
        </Modal>
      </PageWrap>
    );
  },
});
