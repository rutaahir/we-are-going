import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { FileText, Globe, MessageSquare, Info } from "lucide-react";

export const Route = createFileRoute("/community-admin/settings")({
  component: SettingsComponent,
});

function SettingsComponent() {
  const { user } = useAuth();
  const [community, setCommunity] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.communityId) {
      api.getCommunity(String(user.communityId))
        .then(res => {
          setCommunity(res);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load community details", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <PageWrap title="Community Settings">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </PageWrap>
    );
  }

  return (
    <PageWrap title="Community Settings" desc="Manage and review your community information and registration details">
      <div className="grid lg:grid-cols-2 gap-6">
        {/* General Details & Settings */}
        <AnimatedCard className="p-6 border border-warm">
          <h3 className="font-ui font-semibold mb-4 text-foreground flex items-center gap-2">
            <Info className="w-5 h-5 text-primary" />
            General Information
          </h3>
          <div className="space-y-4">
            <Field l="Community Name" v={community?.name || user?.communityName || ""} readOnly />
            <div className="grid grid-cols-2 gap-4">
              <Field l="Caste" v={community?.caste || "N/A"} readOnly />
              <Field l="Sub-Caste" v={community?.sub_caste || "N/A"} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field l="Established Year" v={String(community?.est_year || community?.estYear || "N/A")} readOnly />
              <Field l="Registration Number" v={community?.registration_no || community?.registrationNo || "N/A"} readOnly />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field l="Community Type" v={community?.type || "N/A"} readOnly />
              <Field l="Parent Community" v={community?.parent_name || "None (Apex)"} readOnly />
            </div>
          </div>
        </AnimatedCard>

        {/* Branding & Visuals */}
        <AnimatedCard className="p-6 border border-warm">
          <h3 className="font-ui font-semibold mb-4 text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Branding & Web
          </h3>
          <div className="space-y-4">
            <Field l="Website URL" v={community?.website || "N/A"} readOnly />
            <Field l="Logo URL" v={community?.logo_url || community?.logo || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=120"} readOnly />
            <Field l="Cover Image URL" v={community?.cover_url || community?.cover || "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800"} readOnly />
            <div className="grid grid-cols-3 gap-2">
              <Field l="Facebook" v={community?.social_fb || community?.socialFb || "N/A"} readOnly />
              <Field l="Twitter" v={community?.social_tw || community?.socialTw || "N/A"} readOnly />
              <Field l="YouTube" v={community?.social_yt || community?.socialYt || "N/A"} readOnly />
            </div>
          </div>
        </AnimatedCard>

        {/* Contact & Location Details */}
        <AnimatedCard className="p-6 border border-warm">
          <h3 className="font-ui font-semibold mb-4 text-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            Contact & Office Details
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field l="Office Email" v={community?.email || "N/A"} readOnly />
              <Field l="Office Phone" v={community?.phone || "N/A"} readOnly />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-warm-muted">Office Address</label>
              <textarea
                value={community?.office_address || community?.officeAddress || "N/A"}
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-warm bg-sand/10 text-sm focus:outline-none"
                rows={3}
              />
            </div>
          </div>
        </AnimatedCard>

        {/* Vision & Mission / Additional Info */}
        <AnimatedCard className="p-6 border border-warm">
          <h3 className="font-ui font-semibold mb-4 text-foreground flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            Vision, Mission & Documents
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium block mb-1 text-warm-muted">Vision & Mission</label>
              <textarea
                value={community?.vision_mission || community?.visionMission || "N/A"}
                readOnly
                className="w-full px-3 py-2 rounded-lg border border-warm bg-sand/10 text-sm focus:outline-none"
                rows={3}
              />
            </div>
            {community?.doc_name && (
              <div>
                <label className="text-xs font-medium block mb-1 text-warm-muted">Verification Document Reference</label>
                <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-850 text-sm font-semibold">
                  <FileText className="w-4 h-4 text-teal" />
                  {community.doc_name}
                </div>
              </div>
            )}
          </div>
        </AnimatedCard>
      </div>
    </PageWrap>
  );
}

function Field({ l, v, readOnly }: { l: string; v: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-xs font-medium block mb-1 text-warm-muted">{l}</label>
      <input
        value={v}
        readOnly={readOnly}
        className={`w-full px-3 py-2 rounded-lg border border-warm bg-surface text-sm ${readOnly ? 'bg-sand/10 outline-none' : ''}`}
      />
    </div>
  );
}
