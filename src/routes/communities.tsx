import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/communities")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      search: { page: "communities" },
    });
  },
  head: () => ({ meta: [{ title: "Communities — We Are Going" }] }),
  component: () => null,
});
