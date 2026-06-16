import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatusBadge, Modal } from "@/components/wag/primitives";
import { FileText, Plus, Pencil, Trash2, Mail, HelpCircle, Megaphone, Layout, Eye } from "lucide-react";

type Tab = "pages" | "banners" | "emails" | "faqs";

const INITIAL_PAGES = [
  { id: 1, slug: "about", title: "About We Are Going", updated: "2026-05-12", status: "Active" },
  { id: 2, slug: "privacy", title: "Privacy Policy", updated: "2026-04-01", status: "Active" },
  { id: 3, slug: "terms", title: "Terms of Service", updated: "2026-04-01", status: "Active" },
  { id: 4, slug: "contact", title: "Contact Us", updated: "2026-05-22", status: "Active" },
  { id: 5, slug: "refund", title: "Refund Policy", updated: "2026-03-15", status: "Active" },
];

const INITIAL_BANNERS = [
  { id: 1, title: "Diwali Sale — 25% off all plans", target: "Homepage", start: "2026-10-20", end: "2026-11-05", status: "Scheduled" },
  { id: 2, title: "New: Matrimony module launched", target: "Dashboard", start: "2026-06-01", end: "2026-07-31", status: "Active" },
  { id: 3, title: "Maintenance window Saturday", target: "All Pages", start: "2026-06-12", end: "2026-06-13", status: "Expired" },
];

const INITIAL_EMAILS = [
  { id: 1, name: "Welcome member", trigger: "On registration", updated: "2026-05-10", status: "Active" },
  { id: 2, name: "Community approved", trigger: "Admin action", updated: "2026-04-22", status: "Active" },
  { id: 3, name: "Subscription renewed", trigger: "Payment success", updated: "2026-05-01", status: "Active" },
  { id: 4, name: "Event reminder (24h)", trigger: "Scheduled", updated: "2026-05-15", status: "Active" },
  { id: 5, name: "Matrimony match alert", trigger: "Match found", updated: "2026-04-08", status: "Active" },
];

const INITIAL_FAQS = [
  { id: 1, q: "How do I join a community?", a: "Browse Communities, open any community page and click Request to Join.", cat: "Members" },
  { id: 2, q: "How is my data protected?", a: "All data is encrypted in transit and at rest. Community admins control visibility.", cat: "Privacy" },
  { id: 3, q: "Can I run multiple committees?", a: "Yes — Pro and Enterprise plans support unlimited committees and sub-committees.", cat: "Admins" },
  { id: 4, q: "What payment methods are supported?", a: "We support UPI, cards, net-banking, wallets and bank transfers.", cat: "Billing" },
  { id: 5, q: "How do I export member data?", a: "From Reports → Members, choose Excel, CSV or PDF.", cat: "Admins" },
];

