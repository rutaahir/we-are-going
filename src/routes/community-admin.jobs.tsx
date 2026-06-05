import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal } from "@/components/wag/primitives";
import { JOBS } from "@/data/mock";

export const Route = createFileRoute("/community-admin/jobs")({
  component: () => {
    const [open, setOpen] = useState(false);
    return (
      <PageWrap title="Jobs posted by samaj" action={<button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" />Post Job</button>}>
        <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Role","Company","Applicants","Type","Status"].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
            {JOBS.slice(0, 8).map(j => <tr key={j.id} className="border-t border-warm hover:bg-sand"><td className="p-3 font-medium">{j.role}</td><td className="p-3">{j.company}</td><td className="p-3"><span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">{j.applicants}</span></td><td className="p-3 text-xs">{j.type}</td><td className="p-3"><label className="inline-flex items-center gap-1 text-xs"><input type="checkbox" defaultChecked className="accent-primary" />Open</label></td></tr>)}
          </tbody></table>
        </AnimatedCard>
        <Modal open={open} onClose={() => setOpen(false)} title="Post Job"><div className="space-y-3"><input placeholder="Role" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><input placeholder="Company" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><input placeholder="Salary range" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><select className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface"><option>Full-time</option><option>Part-time</option><option>Internship</option></select><button onClick={()=>setOpen(false)} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium">Post</button></div></Modal>
      </PageWrap>
    );
  },
});
