import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Building2, Users, IndianRupee, Calendar, AlertCircle, UserPlus, Loader2 } from "lucide-react";
import { AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend } from "recharts";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, StatCard, StatusBadge } from "@/components/wag/primitives";
import { api } from "@/lib/api";

const growth = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], communities: 320 + i*20, members: 80000 + i*4200 }));
const statesDataTemplate = [{ n: "Gujarat", v: 180, c: "#1B4FD8" }, { n: "Maharashtra", v: 120, c: "#C9860A" }, { n: "Rajasthan", v: 75, c: "#0D7377" }, { n: "Karnataka", v: 60, c: "#7C3AED" }, { n: "Others", v: 105, c: "#B45309" }];
const revenue = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], v: 180000 + Math.floor(Math.random()*80000) }));
const tt = { contentStyle: { background: "#FFFDF7", border: "1px solid #E2D9CC", borderRadius: 12, fontSize: 12 } };

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const [communities, setCommunities] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getCommunities(), api.getMembers()])
      .then(([cRes, mRes]) => {
        setCommunities(cRes || []);
        setMembers(mRes || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Dashboard fetch error", err);
        setLoading(false);
      });
  }, []);

  const totalRevenue = communities.reduce((acc, c) => {
    // mock revenue calc based on plan
    if (c.plan === "Premium") return acc + 10000;
    if (c.plan === "Standard") return acc + 5000;
    return acc;
  }, 0);

  const pendingRequests = communities.filter(c => c.status === "Pending Super Admin Approval" || c.status === "Pending").length;
  
  // dynamic states
  const stateCounts: Record<string, number> = {};
  communities.forEach(c => {
    if (c.state) {
      stateCounts[c.state] = (stateCounts[c.state] || 0) + 1;
    }
  });
  const dynamicStates = Object.entries(stateCounts)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 5)
    .map((e, i) => ({ n: e[0], v: e[1], c: ["#1B4FD8", "#C9860A", "#0D7377", "#7C3AED", "#B45309"][i] }));
  
  const statesToRender = dynamicStates.length > 0 ? dynamicStates : statesDataTemplate;

  if (loading) return (
    <PageWrap title="Platform Dashboard">
      <div className="flex justify-center items-center py-32"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>
    </PageWrap>
  );

  return (
    <PageWrap title="Platform Dashboard" desc={`Live across ${Object.keys(stateCounts).length || 22} states · India`}>
      {/* Global Super Admin Context Banner */}
      <AnimatedCard className="mb-8 p-5 bg-gradient-to-r from-primary/10 via-primary/5 to-accent/5 border border-primary/20 shadow-sm relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-gold/10 rounded-full blur-3xl"></div>
        <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold shadow-md border-2 border-white/50">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-ui font-bold text-xl text-foreground">Super Administrator</h2>
                <span className="bg-orange-500/10 text-orange-600 border border-orange-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">System</span>
              </div>
              <div className="text-sm text-warm-muted mt-1 font-medium">
                Managing Entire Community Network
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-primary/10 flex flex-col items-center shadow-sm">
              <span className="text-xl font-display font-bold text-primary">{communities.length}</span>
              <span className="text-[10px] uppercase text-warm-muted font-bold tracking-wider">Communities</span>
            </div>
            <div className="bg-white/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-gold/20 flex flex-col items-center shadow-sm">
              <span className="text-xl font-display font-bold text-gold">{members.length}</span>
              <span className="text-[10px] uppercase text-warm-muted font-bold tracking-wider">Members</span>
            </div>
          </div>
        </div>
      </AnimatedCard>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        <StatCard icon={<Building2 />} label="Super Communities" value={communities.filter(c => c.type === "Super" || c.type === "Super Community").length} accent="primary" />
        <StatCard icon={<Building2 />} label="Subsidiary Communities" value={communities.filter(c => c.type === "Subsidiary" || c.type === "Subsidiary Community").length} accent="teal" />
        <StatCard icon={<Building2 />} label="Total Communities" value={communities.length} accent="primary" />
        <StatCard icon={<Users />} label="Total Members" value={members.length} accent="gold" />
        <StatCard icon={<AlertCircle />} label="Pending Requests" value={pendingRequests} accent="gold" />
        <StatCard icon={<IndianRupee />} label="Revenue (₹)" value={totalRevenue || 248000} accent="teal" />
      </div>
      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <AnimatedCard className="p-5 lg:col-span-2 overflow-hidden"><h3 className="font-ui font-semibold mb-3">Platform growth (12 months)</h3><div className="h-72 -ml-6"><ResponsiveContainer><AreaChart data={growth}><defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.46 0.21 265)" stopOpacity={0.4}/><stop offset="95%" stopColor="oklch(0.46 0.21 265)" stopOpacity={0}/></linearGradient><linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="oklch(0.68 0.14 75)" stopOpacity={0.4}/><stop offset="95%" stopColor="oklch(0.68 0.14 75)" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#E2D9CC" strokeDasharray="3 3" /><XAxis dataKey="m" stroke="#6B5E4E" fontSize={11} /><YAxis yAxisId="left" stroke="#6B5E4E" fontSize={11} /><YAxis yAxisId="right" orientation="right" stroke="#6B5E4E" fontSize={11} /><Tooltip {...tt} /><Legend /><Area yAxisId="left" type="monotone" dataKey="communities" stroke="oklch(0.46 0.21 265)" fillOpacity={1} fill="url(#g1)" /><Area yAxisId="right" type="monotone" dataKey="members" stroke="oklch(0.68 0.14 75)" fillOpacity={1} fill="url(#g2)" /></AreaChart></ResponsiveContainer></div></AnimatedCard>
        <AnimatedCard className="p-5"><h3 className="font-ui font-semibold mb-3">Communities by state</h3><div className="h-72"><ResponsiveContainer><PieChart><Pie data={statesToRender} dataKey="v" nameKey="n" cx="50%" cy="50%" outerRadius={90} label={(e: any) => e.n}>{statesToRender.map((s, i) => <Cell key={i} fill={s.c} />)}</Pie><Tooltip {...tt} /></PieChart></ResponsiveContainer></div></AnimatedCard>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <AnimatedCard className="p-5"><h3 className="font-ui font-semibold mb-4">Top 5 communities by members</h3><div className="space-y-4">{communities.sort((a,b)=>((b as any).members ?? (b as any).member_count ?? 0)-((a as any).members ?? (a as any).member_count ?? 0)).slice(0,5).map((c, i) => <div key={c.id} className="flex items-center gap-3"><span className="text-2xl font-display text-gold w-6">{i+1}</span><img src={c.logo || c.logo_url || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=120"} className="w-10 h-10 rounded-full object-cover border border-warm" /><div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{c.name}</div><div className="text-xs text-warm-muted">{c.state || "N/A"}</div></div><div className="text-sm font-semibold">{((c as any).members ?? (c as any).member_count ?? 0).toLocaleString()}</div></div>)}</div></AnimatedCard>
        <AnimatedCard className="p-5"><h3 className="font-ui font-semibold mb-4">Recent registrations</h3><div className="space-y-4">{members.slice(0,6).map(m => <div key={m.id} className="flex items-center gap-3"><AvatarCircle name={m.name} src={m.avatar} size={36} /><div className="flex-1 min-w-0"><div className="font-medium text-sm truncate">{m.name}</div><div className="text-xs text-warm-muted">{m.community_name || "N/A"}</div></div><StatusBadge status={m.status} /></div>)}</div></AnimatedCard>
      </div>
    </PageWrap>
  );
}
