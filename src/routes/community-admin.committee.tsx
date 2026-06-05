import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Phone, Mail } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, Modal } from "@/components/wag/primitives";
import { COMMITTEE } from "@/data/mock";

export const Route = createFileRoute("/community-admin/committee")({
  component: () => {
    const [open, setOpen] = useState(false);
    return (
      <PageWrap title="Committee" desc={`${COMMITTEE.length} active committee members`} action={<button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" />Add Member</button>}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {COMMITTEE.map(c => (
            <AnimatedCard key={c.id} className="p-5 text-center">
              <AvatarCircle name={c.name} src={c.photo} size={84} />
              <h3 className="font-ui font-semibold mt-3">{c.name}</h3>
              <select className="mt-1 text-xs px-2 py-0.5 rounded-full bg-gold-light text-gold border-0 outline-none font-semibold"><option>{c.designation}</option></select>
              <div className="text-xs text-warm-muted mt-2">Since {c.since}</div>
              <div className="flex justify-center gap-2 mt-3 text-warm-muted"><Phone className="w-4 h-4" /><Mail className="w-4 h-4" /></div>
              <button className="mt-3 text-xs text-red-500 flex items-center justify-center gap-1 mx-auto"><Trash2 className="w-3 h-3" />Remove</button>
            </AnimatedCard>
          ))}
        </div>
        <Modal open={open} onClose={() => setOpen(false)} title="Add committee member"><div className="space-y-3"><input placeholder="Name" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><select className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface">{["President","VP","Secretary","Treasurer","Member"].map(o=><option key={o}>{o}</option>)}</select><input placeholder="Phone" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><button onClick={()=>setOpen(false)} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium">Add</button></div></Modal>
      </PageWrap>
    );
  },
});
