import { createFileRoute } from "@tanstack/react-router";
import { FileBarChart, Users, Calendar, HandHeart, Building2 } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";

export const Route = createFileRoute("/community-admin/reports")({
  component: () => (
    <PageWrap title="Reports" desc="Generate and export samaj reports">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[{i:Users,t:"Member Report"},{i:Calendar,t:"Event Report"},{i:HandHeart,t:"Donation Report"},{i:Building2,t:"Business Report"}].map(r => (
          <AnimatedCard key={r.t} className="p-5 text-center cursor-pointer">
            <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3"><r.i className="w-6 h-6" /></div>
            <h3 className="font-ui font-semibold text-sm">{r.t}</h3>
          </AnimatedCard>
        ))}
      </div>
      <AnimatedCard className="p-6">
        <div className="grid sm:grid-cols-3 gap-3 mb-5">
          <input type="date" className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
          <input type="date" className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
          <button className="px-4 py-2 rounded-lg bg-primary text-white text-sm">Generate</button>
        </div>
        <div className="border border-dashed border-warm rounded-xl p-8 text-center text-warm-muted text-sm"><FileBarChart className="w-12 h-12 mx-auto mb-2" />Select a report type and date range to preview.</div>
        <div className="flex gap-2 mt-4"><button className="px-4 py-2 rounded-lg border border-warm text-sm">Export PDF</button><button className="px-4 py-2 rounded-lg border border-warm text-sm">Export Excel</button><button className="px-4 py-2 rounded-lg border border-warm text-sm">Export CSV</button></div>
      </AnimatedCard>
    </PageWrap>
  ),
});
