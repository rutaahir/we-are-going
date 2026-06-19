import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/events")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      search: { page: "events" },
    });
  },
  head: () => ({ meta: [{ title: "Events — WE ARE UNITED" }] }),
  component: () => null,
});
