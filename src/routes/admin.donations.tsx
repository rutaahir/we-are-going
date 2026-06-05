import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatCard, StatusBadge } from "@/components/wag/primitives";
import { api } from "@/lib/api";
import { IndianRupee } from "lucide-react";

export const Route = createFileRoute("/admin/donations")({
  component: PlatformDonations,
});

function PlatformDonations() {
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDonations = async () => {
      try {
        const data = await api.getDonations();
        setDonations(data);
      } catch (err) {
        console.error("Failed to load donations in admin panel", err);
      } finally {
        setLoading(false);
      }
    };
    loadDonations();
  }, []);

  const total = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <PageWrap 
      title="Platform Donations" 
      desc="All transactions across communities" 
      action={
        <button className="px-4 py-2 rounded-lg border border-warm text-sm flex items-center gap-2">
          <Download className="w-4 h-4" />Export All
        </button>
      }
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<IndianRupee />} label="Total collected" value={total} accent="primary" />
        <StatCard icon={<IndianRupee />} label="This month" value={Math.floor(total / 2 || 0)} accent="gold" />
        <StatCard icon={<IndianRupee />} label="Last month" value={Math.floor(total / 3 || 0)} accent="teal" />
      </div>
      <div className="flex gap-3 mb-4">
        <select className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm">
          <option>All communities</option>
        </select>
        <input type="date" className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
        <input type="date" className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />
      </div>
      <AnimatedCard className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-warm-muted">Loading donations...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-sand">
              <tr>
                {["Donor","Campaign","Amount","Date","Method","Status"].map(h => (
                  <th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id} className="border-t border-warm hover:bg-sand">
                  <td className="p-3 font-semibold">{d.donor}</td>
                  <td className="p-3 text-xs">{d.campaign_title || d.campaign}</td>
                  <td className="p-3 font-bold">₹{d.amount.toLocaleString()}</td>
                  <td className="p-3 text-xs">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="p-3 text-xs">{d.method}</td>
                  <td className="p-3"><StatusBadge status={d.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AnimatedCard>
    </PageWrap>
  );
}
