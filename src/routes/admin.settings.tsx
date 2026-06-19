import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";
import { Settings, Globe, CreditCard, Mail, Bell, Shield, Palette, Database, Check } from "lucide-react";

type Tab = "general" | "payments" | "email" | "notifications" | "security" | "branding" | "backups";

function Section({ icon, title, desc, children }: { icon: ReactNode; title: string; desc?: string; children: ReactNode }) {
  return (
    <AnimatedCard className="p-6">
      <div className="flex items-start gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">{icon}</div>
        <div><h3 className="font-ui font-semibold">{title}</h3>{desc && <p className="text-xs text-warm-muted mt-0.5">{desc}</p>}</div>
      </div>
      <div className="space-y-4">{children}</div>
    </AnimatedCard>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-warm-muted uppercase tracking-wide">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-[11px] text-warm-muted mt-1">{hint}</p>}
    </label>
  );
}

function Toggle({ on, onChange, label, desc }: { on: boolean; onChange: () => void; label: string; desc?: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div><div className="text-sm font-medium">{label}</div>{desc && <div className="text-xs text-warm-muted">{desc}</div>}</div>
      <button onClick={onChange} className={`w-11 h-6 rounded-full p-0.5 transition ${on ? "bg-primary" : "bg-warm"}`}>
        <span className={`block w-5 h-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}

function Body() {
  const [tab, setTab] = useState<Tab>("general");
  const [toggles, setToggles] = useState({ regOpen: true, otp: true, email: true, sms: false, push: true, twoFA: true, audit: true, autoBackup: true });
  const T = (k: keyof typeof toggles) => setToggles(p => ({ ...p, [k]: !p[k] }));

  const TABS: { id: Tab; label: string; icon: typeof Settings }[] = [
    { id: "general", label: "General", icon: Globe },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "email", label: "Email & SMS", icon: Mail },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "branding", label: "Branding", icon: Palette },
    { id: "backups", label: "Backups", icon: Database },
  ];

  return (
    <PageWrap title="Platform Settings" desc="Configure global platform behaviour, integrations and security" action={
      <button onClick={() => alert("Platform settings saved successfully!")} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold shadow-sm hover:bg-primary/95 transition"><Check className="w-4 h-4" /> Save changes</button>
    }>
      <div className="grid lg:grid-cols-[220px_1fr] gap-5">
        <nav className="space-y-1 lg:sticky lg:top-20 lg:self-start">
          {TABS.map(t => {
            const I = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${tab === t.id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-sand"}`}>
                <I className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-5">
          {tab === "general" && (
            <Section icon={<Globe className="w-5 h-5" />} title="General" desc="Platform-wide identity and locale">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Platform name"><input defaultValue="WE ARE UNITED" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="Tagline"><input defaultValue="Aapni Samaj, Aapnu Network" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="Support email"><input defaultValue="support@weareunited.in" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="Timezone"><select defaultValue="IST" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>IST (UTC+5:30)</option><option>UTC</option><option>EST</option></select></Field>
                <Field label="Default language"><select defaultValue="en" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option value="en">English</option><option value="hi">हिन्दी</option><option value="gu">ગુજરાતી</option></select></Field>
                <Field label="Currency"><select defaultValue="INR" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>INR (₹)</option><option>USD ($)</option></select></Field>
              </div>
              <div className="pt-2 border-t border-warm">
                <Toggle on={toggles.regOpen} onChange={() => T("regOpen")} label="Open registration" desc="Allow new members to register without invite" />
              </div>
            </Section>
          )}

          {tab === "payments" && (
            <Section icon={<CreditCard className="w-5 h-5" />} title="Payment gateways" desc="Connect providers for subscriptions and donations">
              {[{ name: "Razorpay", status: "Connected" }, { name: "Stripe", status: "Disconnected" }, { name: "PayU", status: "Connected" }, { name: "Cashfree", status: "Disconnected" }].map(g => (
                <div key={g.name} className="flex items-center justify-between p-3 rounded-lg border border-warm">
                  <div><div className="font-semibold text-sm">{g.name}</div><div className="text-xs text-warm-muted">{g.status}</div></div>
                  <button className={`px-3 py-1.5 rounded-lg text-xs font-medium ${g.status === "Connected" ? "border border-warm hover:bg-sand" : "bg-primary text-white"}`}>{g.status === "Connected" ? "Manage" : "Connect"}</button>
                </div>
              ))}
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-warm">
                <Field label="Platform fee (%)" hint="Charged on each donation"><input defaultValue="2.5" type="number" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="Tax (GST %)"><input defaultValue="18" type="number" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
              </div>
            </Section>
          )}

          {tab === "email" && (
            <Section icon={<Mail className="w-5 h-5" />} title="Email & SMS providers">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="SMTP host"><input defaultValue="smtp.sendgrid.net" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="SMTP port"><input defaultValue="587" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="From name"><input defaultValue="WE ARE UNITED" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="From email"><input defaultValue="no-reply@weareunited.in" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="SMS provider"><select className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm"><option>MSG91</option><option>Twilio</option><option>Gupshup</option></select></Field>
                <Field label="Sender ID"><input defaultValue="WEAREUNITED" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
              </div>
            </Section>
          )}

          {tab === "notifications" && (
            <Section icon={<Bell className="w-5 h-5" />} title="Notification channels">
              <Toggle on={toggles.email} onChange={() => T("email")} label="Email notifications" desc="Transactional and digest emails" />
              <Toggle on={toggles.sms} onChange={() => T("sms")} label="SMS notifications" desc="OTP and critical alerts" />
              <Toggle on={toggles.push} onChange={() => T("push")} label="Web push" desc="Browser and PWA notifications" />
              <Toggle on={toggles.otp} onChange={() => T("otp")} label="OTP on login" desc="Send OTP for every login attempt" />
            </Section>
          )}

          {tab === "security" && (
            <Section icon={<Shield className="w-5 h-5" />} title="Security">
              <Toggle on={toggles.twoFA} onChange={() => T("twoFA")} label="Require 2FA for admins" desc="All Super Admin and Platform Manager accounts" />
              <Toggle on={toggles.audit} onChange={() => T("audit")} label="Audit logging" desc="Record every admin action with IP and timestamp" />
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-warm">
                <Field label="Session timeout (mins)"><input defaultValue="60" type="number" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="Max login attempts"><input defaultValue="5" type="number" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="Password min length"><input defaultValue="10" type="number" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="IP allowlist"><input placeholder="e.g. 203.0.113.0/24" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
              </div>
            </Section>
          )}

          {tab === "branding" && (
            <Section icon={<Palette className="w-5 h-5" />} title="Branding">
              <div className="grid sm:grid-cols-3 gap-4">
                <Field label="Primary"><div className="flex items-center gap-2"><span className="w-9 h-9 rounded-lg bg-primary border border-warm" /><input defaultValue="#E07B2D" className="flex-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm font-mono" /></div></Field>
                <Field label="Accent gold"><div className="flex items-center gap-2"><span className="w-9 h-9 rounded-lg bg-gold border border-warm" /><input defaultValue="#C9860A" className="flex-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm font-mono" /></div></Field>
                <Field label="Surface"><div className="flex items-center gap-2"><span className="w-9 h-9 rounded-lg bg-surface border border-warm" /><input defaultValue="#FFFDF7" className="flex-1 px-3 py-2 rounded-lg border border-warm bg-surface text-sm font-mono" /></div></Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-warm">
                <Field label="Logo (light)"><div className="border-2 border-dashed border-warm rounded-lg p-6 text-center text-xs text-warm-muted hover:bg-sand cursor-pointer">Drop SVG / PNG here</div></Field>
                <Field label="Favicon"><div className="border-2 border-dashed border-warm rounded-lg p-6 text-center text-xs text-warm-muted hover:bg-sand cursor-pointer">32×32 PNG / ICO</div></Field>
              </div>
            </Section>
          )}

          {tab === "backups" && (
            <Section icon={<Database className="w-5 h-5" />} title="Backups & data">
              <Toggle on={toggles.autoBackup} onChange={() => T("autoBackup")} label="Automatic daily backups" desc="Stored encrypted in S3-compatible storage" />
              <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-warm">
                <Field label="Retention (days)"><input defaultValue="90" type="number" className="w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm" /></Field>
                <Field label="Last backup"><input defaultValue="2026-06-03 04:00 IST" readOnly className="w-full px-3 py-2 rounded-lg border border-warm bg-sand text-sm" /></Field>
              </div>
              <div className="flex gap-2 pt-2"><button className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium">Run backup now</button><button className="px-4 py-2 rounded-lg border border-warm text-sm">Restore from backup</button></div>
            </Section>
          )}
        </div>
      </div>
    </PageWrap>
  );
}

export const Route = createFileRoute("/admin/settings")({ component: Body });
