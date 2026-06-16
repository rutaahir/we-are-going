import { createFileRoute } from "@tanstack/react-router";
import { PageWrap } from "@/components/wag/PageWrap";
import { CommunityHierarchy } from "@/components/wag/CommunityHierarchy";

export const Route = createFileRoute("/dashboard/hierarchy")({
  component: () => {
    return (
      <PageWrap 
        title="My Community Structure" 
        desc="Explore the ecosystem of your community organization"
      >
        <CommunityHierarchy />
      </PageWrap>
    );
  },
});
