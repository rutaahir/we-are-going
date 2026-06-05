import { createFileRoute } from "@tanstack/react-router";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle } from "@/components/wag/primitives";
import { COMMITTEE, COMMUNITIES } from "@/data/mock";

export const Route = createFileRoute("/admin/committee")({
  component: () => (
    <PageWrap title="Platform Committee" desc="All committee members across communities">
      <div className="flex gap-3 mb-4"><select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All communities</option>{COMMUNITIES.map(c => <option key={c.id}>{c.name}</option>)}</select></div>
      <AnimatedCard className="overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Member","Community","Designation","Since","Phone",""].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
          {COMMITTEE.map((c, i) => <tr key={c.id} className="border-t border-warm hover:bg-sand"><td className="p-3 flex items-center gap-2"><AvatarCircle name={c.name} src={c.photo} size={32} />{c.name}</td><td className="p-3 text-xs">{COMMUNITIES[i % COMMUNITIES.length].name}</td><td className="p-3"><span className="text-xs px-2 py-0.5 rounded-full bg-gold-light text-gold font-medium">{c.designation}</span></td><td className="p-3 text-xs">{c.since}</td><td className="p-3 text-xs">{c.phone}</td><td className="p-3"><button className="text-primary text-xs">View</button></td></tr>)}
        </tbody></table>
      </AnimatedCard>
    </PageWrap>
  ),
});
