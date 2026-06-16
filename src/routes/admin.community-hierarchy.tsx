import { createFileRoute } from "@tanstack/react-router";
import { PageWrap } from "@/components/wag/PageWrap";
import { CommunityHierarchy } from "@/components/wag/CommunityHierarchy";

export const Route = createFileRoute("/admin/community-hierarchy")({
  component: () => {
    return (
      <PageWrap 
        title="Community Ecosystem Hierarchy" 
        desc="Interactive topological map of Super Communities and all their Subsidiaries"
      >
        <div className="mb-6 flex gap-4 overflow-x-auto">
          {/* Decorative stats or context could go here, but CommunityHierarchy handles it */}
        </div>
        
        <CommunityHierarchy />
      </PageWrap>
    );
  },
});
