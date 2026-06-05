import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatusBadge } from "@/components/wag/primitives";
import { BUSINESSES } from "@/data/mock";

export const Route = createFileRoute("/community-admin/businesses")({
  component: () => {
    const [open, setOpen] = useState(false);
    return (
      <PageWrap title="Businesses" desc="Samaj business directory" action={<button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" />Add Business</button>}>
        <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Business","Category","Owner","Status","Actions"].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
            {BUSINESSES.map(b => <tr key={b.id} className="border-t border-warm hover:bg-sand"><td className="p-3 flex items-center gap-2"><img src={b.img} className="w-10 h-10 rounded-lg object-cover" />{b.name}</td><td className="p-3 text-xs">{b.category}</td><td className="p-3">{b.owner}</td><td className="p-3"><StatusBadge status={b.verified?"Verified":"Pending"} /></td><td className="p-3 space-x-1"><button className="text-xs text-teal">Verify</button> <button className="text-xs text-red-500">Suspend</button></td></tr>)}
          </tbody></table>
        </AnimatedCard>
        <Modal open={open} onClose={() => setOpen(false)} title="Add Business"><div className="space-y-3"><input placeholder="Business name" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><input placeholder="Category" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><input placeholder="Owner" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><button onClick={()=>setOpen(false)} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium">Add</button></div></Modal>
      </PageWrap>
    );
  },
});
