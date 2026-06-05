import { createFileRoute } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatCard, StatusBadge } from "@/components/wag/primitives";
import { EVENTS } from "@/data/mock";
import { Calendar, Users, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/admin/events")({
  component: () => (
    <PageWrap title="Platform Events" desc="All events across communities">
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<Calendar />} label="Total events" value={2400} accent="primary" />
        <StatCard icon={<Users />} label="Total attendees" value={184000} accent="gold" />
        <StatCard icon={<CheckCircle />} label="Completed" value={1820} accent="teal" />
      </div>
      <div className="flex gap-3 mb-4"><select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All communities</option></select><select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All types</option></select></div>
      <AnimatedCard className="overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Event","Community","Type","Date","Status","Feature"].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
          {EVENTS.map(e => <tr key={e.id} className="border-t border-warm hover:bg-sand"><td className="p-3 font-medium">{e.title}</td><td className="p-3 text-xs">Rampara Ahir Samaj</td><td className="p-3 text-xs">{e.type}</td><td className="p-3 text-xs">{e.date}</td><td className="p-3"><StatusBadge status={e.status} /></td><td className="p-3"><button className="text-gold"><Star className="w-4 h-4" /></button></td></tr>)}
        </tbody></table>
      </AnimatedCard>
    </PageWrap>
  ),
});
