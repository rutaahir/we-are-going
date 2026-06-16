import { createFileRoute } from "@tanstack/react-router";
import { PageWrap } from "@/components/wag/PageWrap";
import { CommunityHierarchy } from "@/components/wag/CommunityHierarchy";

export const Route = createFileRoute("/community-admin/hierarchy")({
  component: () => {
    return (
      <PageWrap 
        title="My Community Network" 
        desc="Interactive topological map showing your parent community and subsidiary structure"
      >
        <CommunityHierarchy />
      </PageWrap>
    );
  },
});
