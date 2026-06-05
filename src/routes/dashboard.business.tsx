import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Star, Phone, MapPin } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, DetailDrawer, StatusBadge } from "@/components/wag/primitives";
import { BUSINESSES } from "@/data/mock";

export const Route = createFileRoute("/dashboard/business")({
  component: () => {
    const [cat, setCat] = useState("All"); const [q, setQ] = useState(""); const [open, setOpen] = useState<typeof BUSINESSES[0] | null>(null);
    const cats = ["All", ...new Set(BUSINESSES.map(b => b.category))];
    const list = BUSINESSES.filter(b => (cat === "All" || b.category === cat) && b.name.toLowerCase().includes(q.toLowerCase()));
    return (
      <PageWrap title="Business Directory" desc={`${list.length} verified samaj businesses`}>
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search businesses" className="w-full pl-9 pr-3 py-2 rounded-lg border border-warm bg-surface" /></div>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">{cats.map(c => <button key={c} onClick={()=>setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium ${cat===c?"bg-primary text-white":"bg-surface border border-warm"}`}>{c}</button>)}</div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.map(b => (
            <AnimatedCard key={b.id} className="overflow-hidden cursor-pointer" >
              <div onClick={() => setOpen(b)}>
                <img src={b.img} alt={b.name} className="h-36 w-full object-cover" loading="lazy" />
                <div className="p-5">
                  <div className="flex items-center justify-between mb-1"><span className="text-[10px] uppercase tracking-wider text-gold font-semibold">{b.category}</span>{b.verified && <StatusBadge status="Verified" />}</div>
                  <h3 className="font-ui font-semibold">{b.name}</h3>
                  <div className="text-xs text-warm-muted mt-1">Owner: {b.owner}</div>
                  <div className="text-xs text-warm-muted flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{b.location}</div>
                  <div className="flex items-center justify-between mt-3"><div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-gold text-gold" /><span className="font-medium">{b.rating}</span></div><button className="text-xs px-3 py-1.5 rounded-lg bg-primary text-white">Enquire</button></div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
        <DetailDrawer open={!!open} onClose={() => setOpen(null)} title={open?.name}>
          {open && (<div className="space-y-4">
            <img src={open.img} alt="" className="w-full h-48 object-cover rounded-xl" />
            <div className="flex items-center justify-between"><div><div className="font-ui font-bold text-lg">{open.name}</div><div className="text-xs text-gold uppercase tracking-wider">{open.category}</div></div>{open.verified && <StatusBadge status="Verified" />}</div>
            <p className="text-sm text-warm-muted">{open.desc}</p>
            <div className="space-y-2 text-sm"><div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" />{open.location}</div><div className="flex items-center gap-2"><Phone className="w-4 h-4 text-primary" />{open.phone}</div><div className="flex items-center gap-2"><Star className="w-4 h-4 fill-gold text-gold" />{open.rating} (124 reviews)</div></div>
            <button className="w-full py-2.5 rounded-lg bg-primary text-white font-medium">Send Enquiry</button>
          </div>)}
        </DetailDrawer>
      </PageWrap>
    );
  },
});
