import { createFileRoute } from "@tanstack/react-router";
import { PageWrap } from "@/components/wag/PageWrap";
import { AnimatedCard } from "@/components/wag/primitives";

export const Route = createFileRoute("/dashboard/settings")({
  component: () => (
    <PageWrap title="Settings" desc="Account preferences and privacy">
      <div className="grid lg:grid-cols-2 gap-5">
        <AnimatedCard className="p-6"><h3 className="font-ui font-semibold mb-4">Account</h3><div className="space-y-3 text-sm">{["Change password","Two-factor auth","Connected devices","Privacy"].map(s=><div key={s} className="flex items-center justify-between py-2"><span>{s}</span><button className="text-primary">Manage</button></div>)}</div></AnimatedCard>
        <AnimatedCard className="p-6"><h3 className="font-ui font-semibold mb-4">Notifications</h3><div className="space-y-3 text-sm">{["Email alerts","SMS alerts","Push notifications","Weekly digest"].map(s=><label key={s} className="flex items-center justify-between py-2"><span>{s}</span><input type="checkbox" defaultChecked className="w-9 h-5 accent-primary" /></label>)}</div></AnimatedCard>
        <AnimatedCard className="p-6"><h3 className="font-ui font-semibold mb-4">Language</h3><div className="space-y-2 text-sm">{["English","ગુજરાતી","हिंदी"].map(l=><label key={l} className="flex items-center gap-2"><input type="radio" name="lang" defaultChecked={l==="English"} />{l}</label>)}</div></AnimatedCard>
        <AnimatedCard className="p-6"><h3 className="font-ui font-semibold mb-4 text-red-600">Danger Zone</h3><div className="space-y-3 text-sm"><button className="w-full py-2 rounded-lg border border-red-200 text-red-600">Deactivate account</button><button className="w-full py-2 rounded-lg bg-red-50 text-red-600 border border-red-200">Delete account</button></div></AnimatedCard>
      </div>
    </PageWrap>
  ),
});
