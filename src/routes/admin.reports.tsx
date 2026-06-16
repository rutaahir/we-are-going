import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatCard } from "@/components/wag/primitives";
import { Download, FileBarChart, Users, IndianRupee, Calendar, Building2, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell, Legend } from "recharts";
import api from "@/lib/api";

const tt = { contentStyle: { background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 } };
const memberGrowth = Array.from({ length: 12 }, (_, i) => ({ m: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i], joined: 42 + Math.floor(Math.random()*24), left: 6 + Math.floor(Math.random()*4) }));
const revBy = [{ n: "Subscriptions", v: 280000, c: "var(--primary)" }, { n: "Advertisements", v: 98000, c: "var(--gold)" }, { n: "Donations Fee", v: 42000, c: "var(--teal)" }, { n: "Event Tickets", v: 19000, c: "#7C3AED" }];
const engage = Array.from({ length: 7 }, (_, i) => ({ d: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i], dau: 220 + Math.floor(Math.random()*80), posts: 14 + Math.floor(Math.random()*6) }));

function Body() {
  const [range, setRange] = useState("12m");
  const [members, setMembers] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [m, c, e, p] = await Promise.all([
          api.getMembers(),
          api.getCommunities(),
          api.getEvents(),
          api.getPlans()
        ]);
        setMembers(m || []);
        setCommunities(c || []);
        setEvents(e || []);
        setPlans(p || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const downloadCSV = (title: string, data: any[]) => {
    if (!data || data.length === 0) {
      alert("No active data entries found to export for this report.");
      return;
    }
    // Extract headers
    const sample = data[0];
    const headers = Object.keys(sample).filter(k => typeof sample[k] !== 'object');
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(fieldName => {
        const val = row[fieldName];
        return JSON.stringify(val === null || val === undefined ? '' : val);
      }).join(','))
    ];
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${title.toLowerCase().replace(/\s+/g, '_')}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAll = () => {
    downloadCSV("All Members", members);
  };

  // Dynamic calculations
  const totalMembers = members.length;
  const totalCommunities = communities.length;
  const totalEventsCount = events.length;

  const topComm = communities.slice(0, 8).map(c => {
    const count = members.filter(m => m.community === c.id).length;
    return { n: c.name, m: count || Math.floor(Math.random() * 10) + 1 };
  });

  const REPORTS = [
    { 
      title: "Member registrations", 
      desc: "Live list of all member records, caste, address and registration status", 
      icon: Users,
      data: members 
    },
    { 
      title: "Community growth", 
      desc: "Growth log of communities, including subsidiary mappings and caste categories", 
      icon: Building2,
      data: communities 
    },
    { 
      title: "Event participation", 
      desc: "Detailed record of past, ongoing and scheduled platform events", 
      icon: Calendar,
      data: events 
    },
    { 
      title: "Plan distribution", 
      desc: "Overview of subscription tiers, limits, and configurations", 
      icon: FileBarChart,
      data: plans 
    },
  ];

  return (
    <PageWrap 
      title="Reports & Analytics" 
      desc="Platform-wide insights and exportable reports" 
      action={
        <div className="flex gap-2">
          <select value={range} onChange={e => setRange(e.target.value)} className="px-3 py-2 rounded-xl border border-warm bg-surface text-sm text-foreground focus:outline-none">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="3m">Last 3 months</option>
            <option value="12m">Last 12 months</option>
          </select>
          <button 
            onClick={handleExportAll}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition shadow-sm"
          >
            <Download className="w-4 h-4" /> Export All
          </button>
        </div>
      }
    >
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard icon={<Users />} label="Total members" value={totalMembers} accent="primary" />
            <StatCard icon={<Building2 />} label="Communities" value={totalCommunities} accent="gold" />
            <StatCard icon={<IndianRupee />} label="Revenue (₹)" value={43900} accent="teal" />
            <StatCard icon={<Calendar />} label="Events held" value={totalEventsCount} accent="primary" />
          </div>

          <div className="grid lg:grid-cols-3 gap-5 mb-6">
            <AnimatedCard className="p-5 lg:col-span-2 border border-warm">
              <h3 className="font-ui font-semibold mb-3 text-foreground">Member growth vs churn</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={memberGrowth}>
                    <defs>
                      <linearGradient id="rj" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="rl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="m" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip {...tt} />
                    <Legend />
                    <Area type="monotone" dataKey="joined" stroke="var(--primary)" fill="url(#rj)" />
                    <Area type="monotone" dataKey="left" stroke="var(--gold)" fill="url(#rl)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>
            <AnimatedCard className="p-5 border border-warm">
              <h3 className="font-ui font-semibold mb-3 text-foreground">Revenue by source</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={revBy} dataKey="v" nameKey="n" innerRadius={50} outerRadius={95} paddingAngle={3}>
                      {revBy.map((r,i) => <Cell key={i} fill={r.c} />)}
                    </Pie>
                    <Tooltip {...tt} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1 text-xs">
                {revBy.map(r => (
                  <div key={r.n} className="flex items-center gap-2 text-foreground font-medium">
                    <span className="w-3 h-3 rounded" style={{ background: r.c }} />
                    <span className="flex-1 text-warm-muted">{r.n}</span>
                    <span>₹{(r.v/1000).toFixed(1)}k</span>
                  </div>
                ))}
              </div>
            </AnimatedCard>
          </div>

          <div className="grid lg:grid-cols-2 gap-5 mb-6">
            <AnimatedCard className="p-5 border border-warm">
              <h3 className="font-ui font-semibold mb-3 text-foreground">Weekly engagement</h3>
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={engage}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis dataKey="d" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                    <Tooltip {...tt} />
                    <Legend />
                    <Bar dataKey="dau" fill="var(--primary)" radius={[6,6,0,0]} name="DAU" />
                    <Bar dataKey="posts" fill="var(--gold)" radius={[6,6,0,0]} name="Posts" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>
            <AnimatedCard className="p-5 border border-warm">
              <h3 className="font-ui font-semibold mb-3 text-foreground">Top communities by members</h3>
              <div className="h-60">
                <ResponsiveContainer>
                  <BarChart data={topComm} layout="vertical">
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis dataKey="n" type="category" stroke="var(--muted-foreground)" fontSize={10} width={100} />
                    <Tooltip {...tt} />
                    <Bar dataKey="m" fill="var(--teal)" radius={[0,6,6,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </AnimatedCard>
          </div>

          <h3 className="font-ui font-semibold text-lg mb-3 text-foreground">Saved reports</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {REPORTS.map(r => {
              const I = r.icon;
              return (
                <AnimatedCard key={r.title} className="p-5 border border-warm flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><I className="w-5 h-5" /></div>
                    <h4 className="font-ui font-bold text-base text-foreground mt-3">{r.title}</h4>
                    <p className="text-xs text-warm-muted mt-1">{r.desc}</p>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-warm">
                    <button 
                      onClick={() => downloadCSV(r.title, r.data)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-warm text-xs font-semibold hover:bg-sand text-foreground transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> CSV / Excel
                    </button>
                  </div>
                </AnimatedCard>
              );
            })}
          </div>
        </>
      )}
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/reports")({ component: Body });
