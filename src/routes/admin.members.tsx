import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, StatusBadge } from "@/components/wag/primitives";
import { MEMBERS } from "@/data/mock";

export const Route = createFileRoute("/admin/members")({
  component: () => (
    <PageWrap title="Platform Members" desc={`${MEMBERS.length} members across 540 communities`}>
      <div className="flex flex-wrap gap-3 mb-4"><div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" /><input placeholder="Search by name, phone…" className="w-full pl-9 pr-3 py-2 rounded-lg border border-warm bg-surface" /></div><select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All states</option></select><select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All communities</option></select><select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>All plans</option></select></div>
      <AnimatedCard className="overflow-hidden">
        <table className="w-full text-sm"><thead className="bg-sand"><tr>{["Member","Community","Profession","Status","Joined","Actions"].map(h=><th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>)}</tr></thead><tbody>
          {MEMBERS.map(m => <tr key={m.id} className="border-t border-warm hover:bg-sand"><td className="p-3 flex items-center gap-2"><AvatarCircle name={m.name} src={m.avatar} size={32} />{m.name}</td><td className="p-3 text-xs">{m.community}</td><td className="p-3 text-xs">{m.profession}</td><td className="p-3"><StatusBadge status={m.status} /></td><td className="p-3 text-xs">{m.joinedDate}</td><td className="p-3 space-x-1 text-xs"><button className="text-primary">Edit</button> <button className="text-red-500">Suspend</button></td></tr>)}
        </tbody></table>
      </AnimatedCard>
    </PageWrap>
  ),
});
