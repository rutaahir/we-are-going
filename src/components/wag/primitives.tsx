"use client";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/* ---------- AnimatedCard: Clean Premium hover lift + soft glow ---------- */
export function AnimatedCard({ children, className, style, onClick }: { children: ReactNode; className?: string; style?: CSSProperties; intensity?: number; onClick?: (e: React.MouseEvent) => void }) {
  return (
    <motion.div
      whileHover={{ 
        y: -5,
        scale: 1.012,
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
      }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      style={style}
      onClick={onClick}
      className={cn("relative rounded-2xl bg-surface border border-warm shadow-warm overflow-hidden", className)}
    >
      {children}
    </motion.div>
  );
}

/* ---------- PageTransition ---------- */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.98 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- StatCard with counter ---------- */
export function StatCard({ icon, label, value, suffix = "", accent = "primary" }: { icon: ReactNode; label: string; value: number | string; suffix?: string; accent?: "primary" | "gold" | "teal" }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const [n, setN] = useState<number | string>(typeof value === 'number' ? 0 : value);
  useEffect(() => {
    if (!inView || typeof value !== 'number') {
      setN(value);
      return;
    }
    const dur = 2000; const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setN(Math.floor(value * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setN(value);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);
  const accentMap = { primary: "bg-primary/10 text-primary", gold: "bg-gold-light text-gold", teal: "bg-teal/10 text-teal" }[accent];
  const borderMap = { primary: "border-t-primary", gold: "border-t-gold", teal: "border-t-teal" }[accent];
  return (
    <AnimatedCard className={cn("p-6 border-t-4", borderMap)}>
      <div ref={ref} className="flex items-start gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0", accentMap)}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className={`font-bold font-ui truncate ${typeof value === 'string' && value.length > 10 ? 'text-xl' : 'text-3xl'}`}>
            {typeof n === 'number' ? n.toLocaleString("en-IN") : n}{suffix}
          </div>
          <div className="text-sm text-warm-muted mt-1">{label}</div>
        </div>
      </div>
    </AnimatedCard>
  );
}

/* ---------- StatusBadge ---------- */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Verified: "bg-teal/15 text-teal", Active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    Pending: "bg-amber-100 text-amber-700", Rejected: "bg-red-100 text-red-700",
    Suspended: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300", Approved: "bg-teal/15 text-teal",
    Featured: "bg-gold-light text-gold", Completed: "bg-blue-100 text-blue-700",
    Upcoming: "bg-indigo-100 text-indigo-700", Ongoing: "bg-emerald-100 text-emerald-700",
    Open: "bg-emerald-100 text-emerald-700", Closed: "bg-gray-200 text-gray-700",
    Success: "bg-emerald-100 text-emerald-700", Failed: "bg-red-100 text-red-700",
    Refunded: "bg-amber-100 text-amber-700", Expired: "bg-gray-200 text-gray-700",
    Scheduled: "bg-blue-100 text-blue-700", Empty: "bg-gray-100 text-gray-500",
    Trial: "bg-violet-100 text-violet-700", Cancelled: "bg-red-100 text-red-700",
    Draft: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    "Ready For Review": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    Hidden: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", map[status] || "bg-gray-100 text-gray-700")}>{status}</span>;
}

/* ---------- PlanBadge ---------- */
export function PlanBadge({ plan }: { plan: string }) {
  const map: Record<string, string> = {
    Free: "bg-gray-100 text-gray-700 border-gray-200",
    Basic: "bg-blue-50 text-blue-700 border-blue-200",
    Pro: "bg-gold-light text-gold border-amber-300",
    Enterprise: "bg-gradient-to-r from-primary to-primary-dark text-white border-gold",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", map[plan])}>{plan}</span>;
}

/* ---------- AvatarCircle ---------- */
import { getImageUrl } from "@/lib/api";

export function AvatarCircle({ name, src, size = 40 }: { name: string; src?: string; size?: number }) {
  const colors = ["bg-blue-500", "bg-emerald-500", "bg-rose-500", "bg-violet-500", "bg-amber-500", "bg-teal-500", "bg-indigo-500"];
  const hash = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  if (src) return <img src={getImageUrl(src)} alt={name} loading="lazy" style={{ width: size, height: size }} className="rounded-full object-cover border-2 border-warm shadow-sm" />;
  return <div style={{ width: size, height: size, fontSize: size * 0.4 }} className={cn("rounded-full flex items-center justify-center text-white font-semibold", colors[hash % colors.length])}>{initials}</div>;
}

/* ---------- ProgressRing ---------- */
export function ProgressRing({ value, size = 80, stroke = 8, label }: { value: number; size?: number; stroke?: number; label?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (value / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--primary)" strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: off }} transition={{ duration: 1.4, ease: "easeOut" }} />
      </svg>
      <div className="absolute text-center"><div className="text-lg font-bold font-ui">{value}%</div>{label && <div className="text-[10px] text-warm-muted">{label}</div>}</div>
    </div>
  );
}

/* ---------- EmptyState ---------- */
export function EmptyState({ icon, title, desc, action }: { icon: ReactNode; title: string; desc?: string; action?: ReactNode }) {
  return (
    <div className="text-center py-16 px-6">
      <div className="w-20 h-20 mx-auto rounded-2xl bg-gold-light flex items-center justify-center text-gold mb-4">{icon}</div>
      <h3 className="font-ui font-semibold text-lg">{title}</h3>
      {desc && <p className="text-warm-muted text-sm mt-2 max-w-sm mx-auto">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ---------- FloatingOrbs (decorative bg) ---------- */
export function FloatingOrbs() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" animate={{ x: [0, 40, 0], y: [0, 30, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] rounded-full bg-gold/20 blur-3xl" animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }} />
      <motion.div className="absolute bottom-0 left-1/2 w-80 h-80 rounded-full bg-teal/15 blur-3xl" animate={{ x: [0, 20, 0], y: [0, -30, 0] }} transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }} />
    </div>
  );
}