function CMSBody() {
  const [tab, setTab] = useState<Tab>("pages");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Loaded state
  const [pages, setPages] = useState<any[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [emails, setEmails] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<any[]>([]);

  // Form State
  const [form, setForm] = useState<any>({
    title: "",
    slug: "",
    status: "Active",
    target: "Homepage",
    start: "",
    end: "",
    trigger: "",
    name: "",
    q: "",
    a: "",
    cat: "Members"
  });

  // Load from local storage or set initial data
  useEffect(() => {
    const loadData = (key: string, initial: any[]) => {
      const stored = localStorage.getItem(`wag_cms_${key}`);
      if (stored) {
        try { return JSON.parse(stored); } catch (e) { return initial; }
      }
      return initial;
    };

    setPages(loadData("pages", INITIAL_PAGES));
    setBanners(loadData("banners", INITIAL_BANNERS));
    setEmails(loadData("emails", INITIAL_EMAILS));
    setFaqs(loadData("faqs", INITIAL_FAQS));
  }, []);

  const saveData = (key: string, data: any[]) => {
    localStorage.setItem(`wag_cms_${key}`, JSON.stringify(data));
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      status: "Active",
      target: "Homepage",
      start: new Date().toISOString().split("T")[0],
      end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      trigger: "On Action",
      name: "",
      q: "",
      a: "",
      cat: "Members"
    });
    setOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ ...item });
    setOpen(true);
  };

  const handleSave = () => {
    const updatedDate = new Date().toISOString().split("T")[0];
    
    if (tab === "pages") {
      let updatedPages;
      if (editingId) {
        updatedPages = pages.map(p => p.id === editingId ? { ...p, ...form, updated: updatedDate } : p);
      } else {
        const newPage = { id: Date.now(), ...form, updated: updatedDate };
        updatedPages = [...pages, newPage];
      }
      setPages(updatedPages);
      saveData("pages", updatedPages);
    } else if (tab === "banners") {
      let updatedBanners;
      if (editingId) {
        updatedBanners = banners.map(b => b.id === editingId ? { ...b, ...form } : b);
      } else {
        const newBanner = { id: Date.now(), ...form };
        updatedBanners = [...banners, newBanner];
      }
      setBanners(updatedBanners);
      saveData("banners", updatedBanners);
    } else if (tab === "emails") {
      let updatedEmails;
      if (editingId) {
        updatedEmails = emails.map(e => e.id === editingId ? { ...e, ...form, updated: updatedDate } : e);
      } else {
        const newEmail = { id: Date.now(), ...form, updated: updatedDate };
        updatedEmails = [...emails, newEmail];
      }
      setEmails(updatedEmails);
      saveData("emails", updatedEmails);
    } else if (tab === "faqs") {
      let updatedFaqs;
      if (editingId) {
        updatedFaqs = faqs.map(f => f.id === editingId ? { ...f, ...form } : f);
      } else {
        const newFaq = { id: Date.now(), ...form };
        updatedFaqs = [...faqs, newFaq];
      }
      setFaqs(updatedFaqs);
      saveData("faqs", updatedFaqs);
    }

    setOpen(false);
  };

  const handleDelete = (id: number, type: Tab) => {
    if (!confirm("Are you sure you want to delete this CMS content?")) return;

    if (type === "pages") {
      const filtered = pages.filter(p => p.id !== id);
      setPages(filtered);
      saveData("pages", filtered);
    } else if (type === "banners") {
      const filtered = banners.filter(b => b.id !== id);
      setBanners(filtered);
      saveData("banners", filtered);
    } else if (type === "emails") {
      const filtered = emails.filter(e => e.id !== id);
      setEmails(filtered);
      saveData("emails", filtered);
    } else if (type === "faqs") {
      const filtered = faqs.filter(f => f.id !== id);
      setFaqs(filtered);
      saveData("faqs", filtered);
    }
  };

  const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: "pages", label: "Pages", icon: Layout },
    { id: "banners", label: "Banners", icon: Megaphone },
    { id: "emails", label: "Email templates", icon: Mail },
    { id: "faqs", label: "FAQs", icon: HelpCircle },
  ];

  return (
    <PageWrap 
      title="Content Management" 
      desc="Static pages, announcement banners, email templates and FAQs" 
      action={
        <button 
          onClick={handleOpenAdd} 
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/95 transition"
        >
          <Plus className="w-4 h-4" /> New {tab.slice(0, -1)}
        </button>
      }
    >
      <div className="flex gap-2 mb-5 border-b border-warm overflow-x-auto">
        {TABS.map(t => {
          const I = t.icon;
          return (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              className={`px-4 py-2.5 text-sm font-bold border-b-2 -mb-px transition inline-flex items-center gap-2 whitespace-nowrap ${tab === t.id ? "border-primary text-primary" : "border-transparent text-warm-muted hover:text-foreground"}`}
            >
              <I className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "pages" && (
        <AnimatedCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs font-bold uppercase tracking-wide text-warm-muted">
                <tr>
                  {["Title", "Slug", "Last updated", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm">
                {pages.map(p => (
                  <tr key={p.id} className="hover:bg-sand/30 transition">
                    <td className="px-4 py-3 font-semibold text-foreground">{p.title}</td>
                    <td className="px-4 py-3 font-mono text-xs text-warm-muted">/{p.slug}</td>
                    <td className="px-4 py-3 text-warm-muted">{p.updated}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(p)} className="p-1.5 rounded hover:bg-sand text-primary">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(p.id, "pages")} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}

      {tab === "banners" && (
        <div className="grid lg:grid-cols-2 gap-4">
          {banners.map(b => (
            <AnimatedCard key={b.id} className="p-5 flex flex-col justify-between border border-warm">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{b.title}</h4>
                    <p className="text-xs text-warm-muted mt-1">Target Position: <span className="font-semibold text-foreground">{b.target}</span></p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
                <div className="mt-3 text-xs text-warm-muted">Active Window: {b.start} → {b.end}</div>
              </div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-warm">
                <button onClick={() => handleOpenEdit(b)} className="flex-1 px-3 py-1.5 rounded-lg border border-warm text-xs font-semibold hover:bg-sand text-primary transition">
                  Edit Banner
                </button>
                <button onClick={() => handleDelete(b.id, "banners")} className="px-3 py-1.5 rounded-lg border border-warm text-xs text-red-600 hover:bg-red-50 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {tab === "emails" && (
        <AnimatedCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-sand text-xs font-bold uppercase tracking-wide text-warm-muted">
                <tr>
                  {["Template Name", "Trigger Action", "Updated", "Status", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm">
                {emails.map(e => (
                  <tr key={e.id} className="hover:bg-sand/30 transition">
                    <td className="px-4 py-3 font-semibold flex items-center gap-2 text-foreground">
                      <Mail className="w-4 h-4 text-primary" /> {e.name}
                    </td>
                    <td className="px-4 py-3 text-warm-muted text-xs font-medium">{e.trigger}</td>
                    <td className="px-4 py-3 text-warm-muted">{e.updated}</td>
                    <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(e)} className="p-1.5 rounded hover:bg-sand text-primary">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(e.id, "emails")} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </AnimatedCard>
      )}

      {tab === "faqs" && (
        <div className="space-y-3">
          {faqs.map(f => (
            <AnimatedCard key={f.id} className="p-5 border border-warm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-gold-light text-gold border border-gold/15">
                    {f.cat}
                  </span>
                  <h4 className="font-semibold text-foreground mt-2">{f.q}</h4>
                  <p className="text-sm text-warm-muted mt-1">{f.a}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleOpenEdit(f)} className="p-1.5 rounded hover:bg-sand text-primary">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(f.id, "faqs")} className="p-1.5 rounded hover:bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? `Edit ${tab.slice(0, -1)}` : `New ${tab.slice(0, -1)}`} size="lg">
        <div className="space-y-4">
          {tab === "pages" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Page Title *</label>
                  <input 
                    value={form.title || ""} 
                    onChange={e => setForm((prev: any) => ({ ...prev, title: e.target.value }))} 
                    placeholder="e.g. Terms and Conditions"
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Slug *</label>
                  <input 
                    value={form.slug || ""} 
                    onChange={e => setForm((prev: any) => ({ ...prev, slug: e.target.value }))} 
                    placeholder="e.g. terms-of-service"
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Status</label>
                <select 
                  value={form.status}
                  onChange={e => setForm((prev: any) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
            </>
          )}

          {tab === "banners" && (
            <>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Banner Text / Title *</label>
                <input 
                  value={form.title || ""} 
                  onChange={e => setForm((prev: any) => ({ ...prev, title: e.target.value }))} 
                  placeholder="e.g. Diwali Event registrations are open"
                  className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Target Page</label>
                  <select 
                    value={form.target}
                    onChange={e => setForm((prev: any) => ({ ...prev, target: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none"
                  >
                    <option value="Homepage">Homepage</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="All Pages">All Pages</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Status</label>
                  <select 
                    value={form.status}
                    onChange={e => setForm((prev: any) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Start Date</label>
                  <input 
                    type="date"
                    value={form.start || ""} 
                    onChange={e => setForm((prev: any) => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">End Date</label>
                  <input 
                    type="date"
                    value={form.end || ""} 
                    onChange={e => setForm((prev: any) => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                  />
                </div>
              </div>
            </>
          )}

          {tab === "emails" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Template Name *</label>
                  <input 
                    value={form.name || ""} 
                    onChange={e => setForm((prev: any) => ({ ...prev, name: e.target.value }))} 
                    placeholder="e.g. Welcome Email"
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Trigger Event *</label>
                  <input 
                    value={form.trigger || ""} 
                    onChange={e => setForm((prev: any) => ({ ...prev, trigger: e.target.value }))} 
                    placeholder="e.g. User Registration"
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">Status</label>
                <select 
                  value={form.status}
                  onChange={e => setForm((prev: any) => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Disabled">Disabled</option>
                </select>
              </div>
            </>
          )}

          {tab === "faqs" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">FAQ Question *</label>
                  <input 
                    value={form.q || ""} 
                    onChange={e => setForm((prev: any) => ({ ...prev, q: e.target.value }))} 
                    placeholder="Ask question"
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-muted mb-1">Category</label>
                  <select 
                    value={form.cat}
                    onChange={e => setForm((prev: any) => ({ ...prev, cat: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none"
                  >
                    <option value="Members">Members</option>
                    <option value="Admins">Admins</option>
                    <option value="Privacy">Privacy</option>
                    <option value="Billing">Billing</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-warm-muted mb-1">FAQ Answer *</label>
                <textarea 
                  rows={4}
                  value={form.a || ""} 
                  onChange={e => setForm((prev: any) => ({ ...prev, a: e.target.value }))} 
                  placeholder="Provide details answer..."
                  className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm focus:outline-none" 
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-warm">
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-warm text-sm font-semibold hover:bg-sand transition">
              Cancel
            </button>
            <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition">
              Save Content
            </button>
          </div>
        </div>
      </Modal>
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/cms")({ component: CMSBody });
