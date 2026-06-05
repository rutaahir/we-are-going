import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Pause, Trash2 } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatusBadge } from "@/components/wag/primitives";
import { ADVERTISEMENTS } from "@/data/mock";

export const Route = createFileRoute("/admin/advertisements")({
  component: () => {
    const [open, setOpen] = useState(false);
    return (
      <PageWrap title="Advertisements" desc="Manage ad slots and active campaigns" action={<button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" />Add Ad</button>}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
          {ADVERTISEMENTS.map(a => (
            <AnimatedCard key={a.id} className="overflow-hidden">
              <div className="h-32 bg-sand relative">{a.image ? <img src={a.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-warm-muted text-sm">Empty slot</div>}<div className="absolute top-2 right-2"><StatusBadge status={a.status} /></div></div>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-gold font-semibold">{a.slot}</div>
                <div className="font-ui font-semibold mt-1">{a.advertiser}</div>
                {a.start && <div className="text-xs text-warm-muted">{a.start} → {a.end}</div>}
                <div className="flex gap-2 mt-3"><button className="text-xs flex items-center gap-1 text-primary"><Edit className="w-3 h-3" />Edit</button><button className="text-xs flex items-center gap-1 text-amber-600"><Pause className="w-3 h-3" />Pause</button><button className="text-xs flex items-center gap-1 text-red-500"><Trash2 className="w-3 h-3" />Delete</button></div>
              </div>
            </AnimatedCard>
          ))}
        </div>
        <AnimatedCard className="p-5">
          <h3 className="font-ui font-semibold mb-3">Slot schedule timeline</h3>
          <div className="space-y-3">{ADVERTISEMENTS.filter(a=>a.start).map(a => (<div key={a.id}><div className="flex justify-between text-xs mb-1"><span className="font-medium">{a.slot}</span><span className="text-warm-muted">{a.advertiser}</span></div><div className="h-6 bg-sand rounded relative overflow-hidden"><div className="absolute h-full bg-gradient-to-r from-primary to-gold rounded" style={{ left: `${(a.priority - 1) * 12}%`, width: "32%" }} /></div></div>))}</div>
        </AnimatedCard>
        <Modal open={open} onClose={() => setOpen(false)} title="Add Advertisement"><div className="space-y-3"><select className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface">{ADVERTISEMENTS.map(a => <option key={a.id}>{a.slot}</option>)}</select><input placeholder="Advertiser" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><input placeholder="Destination URL" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><div className="grid grid-cols-2 gap-2"><input type="date" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><input type="date" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /></div><button onClick={()=>setOpen(false)} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium">Create</button></div></Modal>
      </PageWrap>
    );
  },
});
