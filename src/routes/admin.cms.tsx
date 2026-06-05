import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, StatusBadge, Modal } from "@/components/wag/primitives";
import { FileText, Plus, Pencil, Trash2, Mail, HelpCircle, Megaphone, Layout, Eye } from "lucide-react";

type Tab = "pages" | "banners" | "emails" | "faqs";

const PAGES = [
  { id: 1, slug: "about", title: "About We Are Going", updated: "2026-05-12", status: "Active" },
  { id: 2, slug: "privacy", title: "Privacy Policy", updated: "2026-04-01", status: "Active" },
  { id: 3, slug: "terms", title: "Terms of Service", updated: "2026-04-01", status: "Active" },
  { id: 4, slug: "contact", title: "Contact Us", updated: "2026-05-22", status: "Active" },
  { id: 5, slug: "refund", title: "Refund Policy", updated: "2026-03-15", status: "Active" },
];

const BANNERS = [
  { id: 1, title: "Diwali Sale — 25% off all plans", target: "Homepage", start: "2026-10-20", end: "2026-11-05", status: "Scheduled" },
  { id: 2, title: "New: Matrimony module launched", target: "Dashboard", start: "2026-06-01", end: "2026-07-31", status: "Active" },
  { id: 3, title: "Maintenance window Saturday", target: "All Pages", start: "2026-06-12", end: "2026-06-13", status: "Expired" },
];

const EMAILS = [
  { id: 1, name: "Welcome member", trigger: "On registration", updated: "2026-05-10", status: "Active" },
  { id: 2, name: "Community approved", trigger: "Admin action", updated: "2026-04-22", status: "Active" },
  { id: 3, name: "Subscription renewed", trigger: "Payment success", updated: "2026-05-01", status: "Active" },
  { id: 4, name: "Event reminder (24h)", trigger: "Scheduled", updated: "2026-05-15", status: "Active" },
  { id: 5, name: "Matrimony match alert", trigger: "Match found", updated: "2026-04-08", status: "Active" },
];

const FAQS = [
  { q: "How do I join a community?", a: "Browse Communities, open any community page and click Request to Join.", cat: "Members" },
  { q: "How is my data protected?", a: "All data is encrypted in transit and at rest. Community admins control visibility.", cat: "Privacy" },
  { q: "Can I run multiple committees?", a: "Yes — Pro and Enterprise plans support unlimited committees and sub-committees.", cat: "Admins" },
  { q: "What payment methods are supported?", a: "We support UPI, cards, net-banking, wallets and bank transfers.", cat: "Billing" },
  { q: "How do I export member data?", a: "From Reports → Members, choose Excel, CSV or PDF.", cat: "Admins" },
];

function Body() {
  const [tab, setTab] = useState<Tab>("pages");
  const [open, setOpen] = useState(false);
  const TABS: { id: Tab; label: string; icon: typeof FileText }[] = [
    { id: "pages", label: "Pages", icon: Layout },
    { id: "banners", label: "Banners", icon: Megaphone },
    { id: "emails", label: "Email templates", icon: Mail },
    { id: "faqs", label: "FAQs", icon: HelpCircle },
  ];
  return (
    <PageWrap title="Content Management" desc="Static pages, announcement banners, email templates and FAQs" action={
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium shadow-sapphire"><Plus className="w-4 h-4" /> New {tab.slice(0, -1)}</button>
    }>
      <div className="flex gap-2 mb-5 border-b border-warm overflow-x-auto">
        {TABS.map(t => {
          const I = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition inline-flex items-center gap-2 whitespace-nowrap ${tab === t.id ? "border-primary text-primary" : "border-transparent text-warm-muted hover:text-foreground"}`}>
              <I className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === "pages" && (
        <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand text-xs uppercase tracking-wide text-warm-muted"><tr>{["Title","Slug","Last updated","Status","Actions"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {PAGES.map(p => (
                <tr key={p.id} className="hover:bg-sand/40">
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 font-mono text-xs text-warm-muted">/{p.slug}</td>
                  <td className="px-4 py-3 text-warm-muted">{p.updated}</td>
                  <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><button className="p-1.5 rounded hover:bg-sand"><Eye className="w-4 h-4" /></button><button className="p-1.5 rounded hover:bg-sand"><Pencil className="w-4 h-4" /></button><button className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnimatedCard>
      )}

      {tab === "banners" && (
        <div className="grid lg:grid-cols-2 gap-4">
          {BANNERS.map(b => (
            <AnimatedCard key={b.id} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h4 className="font-ui font-semibold">{b.title}</h4><p className="text-xs text-warm-muted mt-1">Target: {b.target}</p></div>
                <StatusBadge status={b.status} />
              </div>
              <div className="mt-3 text-xs text-warm-muted">Window: {b.start} → {b.end}</div>
              <div className="flex gap-2 mt-4 pt-3 border-t border-warm"><button className="flex-1 px-3 py-1.5 rounded-lg border border-warm text-xs font-medium hover:bg-sand">Edit</button><button className="px-3 py-1.5 rounded-lg border border-warm text-xs text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button></div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {tab === "emails" && (
        <AnimatedCard className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-sand text-xs uppercase tracking-wide text-warm-muted"><tr>{["Template","Trigger","Updated","Status","Actions"].map(h => <th key={h} className="text-left px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-[var(--border)]">
              {EMAILS.map(e => (
                <tr key={e.id} className="hover:bg-sand/40">
                  <td className="px-4 py-3 font-medium flex items-center gap-2"><Mail className="w-4 h-4 text-primary" />{e.name}</td>
                  <td className="px-4 py-3 text-warm-muted">{e.trigger}</td>
                  <td className="px-4 py-3 text-warm-muted">{e.updated}</td>
                  <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                  <td className="px-4 py-3"><div className="flex gap-1"><button className="p-1.5 rounded hover:bg-sand"><Eye className="w-4 h-4" /></button><button className="p-1.5 rounded hover:bg-sand"><Pencil className="w-4 h-4" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </AnimatedCard>
      )}

      {tab === "faqs" && (
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <AnimatedCard key={i} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gold-light text-gold">{f.cat}</span>
                  <h4 className="font-ui font-semibold mt-2">{f.q}</h4>
                  <p className="text-sm text-warm-muted mt-1">{f.a}</p>
                </div>
                <div className="flex gap-1"><button className="p-1.5 rounded hover:bg-sand"><Pencil className="w-4 h-4" /></button><button className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={`New ${tab.slice(0, -1)}`} size="lg">
        <div className="space-y-3">
          <label className="block"><span className="text-xs font-medium text-warm-muted">Title</span><input className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" placeholder="Enter title" /></label>
          <label className="block"><span className="text-xs font-medium text-warm-muted">Content</span><textarea rows={6} className="w-full mt-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm" placeholder="Write content with rich text…" /></label>
          <div className="flex justify-end gap-2 pt-3 border-t border-warm"><button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-warm text-sm">Cancel</button><button onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">Publish</button></div>
        </div>
      </Modal>
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/cms")({ component: Body });
