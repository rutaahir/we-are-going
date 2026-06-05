import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/jobs")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      search: { page: "jobs" },
    });
  },
  head: () => ({ meta: [{ title: "Job Portal — We Are Going" }] }),
  component: () => null,
});
