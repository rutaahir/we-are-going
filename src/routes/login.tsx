import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Lock, Eye, EyeOff, ShieldCheck, Sparkles, Users, Heart, Briefcase } from "lucide-react";
import { useAuth, type Role } from "@/context/AuthContext";
import { PageTransition, FloatingOrbs } from "@/components/wag/primitives";
import { dashHomeFor } from "@/components/wag/Navbar";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — We Are Going" }] }),
  component: Login,
});

function Login() {
  const { loginWithApi } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState(""); const [show, setShow] = useState(false); const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const quickLogin = async (role: Role) => {
    setError(null);
    try {
      let username = "";
      if (role === "super_admin") {
        username = "admin";
      } else if (role === "community_admin") {
        username = "mehul@samaj.org";
      } else {
        username = "rohit@example.com";
      }
      const u = await loginWithApi(username, "admin123");
      navigate({ to: dashHomeFor(u.role) });
    } catch (err: any) {
      console.warn(`Backend quick login for ${role} failed`, err);
      setError(err.message || `Failed to login as ${role} (Django server might be stopped or user doesn't exist).`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !pw) {
      setError("Please enter both email/username and password.");
      return;
    }
    try {
      const u = await loginWithApi(email, pw);
      navigate({ to: dashHomeFor(u.role) });
    } catch (err: any) {
      console.warn("Django API authentication failed.", err);
      setError(err.message || "Authentication failed. Please check your credentials.");
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary-dark text-white p-10 lg:p-14 overflow-hidden hidden lg:flex flex-col justify-between">
          <FloatingOrbs />
          <div className="relative">
            <Link to="/" className="font-ui font-bold text-2xl">We Are Going</Link>
            <p className="text-white/70 text-sm mt-1">Aapni Samaj, Aapnu Network</p>
          </div>
          <div className="relative space-y-5">
            <h2 className="font-display text-4xl leading-tight">Welcome back to your community.</h2>
            <div className="space-y-3 pt-4">
              {[{i: Users, t: "1.2M+ verified members"}, {i: Heart, t: "Matrimony with admin approval"}, {i: Briefcase, t: "Jobs from samaj businesses"}, {i: ShieldCheck, t: "Aadhaar-based identity"}].map((f, i) => (
                <motion.div key={f.t} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 + i * 0.1 }} className="flex items-center gap-3 glass-dark px-4 py-3 rounded-xl">
                  <f.i className="w-5 h-5 text-gold" /><span className="text-sm">{f.t}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <p className="relative text-xs text-white/60">© 2026 We Are Going. All rights reserved.</p>
        </div>
        <div className="flex items-center justify-center p-6 lg:p-12 bg-sand">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full max-w-md bg-surface rounded-2xl shadow-warm-lg p-8 border border-warm">
            <h1 className="font-ui font-bold text-2xl">Welcome back 👋</h1>
            <p className="text-sm text-warm-muted mt-1">Sign in to continue to your dashboard.</p>
            
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field icon={<Mail className="w-4 h-4" />} label="Email or Phone" value={email} onChange={setEmail} type="text" placeholder="you@samaj.in" />
              <div className="relative">
                <Field icon={<Lock className="w-4 h-4" />} label="Password" value={pw} onChange={setPw} type={show ? "text" : "password"} placeholder="••••••••" />
                <button type="button" onClick={() => setShow(v => !v)} className="absolute right-3 top-9 text-warm-muted">{show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              </div>
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" className="rounded" />Remember me</label>
                <a href="#" className="text-primary font-medium">Forgot password?</a>
              </div>
              <button className="w-full py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition shadow-sapphire">Sign In</button>

              <button type="button" className="w-full py-3 rounded-xl border border-warm text-sm font-medium">Login with OTP</button>
            </form>
            <div className="relative my-6 text-center"><span className="bg-surface relative px-3 text-xs text-warm-muted">OR</span><div className="absolute left-0 right-0 top-1/2 border-t border-warm -z-0" /></div>
            <div className="grid grid-cols-2 gap-2 text-sm"><button className="py-2 rounded-lg border border-warm">Google</button><button className="py-2 rounded-lg border border-warm">Facebook</button></div>
            <div className="mt-6 p-4 rounded-xl bg-gold-light border border-amber-200">
              <div className="flex items-center gap-2 text-xs font-semibold text-gold mb-2"><Sparkles className="w-3 h-3" /> DEMO QUICK LOGIN</div>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => quickLogin("member")} className="py-2 rounded-lg bg-surface text-xs font-medium border border-warm hover:border-primary">Member</button>
                <button onClick={() => quickLogin("community_admin")} className="py-2 rounded-lg bg-surface text-xs font-medium border border-warm hover:border-primary">Samaj Admin</button>
                <button onClick={() => quickLogin("super_admin")} className="py-2 rounded-lg bg-surface text-xs font-medium border border-warm hover:border-primary">Super Admin</button>
              </div>
            </div>
            <p className="text-center text-sm text-warm-muted mt-6">No account? <Link to="/register" className="text-primary font-medium">Register</Link></p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}

function Field({ icon, label, value, onChange, type = "text", placeholder }: any) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="relative">
      <motion.label animate={focus || value ? { y: -22, scale: 0.85, color: "var(--primary)" } : { y: 0, scale: 1, color: "var(--muted-foreground)" }} className="absolute left-9 top-2.5 text-sm pointer-events-none origin-left">{label}</motion.label>
      <div className="absolute left-3 top-3 text-warm-muted">{icon}</div>
      <input value={value} onChange={e => onChange(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} type={type} placeholder={focus ? placeholder : ""} className="w-full pl-9 pr-3 pt-5 pb-2 rounded-xl border border-warm bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none" />
    </div>
  );
}
