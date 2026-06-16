import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";
import { cn, hasPermission } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FileText, Globe, MessageSquare, Info, Upload, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/community-admin/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  const { user, refreshUser } = useAuth();
  const [community, setCommunity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [formData, setFormData] = useState<any>({});
  const logoFileRef = useRef<File | null>(null);
  const coverFileRef = useRef<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.communityId) {
      loadCommunity(String(user.communityId));
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadCommunity = (id: string) => {
    api.getCommunity(id)
      .then(res => {
        setCommunity(res);
        setFormData({
          name: res.name || "",
          caste: res.caste || "",
          sub_caste: res.sub_caste || "",
          est_year: res.est_year || "",
          registration_no: res.registration_no || "",
          website: res.website || "",
          social_fb: res.social_fb || "",
          social_tw: res.social_tw || "",
          social_yt: res.social_yt || "",
          email: res.email || "",
          phone: res.phone || "",
          office_address: res.office_address || "",
          vision_mission: res.vision_mission || "",
          desc: res.desc || ""
        });
        setLogoPreview(res.logo || res.logo_url || null);
        setCoverPreview(res.cover || res.cover_url || null);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load community details", err);
        setLoading(false);
      });
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!community) return;
    setSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const fd = new FormData();
      Object.keys(formData).forEach(key => {
        fd.append(key, formData[key] || "");
      });

      if (logoFileRef.current) fd.append("logo", logoFileRef.current);
      if (coverFileRef.current) fd.append("cover", coverFileRef.current);
      const updatedComm = await api.updateCommunity(community.id, fd);
      await refreshUser();
      
      console.log(`\n[COMMUNITY UPDATE REQUEST]\nCommunity ID: ${community.id}\n`);
      console.log(`[DATABASE UPDATED]\nlogo_url=${updatedComm.logo || updatedComm.logo_url || "None"}\ncover_url=${updatedComm.cover || updatedComm.cover_url || "None"}\n`);
      console.log(`[COMMUNITY CONTEXT REFRESHED]\n`);
      window.dispatchEvent(new CustomEvent('community-updated', { detail: { id: community.id } }));
      
      setSuccessMsg("Community profile updated successfully! The changes are now live.");
      // Reload to reflect new URLs and clear file refs
      loadCommunity(community.id);
      logoFileRef.current = null;
      coverFileRef.current = null;
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save community settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (community) loadCommunity(community.id);
    logoFileRef.current = null;
    coverFileRef.current = null;
  };

  if (loading) {
    return (
      <PageWrap title="Community Profile Management">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap title="Community Profile Management" desc="Manage your community's identity, branding, and details visible across the network.">
      
      {successMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-teal/10 border border-teal/30 text-teal-800 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{successMsg}</p>
        </motion.div>
      )}

      {errorMsg && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3">
          <XCircle className="w-5 h-5 flex-shrink-0" />
          <p className="font-medium text-sm">{errorMsg}</p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 pb-20">
        
        {/* Branding & Visuals */}
        <AnimatedCard className="p-6 border border-warm lg:col-span-2">
          <h3 className="font-ui font-semibold mb-6 text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Branding & Assets
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <label className="text-sm font-medium block mb-2 text-foreground">Community Logo</label>
              <label className="cursor-pointer block relative group w-32 h-32">
                <div className="w-full h-full rounded-2xl bg-sand border-2 border-dashed border-warm hover:border-primary flex flex-col items-center justify-center overflow-hidden transition relative shadow-sm">
                  {logoPreview ? (
                    <>
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition backdrop-blur-[2px]">
                        Change Logo
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-warm-muted mb-1" />
                      <span className="text-[10px] text-warm-muted font-medium text-center px-2">Upload Square Logo (PNG/JPG)</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      logoFileRef.current = file;
                      setLogoPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2 text-foreground">Cover Banner</label>
              <label className="cursor-pointer block relative group w-full h-32 max-w-sm">
                <div className="w-full h-full rounded-xl bg-sand border-2 border-dashed border-warm hover:border-primary flex flex-col items-center justify-center overflow-hidden transition relative shadow-sm">
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold transition backdrop-blur-[2px]">
                        Change Banner
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-warm-muted mb-1" />
                      <span className="text-[10px] text-warm-muted font-medium text-center px-2">Upload Horizontal Banner</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      coverFileRef.current = file;
                      setCoverPreview(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            </div>
          </div>
        </AnimatedCard>

        {/* General Details */}
        <AnimatedCard className="p-6 border border-warm">
          <h3 className="font-ui font-semibold mb-4 text-foreground flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            General Information
          </h3>
          <div className="space-y-4">
            <Field l="Community Name" v={formData.name} onChange={(val) => handleFieldChange("name", val)} />
            
            <div>
              <label className="text-xs font-medium block mb-1 text-foreground">Public Description</label>
              <textarea
                value={formData.desc}
                onChange={(e) => handleFieldChange("desc", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm bg-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition"
                rows={3}
                placeholder="Briefly describe your community..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field l="Caste" v={formData.caste} onChange={(val) => handleFieldChange("caste", val)} />
              <Field l="Sub-Caste" v={formData.sub_caste} onChange={(val) => handleFieldChange("sub_caste", val)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field l="Established Year" v={formData.est_year} type="number" onChange={(val) => handleFieldChange("est_year", val)} />
              <Field l="Registration Number" v={formData.registration_no} onChange={(val) => handleFieldChange("registration_no", val)} />
            </div>
          </div>
        </AnimatedCard>

        {/* Contact & Location Details */}
        <AnimatedCard className="p-6 border border-warm">
          <h3 className="font-ui font-semibold mb-4 text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Contact & Location Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field l="Office Email" v={formData.email} type="email" onChange={(val) => handleFieldChange("email", val)} />
              <Field l="Office Phone" v={formData.phone} onChange={(val) => handleFieldChange("phone", val)} />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-foreground">Office Address</label>
              <textarea
                value={formData.office_address}
                onChange={(e) => handleFieldChange("office_address", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm bg-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition"
                rows={2}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field l="Village/City" v={formData.village} onChange={(val) => handleFieldChange("village", val)} />
              <Field l="Taluka" v={formData.taluka} onChange={(val) => handleFieldChange("taluka", val)} />
              <Field l="District" v={formData.district} onChange={(val) => handleFieldChange("district", val)} />
            </div>
            <Field l="State" v={formData.state} onChange={(val) => handleFieldChange("state", val)} />
          </div>
        </AnimatedCard>

        {/* Vision & Web */}
        <AnimatedCard className="p-6 border border-warm lg:col-span-2">
          <h3 className="font-ui font-semibold mb-4 text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Online Presence & Vision
          </h3>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Field l="Website URL" v={formData.website} type="url" onChange={(val) => handleFieldChange("website", val)} />
              <div className="grid grid-cols-3 gap-3">
                <Field l="Facebook" v={formData.social_fb} onChange={(val) => handleFieldChange("social_fb", val)} />
                <Field l="Twitter" v={formData.social_tw} onChange={(val) => handleFieldChange("social_tw", val)} />
                <Field l="YouTube" v={formData.social_yt} onChange={(val) => handleFieldChange("social_yt", val)} />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-foreground">Vision & Mission</label>
              <textarea
                value={formData.vision_mission}
                onChange={(e) => handleFieldChange("vision_mission", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-warm bg-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition h-[120px]"
                placeholder="Share the community's vision and mission statement..."
              />
            </div>
          </div>
        </AnimatedCard>
      </div>

      {/* Floating Action Bar */}
      {hasPermission(user, ["Edit Community Profile"]) && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-surface/80 backdrop-blur-md border-t border-warm p-4 flex justify-end gap-3 z-40">
          <button 
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl border border-warm text-foreground font-semibold hover:bg-sand transition disabled:opacity-50"
          >
            Discard Changes
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90 shadow-md transition disabled:opacity-70 flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </button>
        </div>
      )}
    </PageWrap>
  );
}

function Field({ l, v, onChange, type = "text" }: { l: string; v: string; onChange: (val: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1 text-foreground">{l}</label>
      <input
        type={type}
        value={v}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-warm bg-surface text-sm focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition"
      />
    </div>
  );
}
