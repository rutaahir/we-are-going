import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calendar, Grid3x3, List, MapPin, Users } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatusBadge } from "@/components/wag/primitives";
import { EVENTS } from "@/data/mock";

export const Route = createFileRoute("/dashboard/events")({
  component: () => {
    const [view, setView] = useState<"grid" | "list" | "calendar">("grid");
    const [registered, setRegistered] = useState<string | null>(null);
    return (
      <PageWrap title="Events" desc="Sammelan, sports, marriages and more" action={
        <div className="inline-flex bg-sand rounded-lg p-1">{[{v:"grid",i:Grid3x3},{v:"list",i:List},{v:"calendar",i:Calendar}].map(o => <button key={o.v} onClick={()=>setView(o.v as any)} className={`p-1.5 rounded ${view===o.v?"bg-surface shadow":""}`}><o.i className="w-4 h-4" /></button>)}</div>
      }>
        {view === "grid" && <div className="grid md:grid-cols-3 gap-5">
          {EVENTS.map(e => (
            <AnimatedCard key={e.id} className="overflow-hidden">
              <div className="relative h-40"><img src={e.img} alt="" className="w-full h-full object-cover" /><div className={`absolute left-0 top-0 bottom-0 w-2 bg-${e.color}-500`} /><div className="absolute top-3 right-3"><StatusBadge status={e.status} /></div></div>
              <div className="p-5">
                <h3 className="font-ui font-semibold line-clamp-2">{e.title}</h3>
                <div className="text-xs text-warm-muted flex items-center gap-1 mt-2"><Calendar className="w-3 h-3" />{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {e.time}</div>
                <div className="text-xs text-warm-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{e.venue}</div>
                <div className="text-xs text-warm-muted flex items-center gap-1"><Users className="w-3 h-3" />{e.attendees}/{e.max}</div>
                <button onClick={() => setRegistered(e.id)} className="mt-3 w-full py-2 rounded-lg bg-primary text-white text-sm">Register</button>
              </div>
            </AnimatedCard>
          ))}
        </div>}
        {view === "list" && <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Event","Date","Venue","Status","Action"].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
            {EVENTS.map(e => <tr key={e.id} className="border-t border-warm hover:bg-sand"><td className="p-3 font-medium">{e.title}</td><td className="p-3">{e.date}</td><td className="p-3">{e.venue}</td><td className="p-3"><StatusBadge status={e.status} /></td><td className="p-3"><button onClick={()=>setRegistered(e.id)} className="text-primary text-xs">Register</button></td></tr>)}
          </tbody></table>
        </AnimatedCard>}
        {view === "calendar" && <AnimatedCard className="p-6"><div className="grid grid-cols-7 gap-2 text-xs">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=><div key={d} className="text-center font-semibold text-warm-muted">{d}</div>)}{Array.from({length:30}).map((_,i) => { const ev = EVENTS.find(e => new Date(e.date).getDate() === i+1); return <div key={i} className={`aspect-square border border-warm rounded-lg p-2 ${ev?"bg-primary/10 border-primary":""}`}><div>{i+1}</div>{ev && <div className="text-[9px] text-primary truncate mt-1">{ev.title}</div>}</div>; })}</div></AnimatedCard>}
        <Modal open={!!registered} onClose={() => setRegistered(null)} title="Registration confirmed!">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-teal/15 text-teal flex items-center justify-center text-3xl">✓</div>
            <p className="text-sm">Your registration has been confirmed. Show this QR at the venue.</p>
            <div className="w-40 h-40 mx-auto bg-white p-2 rounded-xl grid grid-cols-12 gap-px">{Array.from({length:144}).map((_,i)=><div key={i} className={Math.random()>0.5?"bg-foreground":""} />)}</div>
            <button onClick={() => setRegistered(null)} className="w-full py-2.5 rounded-lg bg-primary text-white">Done</button>
          </div>
        </Modal>
      </PageWrap>
    );
  },
});
