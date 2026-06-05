import { type ReactNode } from "react";
import { PageTransition } from "@/components/wag/primitives";

export function PageWrap({ title, desc, action, children }: { title: string; desc?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <PageTransition>
      <div className="p-6 lg:p-8 w-full">
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="font-ui font-bold text-2xl lg:text-3xl">{title}</h1>
            {desc && <p className="text-warm-muted text-sm mt-1">{desc}</p>}
          </div>
          {action}
        </div>
        {children}
      </div>
    </PageTransition>
  );
}
