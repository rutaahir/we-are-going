import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatusBadge } from "@/components/wag/primitives";
import { JOBS, BUSINESSES } from "@/data/mock";

export const Route = createFileRoute("/admin/jobs-businesses")({
  component: () => {
    const [tab, setTab] = useState<"Jobs"|"Businesses">("Jobs");
    return (
      <PageWrap title="Jobs & Businesses" desc="Moderation across the platform">
        <div className="flex gap-2 border-b border-warm mb-6">{(["Jobs","Businesses"] as const).map(t => <button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab===t?"border-primary text-primary":"border-transparent text-warm-muted"}`}>{t}</button>)}</div>
        {tab === "Jobs" ? (
          <AnimatedCard className="overflow-hidden"><table className="w-full text-sm"><thead className="bg-sand"><tr>{["Role","Company","Location","Applicants",""].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>{JOBS.map(j => <tr key={j.id} className="border-t border-warm hover:bg-sand"><td className="p-3 font-medium">{j.role}</td><td className="p-3 text-xs">{j.company}</td><td className="p-3 text-xs">{j.location}</td><td className="p-3 text-xs">{j.applicants}</td><td className="p-3 space-x-1 text-xs"><button className="text-teal">Verify</button> <button className="text-gold">Feature</button> <button className="text-red-500">Remove</button></td></tr>)}</tbody></table></AnimatedCard>
        ) : (
          <AnimatedCard className="overflow-hidden"><table className="w-full text-sm"><thead className="bg-sand"><tr>{["Business","Category","Owner","Status",""].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>{BUSINESSES.map(b => <tr key={b.id} className="border-t border-warm hover:bg-sand"><td className="p-3 flex items-center gap-2"><img src={b.img} className="w-8 h-8 rounded-lg object-cover" />{b.name}</td><td className="p-3 text-xs">{b.category}</td><td className="p-3 text-xs">{b.owner}</td><td className="p-3"><StatusBadge status={b.verified?"Verified":"Pending"} /></td><td className="p-3 space-x-1 text-xs"><button className="text-teal">Verify</button> <button className="text-gold">Feature</button> <button className="text-red-500">Remove</button></td></tr>)}</tbody></table></AnimatedCard>
        )}
      </PageWrap>
    );
  },
});
