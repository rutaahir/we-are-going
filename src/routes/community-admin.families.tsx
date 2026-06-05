import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { MapPin, Users, ChevronRight, Loader2, UserPlus, Briefcase, Crown, TreePine } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, Modal } from "@/components/wag/primitives";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { motion } from "framer-motion";

export const Route = createFileRoute("/community-admin/families")({
  component: FamiliesPage,
});

/* ─── Relation-based styling map ─── */
const relationConfig: Record<string, { color: string; bg: string; border: string; icon: string }> = {
  spouse:   { color: "text-rose-600",    bg: "bg-rose-50",    border: "border-rose-200",  icon: "💑" },
  father:   { color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200", icon: "👨" },
  mother:   { color: "text-pink-600",    bg: "bg-pink-50",    border: "border-pink-200",  icon: "👩" },
  son:      { color: "text-blue-600",    bg: "bg-blue-50",    border: "border-blue-200",  icon: "👦" },
  daughter: { color: "text-purple-600",  bg: "bg-purple-50",  border: "border-purple-200",icon: "👧" },
  brother:  { color: "text-indigo-600",  bg: "bg-indigo-50",  border: "border-indigo-200",icon: "🧑" },
  sister:   { color: "text-violet-600",  bg: "bg-violet-50",  border: "border-violet-200",icon: "👱‍♀️" },
  other:    { color: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200", icon: "👤" },
};

function getRelationStyle(relation: string) {
  return relationConfig[relation?.toLowerCase()] || relationConfig.other;
}

/* ─── Group members by generation tier ─── */
function groupByGeneration(members: any[]) {
  const parents: any[] = [];
  const spouse: any[] = [];
  const children: any[] = [];
  const siblings: any[] = [];
  const others: any[] = [];

  members.forEach(m => {
    const r = (m.relation || "").toLowerCase();
    if (r === "father" || r === "mother") parents.push(m);
    else if (r === "spouse") spouse.push(m);
    else if (r === "son" || r === "daughter") children.push(m);
    else if (r === "brother" || r === "sister") siblings.push(m);
    else others.push(m);
  });

  return { parents, spouse, children, siblings, others };
}

/* ─── Tree Member Card ─── */
function TreeMemberCard({ member, index }: { member: any; index: number }) {
  const style = getRelationStyle(member.relation);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15 + index * 0.08, type: "spring", stiffness: 300, damping: 24 }}
      className={`relative group flex items-center gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border-2 ${style.border} ${style.bg} 
        hover:shadow-lg hover:scale-[1.03] transition-all duration-300 cursor-default w-full`}
    >
      {/* Glow effect on hover */}
      <div className={`absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${style.bg} blur-xl -z-10`} />
      
      <div className="relative shrink-0">
        <AvatarCircle name={member.name} size={36} />
        <span className="absolute -bottom-1 -right-1 text-xs sm:text-sm">{style.icon}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-xs sm:text-sm truncate text-gray-800">{member.name}</div>
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 mt-0.5">
          <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider ${style.color}`}>
            {member.relation}
          </span>
          {member.age && (
            <span className="text-[9px] sm:text-[10px] text-gray-400">· {member.age}y</span>
          )}
        </div>
        {member.occupation && (
          <div className="flex items-center gap-1 mt-0.5">
            <Briefcase className="w-2.5 h-2.5 text-gray-400 shrink-0" />
            <span className="text-[9px] sm:text-[10px] text-gray-500 truncate">{member.occupation}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─── Tree Branch connector (vertical + horizontal lines) ─── */
function TreeBranch({ label, members, color, delay = 0 }: { label: string; members: any[]; color: string; delay?: number }) {
  if (members.length === 0) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="flex flex-col items-center"
    >
      {/* Branch label */}
      <div className="flex items-center gap-2 mb-3">
        <div className={`h-px flex-1 min-w-[40px] ${color}`} />
        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gray-400 whitespace-nowrap">{label}</span>
        <div className={`h-px flex-1 min-w-[40px] ${color}`} />
      </div>
      
      {/* Branch line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.4 }}
        className={`w-0.5 h-6 ${color} origin-top`}
      />
      
      {/* Horizontal connector */}
      {members.length > 1 && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: delay + 0.2, duration: 0.4 }}
          className={`h-0.5 ${color} self-stretch mx-8 origin-left`}
        />
      )}
      
      {/* Member cards */}
      <div className="flex flex-wrap justify-center gap-3 mt-2">
        {members.map((m: any, i: number) => (
          <div key={m.id || i} className="relative flex flex-col items-center">
            {/* Individual vertical line to card */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: delay + 0.3 + i * 0.05, duration: 0.3 }}
              className={`w-0.5 h-4 ${color} origin-top`}
            />
            <TreeMemberCard member={m} index={i} />
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ─── The Full Family Tree Visual ─── */
function FamilyTreeVisual({ family }: { family: any }) {
  const members = family.members || [];
  const grouped = groupByGeneration(members);
  
  return (
    <div className="relative py-6 overflow-x-auto">
      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-emerald-50/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-gradient-to-t from-amber-50/80 to-transparent blur-2xl" />
      </div>

      <div className="relative flex flex-col items-center gap-2 min-w-[360px]">
        
        {/* ═══ Parents (elder generation) ═══ */}
        {grouped.parents.length > 0 && (
          <>
            <TreeBranch label="Elders" members={grouped.parents} color="bg-amber-300" delay={0} />
            {/* trunk segment */}
            <motion.div
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="w-1 h-8 rounded-full bg-gradient-to-b from-amber-300 to-emerald-400 origin-top"
            />
          </>
        )}

        {/* ═══ HEAD OF FAMILY (Root / Trunk) ═══ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 250, damping: 20 }}
          className="relative z-10"
        >
          {/* Decorative rings */}
          <div className="absolute -inset-3 rounded-full border-2 border-dashed border-emerald-200 animate-[spin_20s_linear_infinite] opacity-50" />
          <div className="absolute -inset-6 rounded-full border border-dashed border-emerald-100 animate-[spin_30s_linear_infinite_reverse] opacity-30" />
          
          <div className="relative flex flex-col items-center p-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-amber-50 border-2 border-emerald-300 shadow-xl shadow-emerald-100/50">
            {/* Crown icon */}
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
              className="absolute -top-4 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full p-1.5 shadow-lg shadow-amber-200/50"
            >
              <Crown className="w-4 h-4 text-white" />
            </motion.div>
            
            <AvatarCircle name={family.head} size={72} />
            <div className="mt-3 text-center">
              <div className="font-bold text-lg text-gray-800 font-ui">{family.head}</div>
              <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mt-0.5">Head of Family</div>
              {family.village && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-400 mt-1">
                  <MapPin className="w-3 h-3" /> {family.village}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* ═══ Trunk from head ═══ */}
        {(grouped.spouse.length > 0 || grouped.children.length > 0 || grouped.siblings.length > 0 || grouped.others.length > 0) && (
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="w-1 h-8 rounded-full bg-gradient-to-b from-emerald-400 to-emerald-300 origin-top"
          />
        )}

        {/* ═══ Spouse ═══ */}
        {grouped.spouse.length > 0 && (
          <>
            <TreeBranch label="Spouse" members={grouped.spouse} color="bg-rose-300" delay={0.6} />
            {(grouped.children.length > 0 || grouped.siblings.length > 0 || grouped.others.length > 0) && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 0.9, duration: 0.4 }}
                className="w-1 h-8 rounded-full bg-gradient-to-b from-rose-300 to-blue-300 origin-top"
              />
            )}
          </>
        )}

        {/* ═══ Siblings ═══ */}
        {grouped.siblings.length > 0 && (
          <>
            <TreeBranch label="Siblings" members={grouped.siblings} color="bg-indigo-300" delay={0.8} />
            {(grouped.children.length > 0 || grouped.others.length > 0) && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 1.0, duration: 0.4 }}
                className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-300 to-blue-300 origin-top"
              />
            )}
          </>
        )}

        {/* ═══ Children ═══ */}
        {grouped.children.length > 0 && (
          <TreeBranch label="Children" members={grouped.children} color="bg-blue-300" delay={1.0} />
        )}

        {/* ═══ Others ═══ */}
        {grouped.others.length > 0 && (
          <>
            {grouped.children.length > 0 && (
              <motion.div
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ delay: 1.2, duration: 0.4 }}
                className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-300 to-slate-300 origin-top"
              />
            )}
            <TreeBranch label="Others" members={grouped.others} color="bg-slate-300" delay={1.2} />
          </>
        )}

        {/* ═══ Roots decoration at the bottom ═══ */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="flex items-center gap-1 mt-4 text-gray-300"
        >
          <TreePine className="w-4 h-4" />
          <span className="text-[10px] uppercase tracking-[0.15em] font-semibold">Family Tree</span>
          <TreePine className="w-4 h-4" />
        </motion.div>

        {/* Empty state */}
        {members.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center py-8 text-gray-400"
          >
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <UserPlus className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium">No family members added yet</p>
            <p className="text-xs mt-1">Members can add family from their dashboard</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════════ */
function FamiliesPage() {
  const { user } = useAuth();
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<any | null>(null);

  const loadFamilies = async () => {
    setLoading(true);
    try {
      // Community admins: fetch by community ID
      const communityId = user?.communityId;
      let data: any[] = [];
      if (communityId) {
        data = await apiFetchFamilies(communityId);
      } else {
        data = await api.getMyFamilies();
      }
      setFamilies(data || []);
    } catch (e) {
      console.error("Failed to load families", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFamilies(); }, [user?.communityId]);

  const totalMembers = families.reduce((sum, f) => sum + (f.members?.length || 0), 0);

  return (
    <PageWrap
      title="Families"
      desc={`${families.length} family group${families.length !== 1 ? "s" : ""} in your samaj`}
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : families.length === 0 ? (
        <AnimatedCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-warm-muted" />
          </div>
          <h3 className="font-ui font-semibold text-lg mb-2">No Families Registered</h3>
          <p className="text-warm-muted text-sm">
            Members can add their family groups from their member dashboard.
          </p>
        </AnimatedCard>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <AnimatedCard className="p-5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary to-primary/50" />
              <div className="text-3xl font-bold text-primary font-ui">{families.length}</div>
              <div className="text-xs text-warm-muted mt-1.5 uppercase tracking-wider font-semibold">Family Groups</div>
            </AnimatedCard>
            <AnimatedCard className="p-5 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal via-teal to-teal/50" />
              <div className="text-3xl font-bold text-teal font-ui">{totalMembers}</div>
              <div className="text-xs text-warm-muted mt-1.5 uppercase tracking-wider font-semibold">Total Members</div>
            </AnimatedCard>
            <AnimatedCard className="p-5 text-center col-span-2 sm:col-span-1 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gold via-gold to-gold/50" />
              <div className="text-3xl font-bold text-gold font-ui">
                {totalMembers > 0 ? (totalMembers / families.length).toFixed(1) : "0"}
              </div>
              <div className="text-xs text-warm-muted mt-1.5 uppercase tracking-wider font-semibold">Avg per Family</div>
            </AnimatedCard>
          </div>

          {/* Family Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {families.map(f => (
              <AnimatedCard key={f.id} className="p-5 relative overflow-hidden">
                {/* Decorative leaf pattern */}
                <div className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-gradient-to-br from-emerald-50 to-transparent opacity-60" />
                
                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <AvatarCircle name={f.head} size={44} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                          <Crown className="w-2.5 h-2.5 text-white" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-ui font-semibold text-sm">{f.head}</h3>
                        {f.village && (
                          <div className="text-[11px] text-warm-muted flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" /> {f.village}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider border border-emerald-200">
                      {f.members?.length || 0} members
                    </span>
                  </div>

                  {/* Mini tree preview */}
                  {f.members && f.members.length > 0 && (
                    <div className="flex items-center gap-1 mt-3 mb-3">
                      <div className="flex -space-x-2">
                        {f.members.slice(0, 4).map((m: any, i: number) => (
                          <div key={i} className="relative" style={{ zIndex: 4 - i }}>
                            <AvatarCircle name={m.name} size={30} />
                          </div>
                        ))}
                      </div>
                      {f.members.length > 4 && (
                        <div className="w-[30px] h-[30px] rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-gray-500">
                          +{f.members.length - 4}
                        </div>
                      )}
                      <div className="flex-1 flex items-center gap-1 ml-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-emerald-200 to-transparent" />
                        <TreePine className="w-3 h-3 text-emerald-300" />
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => setOpen(f)}
                    className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-50 to-amber-50 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-2 
                      hover:from-emerald-100 hover:to-amber-100 hover:border-emerald-300 hover:shadow-md
                      text-emerald-700 transition-all duration-300 group"
                  >
                    <TreePine className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                    View Family Tree
                    <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </AnimatedCard>
            ))}
          </div>
        </>
      )}

      {/* ═══ Family Tree Modal ═══ */}
      <Modal open={!!open} onClose={() => setOpen(null)} title={`🌳 ${open?.head}'s Family Tree`} size="xl">
        {open && <FamilyTreeVisual family={open} />}
      </Modal>
    </PageWrap>
  );
}

// Fetch families by community_id using auth token
async function apiFetchFamilies(communityId: any): Promise<any[]> {
  const token = localStorage.getItem("wag_token");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
  const res = await fetch(`${BASE}/families/?community_id=${communityId}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) return [];
  return res.json();
}
