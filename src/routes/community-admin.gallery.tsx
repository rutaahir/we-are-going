import { createFileRoute } from "@tanstack/react-router";
import { Upload } from "lucide-react";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";

const PHOTOS = ["1530023367847-a683933f4172","1531415074968-036ba1b575da","1519741497674-611481863552","1615461066841-6116e61058f4","1523050854058-8df90110c9f1","1573164574511-73c773193279","1576091160399-112ba8d25d1d","1559643014-aab6c39e2bb1","1572976108-7bcd0a5e9bcd","1545205597-3d9d02c29597","1494790108377-be9c29b29330","1438761681033-6461ffad8d80"];

export const Route = createFileRoute("/community-admin/gallery")({
  component: () => (
    <PageWrap title="Gallery" desc="Community photo albums" action={<input placeholder="Album name" className="px-3 py-2 rounded-lg border border-warm bg-surface text-sm" />}>
      <label className="block border-2 border-dashed border-warm rounded-2xl p-10 text-center cursor-pointer hover:border-primary bg-surface mb-6"><Upload className="w-10 h-10 mx-auto text-warm-muted" /><div className="mt-3 font-medium">Drag photos here or click to upload</div><div className="text-xs text-warm-muted mt-1">JPG, PNG up to 10MB each · Bulk upload supported</div><input type="file" multiple className="hidden" /></label>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">{PHOTOS.map(p => (
        <AnimatedCard key={p} className="aspect-square overflow-hidden cursor-pointer group"><img src={`https://images.unsplash.com/photo-${p}?w=400&h=400&fit=crop`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition" /></AnimatedCard>
      ))}</div>
    </PageWrap>
  ),
});
