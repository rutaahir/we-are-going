import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Users, CheckCircle, Search, Plus, Edit, Trash2, Loader2, Sparkles } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatCard, StatusBadge, Modal } from "@/components/wag/primitives";
import { api } from "@/lib/api";

export const Route = createFileRoute("/admin/events")({
  component: EventsPage,
});

function EventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCommunity, setSelectedCommunity] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal State
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [form, setForm] = useState<any>({
    title: "", type: "", date: "", time: "", venue: "",
    max_attendees: 500, status: "Upcoming", color: "blue",
    img_url: "", desc: "", community: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
    try {
      const data = await api.getEvents();
      setEvents(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCommunities = async () => {
    try {
      const data = await api.getCommunities();
      setCommunities(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchEvents(), fetchCommunities()]);
      setLoading(false);
    };
    init();
  }, []);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      title: "",
      type: "Social Gathering",
      date: new Date().toISOString().split("T")[0],
      time: "10:00 AM",
      venue: "",
      max_attendees: 500,
      status: "Upcoming",
      color: "blue",
      img_url: "",
      desc: "",
      community: communities[0]?.id || ""
    });
    setOpen(true);
  };

  const handleOpenEdit = (e: any) => {
    setEditingId(e.id);
    setForm({
      title: e.title || "",
      type: e.type || "",
      date: e.date || "",
      time: e.time || "",
      venue: e.venue || "",
      max_attendees: e.max_attendees || 500,
      status: e.status || "Upcoming",
      color: e.color || "blue",
      img_url: e.img_url || "",
      desc: e.desc || "",
      community: e.community || ""
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.venue.trim() || !form.community) {
      alert("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.updateEvent(editingId, form);
      } else {
        await api.createEvent(form);
      }
      setOpen(false);
      await fetchEvents();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    try {
      // In django ModelViewSet, destroy is mapped to DELETE request
      await api.updateEvent(id, { status: 'Cancelled' }); // Toggling status is safer or we can fetch/delete
      // Let's call DELETE directly if backend supports it. api.ts has apiFetch support:
      // Wait, let's just update the status to Cancelled or we can delete:
      await fetch(`/api/events/${id}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${localStorage.getItem('wag_token')}` } });
      await fetchEvents();
    } catch (e) {
      console.error(e);
    }
  };

  // Calculations
  const totalEvents = events.length;
  const totalAttendees = events.reduce((s, e) => s + (e.attendees || 0), 0);
  const completedEvents = events.filter(e => e.status === "Completed").length;

  const filteredEvents = events.filter(e => {
    const matchesSearch = (e.title || "").toLowerCase().includes(search.toLowerCase()) || 
                          (e.type || "").toLowerCase().includes(search.toLowerCase());
    const matchesCommunity = selectedCommunity === "All" || e.community?.toString() === selectedCommunity.toString();
    const matchesStatus = selectedStatus === "All" || e.status === selectedStatus;
    return matchesSearch && matchesCommunity && matchesStatus;
  });

  return (
    <PageWrap 
      title="Platform Events" 
      desc="Create, manage and moderate events across all communities"
      action={
        <button 
          onClick={handleOpenAdd}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 hover:bg-primary/95 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Event
        </button>
      }
    >
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={<CalendarIcon className="text-primary" />} label="Total events" value={totalEvents} accent="primary" />
        <StatCard icon={<Users className="text-gold" />} label="Total attendees" value={totalAttendees} accent="gold" />
        <StatCard icon={<CheckCircle className="text-teal" />} label="Completed events" value={completedEvents} accent="teal" />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-warm-muted" />
          <input 
            placeholder="Search by title, type…" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary transition text-sm" 
          />
        </div>
        <select 
          value={selectedCommunity} 
          onChange={(e) => setSelectedCommunity(e.target.value)}
          className="px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none"
        >
          <option value="All">All communities</option>
          {communities.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select 
          value={selectedStatus} 
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 rounded-xl border border-warm bg-surface text-sm focus:outline-none"
        >
          <option value="All">All Statuses</option>
          <option value="Upcoming">Upcoming</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : (
        <AnimatedCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs font-bold uppercase tracking-wider text-warm-muted">
                <tr>
                  {["Event Title", "Community", "Type", "Date / Time", "Attendees", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left p-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm">
                {filteredEvents.map(e => {
                  const comm = communities.find(c => c.id === e.community);
                  return (
                    <tr key={e.id} className="hover:bg-sand/30 transition">
                      <td className="p-4 font-semibold text-foreground">{e.title}</td>
                      <td className="p-4 text-xs font-medium text-warm-muted">{comm?.name || "Global / Platform"}</td>
                      <td className="p-4 text-xs font-semibold text-primary uppercase">{e.type}</td>
                      <td className="p-4 text-xs">
                        <div className="font-semibold text-foreground">{e.date ? new Date(e.date).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-warm-muted">{e.time}</div>
                      </td>
                      <td className="p-4 text-xs">
                        <span className="font-semibold text-foreground">{e.attendees || 0}</span> / {e.max_attendees || 500}
                      </td>
                      <td className="p-4">
                        <StatusBadge status={e.status} />
                      </td>
                      <td className="p-4 text-xs font-semibold">
                        <div className="flex gap-2">
                          <button onClick={() => handleOpenEdit(e)} className="text-primary hover:underline flex items-center gap-1">
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => handleDelete(e.id)} className="text-red-500 hover:underline flex items-center gap-1">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredEvents.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-warm-muted">No events found matching current criteria.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}

      {/* Add / Edit Event Modal */}
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? "Edit Event" : "Create Event"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-warm-muted mb-1">Event Title *</label>
            <input 
              value={form.title || ""} 
              onChange={e => setForm((prev: any) => ({ ...prev, title: e.target.value }))} 
              placeholder="e.g. Annual Youth Sports Meet" 
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Event Type</label>
              <select 
                value={form.type || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, type: e.target.value }))} 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
              >
                <option value="Social Gathering">Social Gathering</option>
                <option value="Business Meet">Business Meet</option>
                <option value="Marriage Meet">Marriage Meet</option>
                <option value="Educational Seminar">Educational Seminar</option>
                <option value="Cultural Program">Cultural Program</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Community Association *</label>
              <select 
                value={form.community || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, community: e.target.value }))} 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
              >
                <option value="">Select Community</option>
                {communities.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Date *</label>
              <input 
                type="date"
                value={form.date || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, date: e.target.value }))} 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Time</label>
              <input 
                value={form.time || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, time: e.target.value }))} 
                placeholder="e.g. 10:00 AM - 5:00 PM" 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Max Attendees</label>
              <input 
                type="number"
                value={form.max_attendees || ""} 
                onChange={e => setForm((prev: any) => ({ ...prev, max_attendees: parseInt(e.target.value) || 0 }))} 
                placeholder="500" 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-warm-muted mb-1">Status</label>
              <select 
                value={form.status || "Upcoming"} 
                onChange={e => setForm((prev: any) => ({ ...prev, status: e.target.value }))} 
                className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"
              >
                <option value="Upcoming">Upcoming</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-muted mb-1">Venue / Location *</label>
            <input 
              value={form.venue || ""} 
              onChange={e => setForm((prev: any) => ({ ...prev, venue: e.target.value }))} 
              placeholder="Full venue address" 
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-muted mb-1">Cover Image URL</label>
            <input 
              value={form.img_url || ""} 
              onChange={e => setForm((prev: any) => ({ ...prev, img_url: e.target.value }))} 
              placeholder="https://images.unsplash.com/..." 
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-warm-muted mb-1">Event Description</label>
            <textarea 
              rows={3}
              value={form.desc || ""} 
              onChange={e => setForm((prev: any) => ({ ...prev, desc: e.target.value }))} 
              placeholder="Describe the event and agenda..." 
              className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" 
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-warm">
            <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2 rounded-xl border border-warm text-sm font-semibold hover:bg-sand transition">
              Cancel
            </button>
            <button 
              type="button" 
              disabled={saving}
              onClick={handleSave} 
              className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Event
            </button>
          </div>
        </div>
      </Modal>
    </PageWrap>
  );
}
