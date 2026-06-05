import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatCard } from "@/components/wag/primitives";
import { Download, FileBarChart, Users, IndianRupee, Calendar, Building2, FileSpreadsheet, FileText } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";

const tt = { contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 } };
const memberGrowth = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], joined: 4200 + Math.floor(Math.random()*2400), left: 600 + Math.floor(Math.random()*400) }));
const revBy = [{ n: "Subscriptions", v: 28000000, c: "var(--primary)" }, { n: "Advertisements", v: 9800000, c: "var(--gold)" }, { n: "Donations Fee", v: 4200000, c: "var(--teal)" }, { n: "Event Tickets", v: 1900000, c: "#7C3AED" }];
const engage = Array.from({ length: 7 }, (_, i) => ({ d: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], dau: 22000 + Math.floor(Math.random()*8000), posts: 1400 + Math.floor(Math.random()*600) }));
const topComm = Array.from({ length: 10 }, (_, i) => ({ n: ["Patel Samaj","Brahma Samaj","Lohana Samaj","Jain Sangh","Modh Samaj","Vania Samaj","Rajput Samaj","Marwadi Samaj","Kshatriya Samaj","Agarwal Samaj"][i], m: 92000 - i*7200 }));

const REPORTS = [
  { title: "Member registrations", desc: "Daily, weekly, monthly signups by community and state", icon: Users },
  { title: "Revenue breakdown", desc: "Subscription, ads and donation revenue with trends", icon: IndianRupee },
  { title: "Event participation", desc: "Attendance rates and RSVPs by community", icon: Calendar },
  { title: "Community growth", desc: "Member count over time by community", icon: Building2 },
  { title: "Donation flow", desc: "Campaign performance with donor segmentation", icon: IndianRupee },
  { title: "Plan distribution", desc: "Active subscribers by plan tier and churn", icon: FileBarChart },
];

function Body() {
  const [range, setRange] = useState("12m");
  return (
    <PageWrap title="Reports & Analytics" desc="Platform-wide insights and exportable reports" action={
      <div className="flex gap-2">
        <select value={range} onChange={e => setRange(e.target.value)} className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm">
          <option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="3m">Last 3 months</option><option value="12m">Last 12 months</option>
        </select>
        <button className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow-sapphire"><Download className="w-4 h-4" /> Export</button>
      </div>
    }>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={<Users />} label="Total members" value={1240000} accent="primary" />
        <StatCard icon={<Building2 />} label="Communities" value={540} accent="gold" />
        <StatCard icon={<IndianRupee />} label="Revenue (₹)" value={43900000} accent="teal" />
        <StatCard icon={<Calendar />} label="Events held" value={8400} accent="primary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        <AnimatedCard className="p-5 lg:col-span-2">
          <h3 className="font-ui font-semibold mb-3">Member growth vs churn</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <AreaChart data={memberGrowth}>
                <defs>
                  <linearGradient id="rj" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--primary)" stopOpacity={0} /></linearGradient>
                  <linearGradient id="rl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--gold)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--gold)" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                <Tooltip {...tt} /><Legend />
                <Area type="monotone" dataKey="joined" stroke="var(--primary)" fill="url(#rj)" />
                <Area type="monotone" dataKey="left" stroke="var(--gold)" fill="url(#rl)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>
        <AnimatedCard className="p-5">
          <h3 className="font-ui font-semibold mb-3">Revenue by source</h3>
          <div className="h-72">
            <ResponsiveContainer>
              <PieChart><Pie data={revBy} dataKey="v" nameKey="n" innerRadius={50} outerRadius={95} paddingAngle={3}>{revBy.map((r,i) => <Cell key={i} fill={r.c} />)}</Pie><Tooltip {...tt} /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 space-y-1 text-xs">
            {revBy.map(r => <div key={r.n} className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: r.c }} /><span className="flex-1">{r.n}</span><span className="font-semibold">₹{(r.v/100000).toFixed(1)}L</span></div>)}
          </div>
        </AnimatedCard>
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mb-6">
        <AnimatedCard className="p-5">
          <h3 className="font-ui font-semibold mb-3">Weekly engagement</h3>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={engage}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} /><YAxis stroke="var(--muted-foreground)" fontSize={11} /><Tooltip {...tt} /><Legend /><Bar dataKey="dau" fill="var(--primary)" radius={[6,6,0,0]} name="DAU" /><Bar dataKey="posts" fill="var(--gold)" radius={[6,6,0,0]} name="Posts" /></BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>
        <AnimatedCard className="p-5">
          <h3 className="font-ui font-semibold mb-3">Top communities by members</h3>
          <div className="h-60">
            <ResponsiveContainer>
              <BarChart data={topComm} layout="vertical"><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} /><YAxis dataKey="n" type="category" stroke="var(--muted-foreground)" fontSize={10} width={100} /><Tooltip {...tt} /><Bar dataKey="m" fill="var(--teal)" radius={[0,6,6,0]} /></BarChart>
            </ResponsiveContainer>
          </div>
        </AnimatedCard>
      </div>

      <h3 className="font-ui font-semibold text-lg mb-3">Saved reports</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {REPORTS.map(r => {
          const I = r.icon;
          return (
            <AnimatedCard key={r.title} className="p-5">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><I className="w-5 h-5" /></div>
              <h4 className="font-ui font-semibold mt-3">{r.title}</h4>
              <p className="text-xs text-warm-muted mt-1">{r.desc}</p>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-warm text-xs font-medium hover:bg-sand"><FileSpreadsheet className="w-3.5 h-3.5" /> Excel</button>
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-warm text-xs font-medium hover:bg-sand"><FileText className="w-3.5 h-3.5" /> PDF</button>
                <button className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-warm text-xs font-medium hover:bg-sand">CSV</button>
              </div>
            </AnimatedCard>
          );
        })}
      </div>
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/reports")({ component: Body });
