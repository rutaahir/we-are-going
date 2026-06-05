import { createFileRoute } from "@tanstack/react-router";
import { Building2, Users, IndianRupee, Calendar, AlertCircle, UserPlus } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, StatCard, StatusBadge } from "@/components/wag/primitives";
import { COMMUNITIES, MEMBERS } from "@/data/mock";

const growth = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], communities: 320 + i*20, members: 800000 + i*42000 }));
const states = [{ n: "Gujarat", v: 180, c: "#1B4FD8" }, { n: "Maharashtra", v: 120, c: "#C9860A" }, { n: "Rajasthan", v: 75, c: "#0D7377" }, { n: "Karnataka", v: 60, c: "#7C3AED" }, { n: "Others", v: 105, c: "#B45309" }];
const revenue = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], v: 1800000 + Math.floor(Math.random()*800000) }));
const tt = { contentStyle: { background: "#FFFDF7", border: "1px solid #E2D9CC", borderRadius: 12, fontSize: 12 } };

export const Route = createFileRoute("/admin/")({
  component: () => (
    <PageWrap title="Platform Dashboard" desc="Live across 22 states · India">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard icon={<Building2 />} label="Communities" value={540} accent="primary" />
        <StatCard icon={<Users />} label="Members" value={1240000} accent="gold" />
        <StatCard icon={<IndianRupee />} label="Revenue (₹)" value={24800000} accent="teal" />
        <StatCard icon={<Calendar />} label="Active Events" value={2400} accent="primary" />
        <StatCard icon={<AlertCircle />} label="Pending" value={48} accent="gold" />
        <StatCard icon={<UserPlus />} label="New Today" value={184} accent="teal" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <AnimatedCard className="p-5 lg:col-span-2"><h3 className="font-ui font-semibold mb-3">Platform growth (12 months)</h3><div className="h-72"><ResponsiveContainer><AreaChart data={growth}><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.46 0.21 265)" stopOpacity={0.4}/><stop offset="95%" stopColor="oklch(0.46 0.21 265)" stopOpacity={0}/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.68 0.14 75)" stopOpacity={0.4}/><stop offset="95%" stopColor="oklch(0.68 0.14 75)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#E2D9CC" strokeDasharray="3 3" /><XAxis dataKey="m" stroke="#6B5E4E" fontSize={11} /><YAxis yAxisId="left" stroke="#6B5E4E" fontSize={11} /><YAxis yAxisId="right" orientation="right" stroke="#6B5E4E" fontSize={11} /><Tooltip {...tt} /><Legend /><Area yAxisId="left" type="monotone" dataKey="communities" stroke="oklch(0.46 0.21 265)" fillOpacity={1} fill="url(#g1)" /><Area yAxisId="right" type="monotone" dataKey="members" stroke="oklch(0.68 0.14 75)" fillOpacity={1} fill="url(#g2)" /></AreaChart></ResponsiveContainer></div></AnimatedCard>
        <AnimatedCard className="p-5"><h3 className="font-ui font-semibold mb-3">Communities by state</h3><div className="h-72"><ResponsiveContainer><PieChart><Pie data={states} dataKey="v" nameKey="n" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.n}>{states.map((s, i) => <Cell key={i} fill={s.c} />)}</Pie><Tooltip {...tt} /></PieChart></ResponsiveContainer></div></AnimatedCard>
      </div>
      <AnimatedCard className="p-5 mb-6"><h3 className="font-ui font-semibold mb-3">Subscription revenue (₹)</h3><div className="h-64"><ResponsiveContainer><BarChart data={revenue}><CartesianGrid stroke="#E2D9CC" strokeDasharray="3 3" /><XAxis dataKey="m" stroke="#6B5E4E" fontSize={11} /><YAxis stroke="#6B5E4E" fontSize={11} /><Tooltip {...tt} /><Bar dataKey="v" fill="oklch(0.46 0.21 265)" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div></AnimatedCard>
      <div className="grid lg:grid-cols-2 gap-5">
        <AnimatedCard className="p-5"><h3 className="font-ui font-semibold mb-3">Top 5 communities by members</h3><div className="space-y-2">{COMMUNITIES.sort((a,b)=>((b as any).members ?? (b as any).member_count ?? 0)-((a as any).members ?? (a as any).member_count ?? 0)).slice(0,5).map((c, i) => <div key={c.id} className="flex items-center gap-3"><span className="text-2xl font-display text-gold w-6">{i+1}</span><img src={c.logo} className="w-10 h-10 rounded-full object-cover" /><div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{c.name}</div><div className="text-xs text-warm-muted">{c.state}</div></div><div className="text-sm font-semibold">{((c as any).members ?? (c as any).member_count ?? 0).toLocaleString()}</div></div>)}</div></AnimatedCard>
        <AnimatedCard className="p-5"><h3 className="font-ui font-semibold mb-3">Recent registrations</h3><div className="space-y-2">{MEMBERS.slice(0,6).map(m => <div key={m.id} className="flex items-center gap-3"><AvatarCircle name={m.name} src={m.avatar} size={36} /><div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{m.name}</div><div className="text-xs text-warm-muted">{m.community}</div></div><StatusBadge status={m.status} /></div>)}</div></AnimatedCard>
      </div>
    </PageWrap>
  ),
});
