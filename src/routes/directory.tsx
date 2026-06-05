import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/directory")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      search: { page: "directory" },
    });
  },
  head: () => ({ meta: [{ title: "Member Directory — We Are Going" }] }),
  component: () => null,
});
