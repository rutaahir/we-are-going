import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Heart, GraduationCap, Briefcase, MapPin } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatusBadge } from "@/components/wag/primitives";
import { MATRIMONY } from "@/data/mock";

export const Route = createFileRoute("/dashboard/matrimony")({
  component: () => {
    const [tab, setTab] = useState<"Browse" | "Sent" | "Received">("Browse");
    const [age, setAge] = useState([20, 35]);
    const list = MATRIMONY;
    return (
      <PageWrap title="Matrimony" desc="Curated matches within your samaj">
        <div className="flex gap-2 border-b border-warm mb-6">{(["Browse","Sent","Received"] as const).map(t => <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab===t?"border-primary text-primary":"border-transparent text-warm-muted"}`}>{t} interests</button>)}</div>
        <div className="grid lg:grid-cols-[260px_1fr] gap-6">
          <AnimatedCard className="p-5 h-fit">
            <h3 className="font-ui font-semibold mb-4">Filters</h3>
            <div className="space-y-4 text-sm">
              <div><label className="block mb-1">Age: {age[0]} - {age[1]}</label><input type="range" min={18} max={50} value={age[1]} onChange={e=>setAge([age[0], +e.target.value])} className="w-full accent-primary" /></div>
              <div><label className="block mb-1">Education</label><select className="w-full px-3 py-2 rounded-lg border border-warm bg-surface"><option>Any</option><option>B.Tech</option><option>MBA</option></select></div>
              <div><label className="block mb-1">Occupation</label><select className="w-full px-3 py-2 rounded-lg border border-warm bg-surface"><option>Any</option></select></div>
              <div><label className="block mb-1">Location</label><select className="w-full px-3 py-2 rounded-lg border border-warm bg-surface"><option>Any</option></select></div>
              <button className="w-full py-2 rounded-lg bg-primary text-white text-sm">Apply</button>
            </div>
          </AnimatedCard>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
            {list.map(p => (
              <AnimatedCard key={p.id} className="overflow-hidden">
                <div className="aspect-[4/5] relative">
                  <img src={p.photo} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                  <div className="absolute top-3 left-3 bg-surface/95 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold border-2 border-gold text-gold">{p.match}%</div>
                  <div className="absolute top-3 right-3"><StatusBadge status={p.status} /></div>
                </div>
                <div className="p-4">
                  <div className="font-ui font-semibold">{p.name}, {p.age}</div>
                  <div className="text-xs text-warm-muted flex items-center gap-1 mt-1"><GraduationCap className="w-3 h-3" />{p.education}</div>
                  <div className="text-xs text-warm-muted flex items-center gap-1"><Briefcase className="w-3 h-3" />{p.profession}</div>
                  <div className="text-xs text-warm-muted flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</div>
                  <button className="mt-3 w-full py-2 rounded-lg bg-gold text-white text-xs font-medium flex items-center justify-center gap-1"><Heart className="w-3 h-3" /> Show Interest</button>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </div>
      </PageWrap>
    );
  },
});
