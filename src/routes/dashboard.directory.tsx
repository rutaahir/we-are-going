import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Grid3x3, List, Map, MapPin, Search, Phone, Briefcase } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, DetailDrawer, StatusBadge } from "@/components/wag/primitives";
import { MEMBERS } from "@/data/mock";

export const Route = createFileRoute("/dashboard/directory")({
  component: () => {
    const [view, setView] = useState<"card" | "list" | "map">("card");
    const [q, setQ] = useState(""); const [open, setOpen] = useState<typeof MEMBERS[0] | null>(null);
    const list = MEMBERS.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));
    return (
      <PageWrap title="Member Directory" desc={`${list.length} members in your samaj network`}>
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" /><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search by name, village, profession…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-warm bg-surface" /></div>
          <select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All states</option></select>
          <select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All professions</option></select>
          <div className="inline-flex bg-sand rounded-lg p-1">
            {[{v:"card",i:Grid3x3},{v:"list",i:List},{v:"map",i:Map}].map(o => <button key={o.v} onClick={()=>setView(o.v as any)} className={`p-1.5 rounded ${view===o.v?"bg-surface shadow":""}`}><o.i className="w-4 h-4" /></button>)}
          </div>
        </div>
        {view === "card" && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {list.map(m => (
              <AnimatedCard key={m.id} className="p-5 text-center cursor-pointer" >
                <div onClick={() => setOpen(m)}>
                  <AvatarCircle name={m.name} src={m.avatar} size={72} />
                  <h3 className="font-ui font-semibold mt-3">{m.name}</h3>
                  <div className="text-xs text-warm-muted flex items-center justify-center gap-1 mt-1"><Briefcase className="w-3 h-3" />{m.profession}</div>
                  <div className="text-xs text-warm-muted flex items-center justify-center gap-1"><MapPin className="w-3 h-3" />{m.village}</div>
                  <div className="mt-3"><StatusBadge status={m.status} /></div>
                </div>
              </AnimatedCard>
            ))}
          </div>
        )}
        {view === "list" && (
          <AnimatedCard className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-sand"><tr>{["Name","Village","Profession","Phone","Status"].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead>
              <tbody>{list.map(m => (
                <tr key={m.id} onClick={()=>setOpen(m)} className="border-t border-warm hover:bg-sand cursor-pointer"><td className="p-3 flex items-center gap-2"><AvatarCircle name={m.name} src={m.avatar} size={32} />{m.name}</td><td className="p-3">{m.village}</td><td className="p-3">{m.profession}</td><td className="p-3">{m.phone}</td><td className="p-3"><StatusBadge status={m.status} /></td></tr>
              ))}</tbody>
            </table>
          </AnimatedCard>
        )}
        {view === "map" && (
          <AnimatedCard className="h-96 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,#dbeafe,transparent),radial-gradient(circle_at_70%_60%,#fef3c7,transparent),#e2d9cc]" />
            {Array.from({length: 24}).map((_, i) => (
              <div key={i} className="absolute w-3 h-3 rounded-full bg-primary shadow-sapphire" style={{ left: `${10 + (i*13)%80}%`, top: `${15 + (i*17)%70}%` }} />
            ))}
            <div className="absolute bottom-4 right-4 bg-surface px-3 py-2 rounded-lg text-xs shadow-warm">📍 {list.length} members in Rajula taluka</div>
          </AnimatedCard>
        )}
        <DetailDrawer open={!!open} onClose={() => setOpen(null)} title="Member Profile">
          {open && (<div className="space-y-4 text-center">
            <AvatarCircle name={open.name} src={open.avatar} size={120} />
            <div><h2 className="font-ui font-bold text-xl">{open.name}</h2><StatusBadge status={open.status} /></div>
            <div className="text-left space-y-3 pt-3">
              {[["Age", open.age], ["Gender", open.gender], ["Profession", open.profession], ["Education", open.education], ["Village", open.village], ["District", open.district], ["Phone", open.phone], ["Email", open.email]].map(([k,v]) => <div key={k} className="flex justify-between"><span className="text-warm-muted text-sm">{k}</span><span className="font-medium text-sm">{v}</span></div>)}
            </div>
            <button className="w-full py-2.5 rounded-lg bg-primary text-white font-medium"><Phone className="w-4 h-4 inline mr-2" />Contact</button>
          </div>)}
        </DetailDrawer>
      </PageWrap>
    );
  },
});
