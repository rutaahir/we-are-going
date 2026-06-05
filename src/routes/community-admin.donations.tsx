import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Download, Trash2 } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, Modal, StatCard } from "@/components/wag/primitives";
import { api } from "@/lib/api";
import { IndianRupee, TrendingUp, Users } from "lucide-react";

export const Route = createFileRoute("/community-admin/donations")({
  component: CommunityAdminDonations,
});

function CommunityAdminDonations() {
  const [open, setOpen] = useState(false);
  const [donations, setDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDonations = async () => {
      try {
        const data = await api.getDonations();
        setDonations(data);
      } catch (err) {
        console.error("Failed to load community donations", err);
      } finally {
        setLoading(false);
      }
    };
    loadDonations();
  }, []);

  const total = donations.reduce((s, d) => s + d.amount, 0);

  return (
    <PageWrap 
      title="Donations" 
      action={
        <div className="flex gap-2">
          <button className="px-4 py-2 rounded-lg border border-warm text-sm flex items-center gap-2">
            <Download className="w-4 h-4" />Export CSV
          </button>
          <button onClick={() => setOpen(true)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium flex items-center gap-2">
            <Plus className="w-4 h-4" />Add
          </button>
        </div>
      }
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<IndianRupee />} label="Total collected" value={total} accent="primary" />
        <StatCard icon={<TrendingUp />} label="This month" value={Math.floor(total / 4 || 0)} accent="gold" />
        <StatCard icon={<Users />} label="Donors" value={donations.length} accent="teal" />
      </div>
      <AnimatedCard className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-warm-muted">Loading donations...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-sand">
              <tr>
                {["Donor","Amount","Date","Campaign","Method","Note",""].map(h => (
                  <th key={h} className="text-left p-3 text-xs uppercase tracking-wider text-warm-muted">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donations.map(d => (
                <tr key={d.id} className="border-t border-warm hover:bg-sand">
                  <td className="p-3 font-medium">{d.donor}</td>
                  <td className="p-3">₹{d.amount.toLocaleString()}</td>
                  <td className="p-3">{new Date(d.date).toLocaleDateString()}</td>
                  <td className="p-3 text-xs">{d.campaign_title || d.campaign}</td>
                  <td className="p-3 text-xs">{d.method}</td>
                  <td className="p-3 text-xs text-warm-muted">{d.note || "—"}</td>
                  <td className="p-3">
                    <button className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AnimatedCard>
      <Modal open={open} onClose={() => setOpen(false)} title="Add Donation">
        <div className="space-y-3">
          <input placeholder="Donor name" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
          <input placeholder="Amount" type="number" className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface" />
          <select className="w-full px-3 py-2.5 rounded-lg border border-warm bg-surface">
            <option>UPI</option>
            <option>Cash</option>
            <option>Bank Transfer</option>
          </select>
          <button onClick={() => setOpen(false)} className="w-full py-2.5 rounded-lg bg-primary text-white font-medium">
            Add
          </button>
        </div>
      </Modal>
    </PageWrap>
  );
}
