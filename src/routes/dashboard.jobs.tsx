import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, IndianRupee, Building2, Bookmark, Search } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatusBadge } from "@/components/wag/primitives";
import { JOBS } from "@/data/mock";

export const Route = createFileRoute("/dashboard/jobs")({
  component: () => {
    const [tab, setTab] = useState<"All" | "Applied" | "Saved">("All");
    return (
      <PageWrap title="Job Portal" desc="Opportunities from samaj businesses">
        <div className="flex gap-2 border-b border-warm mb-6">{(["All","Applied","Saved"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab===t?"border-primary text-primary":"border-transparent text-warm-muted"}`}>{t}</button>)}</div>
        <div className="grid sm:grid-cols-4 gap-3 mb-6">
          <div className="relative col-span-2"><Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" /><input placeholder="Search jobs" className="w-full pl-9 pr-3 py-2 rounded-lg border border-warm bg-surface" /></div>
          <select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>Location</option></select>
          <select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>Type</option></select>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {JOBS.map(j => (
            <AnimatedCard key={j.id} className="p-5">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-lg flex-shrink-0">{j.logo}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-ui font-semibold">{j.role}</h3>
                  <div className="text-xs text-warm-muted flex items-center gap-1"><Building2 className="w-3 h-3" />{j.company}</div>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-warm-muted">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{j.location}</span>
                    <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" />{j.salary}</span>
                    <StatusBadge status={j.type === "Internship" ? "Open" : "Open"} />
                  </div>
                  <p className="text-xs text-warm-muted mt-2 line-clamp-2">{j.desc}</p>
                  <div className="flex items-center justify-between mt-3"><span className="text-xs text-warm-muted">{j.posted}</span><div className="flex gap-2"><button className="p-2 rounded-lg border border-warm"><Bookmark className="w-3 h-3" /></button><button className="px-4 py-2 rounded-lg bg-primary text-white text-xs">Apply</button></div></div>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </PageWrap>
    );
  },
});