/* ---------- ScrollReveal ---------- */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}

/* ---------- DetailDrawer ---------- */
export function DetailDrawer({ open, onClose, children, title, size = "md" }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; size?: "md" | "lg" }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div className={cn("fixed right-0 top-0 bottom-0 w-full bg-surface z-50 shadow-2xl overflow-y-auto", size === "lg" ? "sm:w-[720px]" : "sm:w-[480px]")}
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", stiffness: 300, damping: 30 }}>
            <div className="sticky top-0 bg-surface/95 backdrop-blur border-b border-warm px-6 py-4 flex items-center justify-between z-10">
              <h3 className="font-ui font-semibold">{title}</h3>
              <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center">✕</button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ---------- ConfirmModal ---------- */
export function Modal({ open, onClose, children, title, size = "md", closeOnOverlayClick = true }: { open: boolean; onClose: () => void; children: ReactNode; title?: string; size?: "sm" | "md" | "lg" | "xl"; closeOnOverlayClick?: boolean }) {
  const sizeMap = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl", xl: "max-w-4xl" };
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={(e: React.MouseEvent) => {
          if (closeOnOverlayClick) {
            onClose();
          } else {
            e.stopPropagation();
          }
        }}>
          <motion.div className={cn("bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl w-full overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col", sizeMap[size])} initial={{ scale: 0.88, opacity: 0, y: 40 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.88, opacity: 0, y: 40 }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {title && <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-warm flex items-center justify-between shrink-0"><h3 className="font-ui font-semibold text-sm sm:text-base truncate pr-2">{title}</h3><button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-sand flex items-center justify-center shrink-0">✕</button></div>}
            <div className="p-3 sm:p-6 overflow-y-auto flex-1">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ---------- Skeleton ---------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-md", className)} />;
}

/* ---------- StepWizard progress ---------- */
export function StepProgress({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {steps.map((s, i) => (
        <div key={s} className="flex-1 flex items-center gap-2">
          <motion.div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap",
            i < current ? "bg-teal/15 text-teal" : i === current ? "bg-primary text-white" : "bg-sand text-warm-muted")}
            animate={i === current ? { scale: [1, 1.05, 1] } : {}}>
            <span className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[10px]">{i < current ? "✓" : i + 1}</span>
            <span className="hidden sm:inline">{s}</span>
          </motion.div>
          {i < steps.length - 1 && <div className={cn("flex-1 h-0.5", i < current ? "bg-teal" : "bg-warm")} />}
        </div>
      ))}
    </div>
  );
}
