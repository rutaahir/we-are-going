import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Calendar, Users, Heart, Cake, Briefcase, MapPin } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, PlanBadge, ProgressRing, StatCard, Reveal } from "@/components/wag/primitives";
import { EVENTS, MEMBERS, NEWS, NOTIFICATIONS, JOBS, MATRIMONY } from "@/data/mock";

export const Route = createFileRoute("/dashboard/")({
  component: () => {
    const { user } = useAuth();
    return (
      <PageWrap title={`Welcome back, ${user?.name.split(" ")[0]} 👋`} desc={user?.communityName + " · " + new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}>
        <div className="grid lg:grid-cols-3 gap-5 mb-6">
          <AnimatedCard className="p-6 lg:col-span-2 bg-gradient-to-br from-primary to-primary-dark text-white relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute right-20 top-4 w-24 h-24 rounded-full bg-gold/30" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-2"><PlanBadge plan={user?.plan || "Free"} /><span className="text-xs text-white/70">expires {new Date(user?.planExpiry || "").toLocaleDateString("en-IN")}</span></div>
              <h2 className="font-display text-3xl mt-2">Your samaj is buzzing today</h2>
              <p className="text-white/80 text-sm mt-2 max-w-md">3 events this week · 12 new members joined · 5 birthdays today</p>
              <div className="mt-5 flex gap-2"><Link to="/dashboard/events" className="px-4 py-2 rounded-lg bg-white text-primary text-sm font-medium">View events</Link><Link to="/dashboard/directory" className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm border border-white/20">Directory</Link></div>
            </div>
          </AnimatedCard>
          <AnimatedCard className="p-6 flex flex-col items-center justify-center text-center">
            <ProgressRing value={78} size={120} stroke={10} label="Complete" />
            <h3 className="font-ui font-semibold mt-3">Profile completion</h3>
            <p className="text-xs text-warm-muted mt-1">Add education to reach 100%</p>
            <Link to="/dashboard/profile" className="mt-3 px-4 py-1.5 rounded-lg border border-warm text-xs">Complete now</Link>
          </AnimatedCard>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={<Users />} label="Members in samaj" value={1240} accent="primary" />
          <StatCard icon={<Calendar />} label="Upcoming events" value={6} accent="gold" />
          <StatCard icon={<Bell />} label="Unread notifications" value={3} accent="teal" />
          <StatCard icon={<Heart />} label="Matrimony matches" value={12} accent="primary" />
        </div>
        <Reveal>
          <h3 className="font-ui font-semibold text-lg mb-4">Upcoming events</h3>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x">
            {EVENTS.slice(0, 4).map(e => (
              <AnimatedCard key={e.id} className="min-w-[280px] snap-start overflow-hidden">
                <img src={e.img} alt="" className="h-32 w-full object-cover" />
                <div className="p-4"><div className="text-xs text-warm-muted">{new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div><div className="font-ui font-semibold line-clamp-2 mt-1">{e.title}</div><div className="text-xs text-warm-muted flex items-center gap-1 mt-1"><MapPin className="w-3 h-3" />{e.venue}</div></div>
              </AnimatedCard>
            ))}
          </div>
        </Reveal>
        <div className="grid lg:grid-cols-2 gap-5 mt-8">
          <AnimatedCard className="p-5">
            <h3 className="font-ui font-semibold mb-3 flex items-center gap-2"><Cake className="w-4 h-4 text-pink-500" /> Birthdays this week</h3>
            <div className="space-y-2">{MEMBERS.slice(0, 5).map(m => (<div key={m.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-sand"><AvatarCircle name={m.name} src={m.avatar} size={36} /><div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{m.name}</div><div className="text-xs text-warm-muted">{m.village}</div></div><button className="text-xs text-primary">Wish 🎉</button></div>))}</div>
          </AnimatedCard>
          <AnimatedCard className="p-5">
            <h3 className="font-ui font-semibold mb-3">Recent announcements</h3>
            <div className="space-y-3">{NEWS.slice(0, 4).map(n => (<div key={n.id} className="flex gap-3"><img src={n.img} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" /><div className="min-w-0"><div className="font-medium text-sm line-clamp-1">{n.title}</div><div className="text-xs text-warm-muted line-clamp-2">{n.excerpt}</div></div></div>))}</div>
          </AnimatedCard>
        </div>
        <Reveal>
          <h3 className="font-ui font-semibold text-lg mt-8 mb-4">Job recommendations</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {JOBS.slice(0, 3).map(j => (
              <AnimatedCard key={j.id} className="p-5"><div className="flex gap-3"><div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold">{j.logo}</div><div><div className="font-ui font-semibold text-sm">{j.role}</div><div className="text-xs text-warm-muted">{j.company}</div></div></div><div className="text-xs text-warm-muted mt-3">{j.location} · {j.salary}</div><button className="mt-3 w-full py-2 rounded-lg bg-primary text-white text-xs">Apply</button></AnimatedCard>
            ))}
          </div>
        </Reveal>
        <Reveal>
          <h3 className="font-ui font-semibold text-lg mt-8 mb-4">Matrimony suggestions</h3>
          <div className="grid sm:grid-cols-3 gap-4">
            {MATRIMONY.slice(0, 3).map(m => (
              <AnimatedCard key={m.id} className="p-4 flex gap-3"><img src={m.photo} alt="" className="w-20 h-24 rounded-lg object-cover flex-shrink-0" /><div className="min-w-0"><div className="font-ui font-semibold text-sm">{m.name}, {m.age}</div><div className="text-xs text-warm-muted">{m.education}</div><div className="text-xs text-warm-muted">{m.location}</div><button className="text-xs text-gold mt-2">Show interest →</button></div></AnimatedCard>
            ))}
          </div>
        </Reveal>
      </PageWrap>
    );
  },
});
