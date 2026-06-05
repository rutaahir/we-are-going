import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Edit, Trash2, Plus } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";
import { NEWS } from "@/data/mock";

export const Route = createFileRoute("/community-admin/news")({
  component: () => {
    const [show, setShow] = useState(false);
    return (
      <PageWrap title="News & Announcements" action={<button onClick={() => setShow(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-2"><Plus className="w-4 h-4" />New Post</button>}>
        {show && <AnimatedCard className="p-5 mb-6"><div className="space-y-3"><input placeholder="Title" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><select className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface">{["Meeting Notice","Achievement","Alert","General"].map(o=><option key={o}>{o}</option>)}</select><textarea rows={4} placeholder="Content" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" /><div className="flex gap-2"><button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm">Publish</button><button onClick={() => setShow(false)} className="px-4 py-2 rounded-lg border border-warm text-sm">Cancel</button></div></div></AnimatedCard>}
        <div className="grid md:grid-cols-2 gap-5">
          {NEWS.map(n => (
            <AnimatedCard key={n.id} className="overflow-hidden">
              <img src={n.img} alt="" className="h-40 w-full object-cover" />
              <div className="p-5"><div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-wider bg-gold-light text-gold px-2 py-0.5 rounded-full">{n.category}</span><span className="text-xs text-warm-muted">{n.date}</span></div>
                <h3 className="font-ui font-semibold mt-2">{n.title}</h3>
                <p className="text-sm text-warm-muted mt-1 line-clamp-2">{n.excerpt}</p>
                <div className="flex gap-2 mt-3"><button className="text-xs flex items-center gap-1 text-primary"><Edit className="w-3 h-3" />Edit</button><button className="text-xs flex items-center gap-1 text-red-500"><Trash2 className="w-3 h-3" />Delete</button></div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      </PageWrap>
    );
  },
});
