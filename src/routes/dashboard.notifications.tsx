import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle, Cake, Briefcase, Calendar } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";
import { NOTIFICATIONS } from "@/data/mock";

const ICONS: any = { approval: CheckCircle, event: Calendar, birthday: Cake, job: Briefcase };

export const Route = createFileRoute("/dashboard/notifications")({
  component: () => {
    const [tab, setTab] = useState<string>("All");
    const tabs = ["All", "Approvals", "Events", "Birthdays", "Jobs"];
    const list = NOTIFICATIONS.filter(n => tab === "All" || n.type === tab.toLowerCase().slice(0, -1) || (tab === "Approvals" && n.type === "approval") || (tab === "Birthdays" && n.type === "birthday"));
    return (
      <PageWrap title="Notifications" action={<button className="px-4 py-2 rounded-lg border border-warm text-sm">Mark all read</button>}>
        <div className="flex gap-2 border-b border-warm mb-6 overflow-x-auto">{tabs.map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${tab===t?"border-primary text-primary":"border-transparent text-warm-muted"}`}>{t}</button>)}</div>
        <div className="space-y-2">
          {list.map(n => { const Icon = ICONS[n.type]; return (
            <AnimatedCard key={n.id} className="p-4 flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl bg-${n.color}-100 text-${n.color}-600 flex items-center justify-center flex-shrink-0`}><Icon className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h3 className="font-ui font-semibold text-sm">{n.title}</h3>{!n.read && <span className="w-2 h-2 rounded-full bg-primary" />}</div>
                <p className="text-xs text-warm-muted mt-0.5">{n.desc}</p>
                <div className="text-[10px] text-warm-muted mt-1">{n.time}</div>
              </div>
            </AnimatedCard>
          ); })}
        </div>
      </PageWrap>
    );
  },
});
