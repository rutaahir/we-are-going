import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Edit, Trash2, Users } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatusBadge } from "@/components/wag/primitives";
import { EVENTS } from "@/data/mock";

export const Route = createFileRoute("/community-admin/events")({
  component: () => {
    const [open, setOpen] = useState(false);
    return (
      <PageWrap title="Events" action={<button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" />Create Event</button>}>
        <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Event","Type","Date","Attendees","Status",""].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
            {EVENTS.map(e => <tr key={e.id} className="border-t border-warm hover:bg-sand"><td className="p-3 flex items-center gap-2"><img src={e.img} className="w-10 h-10 rounded-lg object-cover" />{e.title}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gold-light text-gold">{e.type}</span></td><td className="p-3">{e.date}</td><td className="p-3 flex items-center gap-1"><Users className="w-3 h-3" />{e.attendees}/{e.max}</td><td className="p-3"><StatusBadge status={e.status} /></td><td className="p-3 flex gap-1"><button className="p-1 hover:bg-warm rounded"><Edit className="w-3 h-3" /></button><button className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 className="w-3 h-3" /></button></td></tr>)}
          </tbody></table>
        </AnimatedCard>
        <Modal open={open} onClose={() => setOpen(false)} title="Create Event" size="lg">
          <div className="grid sm:grid-cols-2 gap-3">
            <input placeholder="Event title" className="sm:col-span-2 w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
            <select className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface">{["Meeting","Sammelan","Sports","Marriage","Blood Donation"].map(o=><option key={o}>{o}</option>)}</select>
            <input type="date" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
            <input placeholder="Venue" className="sm:col-span-2 w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
            <textarea rows={3} placeholder="Description" className="sm:col-span-2 w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
            <input type="number" placeholder="Max capacity" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
            <button onClick={()=>setOpen(false)} className="sm:col-span-2 w-full py-2.5 rounded-lg bg-primary text-white font-medium">Create Event</button>
          </div>
        </Modal>
      </PageWrap>
    );
  },
});
