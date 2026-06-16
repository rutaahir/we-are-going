import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Users, Trash2, UserPlus, Loader2, Edit2 } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard, AvatarCircle, Modal } from "@/components/wag/primitives";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { calculateAge } from "@/lib/utils";

export const Route = createFileRoute("/dashboard/family")({
  component: FamilyPage,
});

const RELATIONS = ["Spouse", "Son", "Daughter", "Father", "Mother", "Brother", "Sister", "Other"];

function FamilyPage() {
  const { user } = useAuth();
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ 
    name: "", relation: "Spouse", birthdate: "", age: "", occupation: "",
    education: "", school: "", college: "", degree: "", field_of_study: "", passing_year: "",
    profession_type: "", job_title: "", company: "", industry: "", salary: "",
    business_name: "", business_category: "", gst_no: "", business_years: ""
  });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [birthdateError, setBirthdateError] = useState("");

  // Flatten all family members across all families for display
  const allMembers = families.flatMap(f =>
    (f.members || []).map((m: any) => ({ ...m, familyId: f.id }))
  );

  const totalCount = allMembers.length;

  const loadFamilies = async () => {
    setLoading(true);
    try {
      const data = await api.getMyFamilies();
      setFamilies(data || []);
    } catch (e) {
      console.error("Failed to load families", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFamilies(); }, []);

  const handleAdd = async () => {
    if (!form.name.trim()) return;

    if (form.birthdate) {
      const birthDate = new Date(form.birthdate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        alert("Birthdate cannot be in the future.");
        return;
      }
    }

    setSaving(true);
    try {
      // Find or create the family group for this user
      let family = families[0];
      if (!family) {
        // Create a new family group
        family = await api.createFamily({
          head: user?.name || "Family Head",
          village: "",
        });
        setFamilies([family]);
      }

      const payload = {
        family: family.id,
        name: form.name,
        relation: form.relation,
        birthdate: form.birthdate || null,
        age: form.age ? parseInt(form.age) : null,
        occupation: form.occupation,
        education: form.education,
        school: form.school,
        college: form.college,
        degree: form.degree,
        field_of_study: form.field_of_study,
        passing_year: form.passing_year,
        profession_type: form.profession_type,
        job_title: form.job_title,
        company: form.company,
        industry: form.industry,
        salary: form.salary,
        business_name: form.business_name,
        business_category: form.business_category,
        gst_no: form.gst_no,
        business_years: form.business_years,
      };

      if (editingId) {
        await api.updateFamilyMember(editingId, payload);
      } else {
        await api.addFamilyMember(payload);
      }

      setForm({ 
        name: "", relation: "Spouse", birthdate: "", age: "", occupation: "",
        education: "", school: "", college: "", degree: "", field_of_study: "", passing_year: "",
        profession_type: "", job_title: "", company: "", industry: "", salary: "",
        business_name: "", business_category: "", gst_no: "", business_years: ""
      });
      setOpen(false);
      setEditingId(null);
      await loadFamilies();
    } catch (e) {
      console.error("Failed to add member", e);
      alert("Failed to add member. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (memberId: number) => {
    if (!confirm("Remove this family member?")) return;
    setDeletingId(memberId);
    try {
      await api.deleteFamilyMember(memberId);
      await loadFamilies();
    } catch (e) {
      console.error("Failed to delete member", e);
      alert("Failed to remove member. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const openEdit = (m: any) => {
    setEditingId(m.id);
    const initialBirthdate = m.birthdate || "";
    let initialAge = "";
    let initialError = "";

    if (initialBirthdate) {
      const birthDate = new Date(initialBirthdate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (birthDate > today) {
        initialError = "Birthdate cannot be in the future.";
      } else {
        initialAge = m.age ? m.age.toString() : calculateAge(initialBirthdate);
      }
    }

    setBirthdateError(initialError);
    setForm({
      name: m.name || "",
      relation: m.relation || "Spouse",
      birthdate: initialBirthdate,
      age: initialAge,
      occupation: m.occupation || "",
      education: m.education || "",
      school: m.school || "",
      college: m.college || "",
      degree: m.degree || "",
      field_of_study: m.field_of_study || "",
      passing_year: m.passing_year || "",
      profession_type: m.profession_type || "",
      job_title: m.job_title || "",
      company: m.company || "",
      industry: m.industry || "",
      salary: m.salary || "",
      business_name: m.business_name || "",
      business_category: m.business_category || "",
      gst_no: m.gst_no || "",
      business_years: m.business_years || ""
    });
    setOpen(true);
  };

  const handleBirthdateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setBirthdateError("");
      setForm(prev => ({
        ...prev,
        birthdate: "",
        age: ""
      }));
      return;
    }

    const birthDate = new Date(val);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) {
      setBirthdateError("Birthdate cannot be in the future.");
      setForm(prev => ({
        ...prev,
        birthdate: val,
        age: ""
      }));
    } else {
      setBirthdateError("");
      const calculatedAge = calculateAge(val);
      setForm(prev => ({
        ...prev,
        birthdate: val,
        age: calculatedAge
      }));
    }
  };

  return (
    <PageWrap
      title="My Family"
      desc={`${totalCount} member${totalCount !== 1 ? "s" : ""} in your family group`}
      action={
        <button
          onClick={() => {
            setEditingId(null);
            setBirthdateError("");
            setForm({ 
              name: "", relation: "Spouse", birthdate: "", age: "", occupation: "",
              education: "", school: "", college: "", degree: "", field_of_study: "", passing_year: "",
              profession_type: "", job_title: "", company: "", industry: "", salary: "",
              business_name: "", business_category: "", gst_no: "", business_years: ""
            });
            setOpen(true);
          }}
          className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold flex items-center gap-2 hover:bg-primary/90 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Member
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : allMembers.length === 0 ? (
        <AnimatedCard className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-warm-muted" />
          </div>
          <h3 className="font-ui font-semibold text-lg mb-2">No Family Members Yet</h3>
          <p className="text-warm-muted text-sm mb-5">
            Add your family members to build your family profile in the community.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition"
          >
            <UserPlus className="w-4 h-4" /> Add First Member
          </button>
        </AnimatedCard>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {allMembers.map((m: any) => (
            <AnimatedCard key={m.id} className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase tracking-wider bg-gold-light text-gold px-2 py-0.5 rounded-full font-semibold">
                  {m.relation}
                </span>
                <div className="flex items-center gap-1 text-warm-muted">
                  <button
                    onClick={() => openEdit(m)}
                    className="hover:text-primary transition p-1"
                    title="Edit member"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="hover:text-red-500 transition disabled:opacity-50 p-1"
                    title="Remove member"
                  >
                    {deletingId === m.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <AvatarCircle name={m.name} size={64} />
              <h3 className="font-ui font-semibold mt-3">{m.name}</h3>
              <div className="text-xs text-warm-muted mt-1">
                {m.age ? `Age ${m.age}` : ""}
                {m.age && m.occupation ? " · " : ""}
                {m.occupation}
              </div>
              <div className="mt-4 pt-3 border-t border-warm flex items-center justify-between">
                <label className="text-xs flex items-center gap-1.5 cursor-pointer text-warm-muted">
                  <input type="checkbox" className="rounded" /> Login access
                </label>
                <span className="text-[10px] bg-teal/10 text-teal px-2 py-0.5 rounded-full font-medium">
                  Member
                </span>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Add/Edit Member Modal */}
      <Modal open={open} onClose={() => { if (!saving) setOpen(false); }} title={editingId ? "Edit Family Member" : "Add Family Member"}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              placeholder="e.g. Priya Shah"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 text-sm transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Relation</label>
            <select
              value={form.relation}
              onChange={e => setForm({ ...form, relation: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-warm bg-white focus:outline-none focus:border-primary text-sm"
            >
              {RELATIONS.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Birthdate</label>
              <input
                type="date"
                value={form.birthdate}
                onChange={handleBirthdateChange}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
              {birthdateError && (
                <p className="text-red-500 text-xs font-semibold mt-1">{birthdateError}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Age (Auto-filled)</label>
              <input
                placeholder="e.g. 28"
                type="number"
                min={0}
                max={120}
                value={form.age}
                readOnly
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-sand/30 cursor-not-allowed opacity-75 focus:outline-none text-sm transition"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Occupation</label>
            <input
              placeholder="e.g. Teacher"
              value={form.occupation}
              onChange={e => setForm({ ...form, occupation: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
            />
          </div>

          <hr className="border-warm my-4" />
          <h4 className="font-ui font-semibold text-sm">Educational Details</h4>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Education Level</label>
              <input
                placeholder="e.g. Bachelors"
                value={form.education}
                onChange={e => setForm({ ...form, education: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Degree</label>
              <input
                placeholder="e.g. B.Tech"
                value={form.degree}
                onChange={e => setForm({ ...form, degree: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">College/University</label>
              <input
                placeholder="e.g. L.D. College of Engineering"
                value={form.college}
                onChange={e => setForm({ ...form, college: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
            </div>
          </div>

          <hr className="border-warm my-4" />
          <h4 className="font-ui font-semibold text-sm">Professional Details</h4>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Job Title</label>
              <input
                placeholder="e.g. Software Engineer"
                value={form.job_title}
                onChange={e => setForm({ ...form, job_title: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Company</label>
              <input
                placeholder="e.g. Google"
                value={form.company}
                onChange={e => setForm({ ...form, company: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
            </div>
          </div>
          
          <hr className="border-warm my-4" />
          <h4 className="font-ui font-semibold text-sm">Business Details (If applicable)</h4>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Business Name</label>
              <input
                placeholder="e.g. Shah Enterprises"
                value={form.business_name}
                onChange={e => setForm({ ...form, business_name: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">Category</label>
              <input
                placeholder="e.g. Retail"
                value={form.business_category}
                onChange={e => setForm({ ...form, business_category: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-warm-muted uppercase tracking-wider mb-1">GST No.</label>
              <input
                placeholder="e.g. 24AAAAA0000A1Z5"
                value={form.gst_no}
                onChange={e => setForm({ ...form, gst_no: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-warm bg-surface focus:outline-none focus:border-primary text-sm transition"
              />
            </div>
          </div>

          <button
            onClick={handleAdd}
            disabled={!form.name.trim() || saving}
            className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : "✓ Save Member"}
          </button>
        </div>
      </Modal>
    </PageWrap>
  );
}
