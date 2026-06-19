import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/matrimony")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      search: { page: "matrimony" },
    });
  },
  head: () => ({ meta: [{ title: "Matrimony — WE ARE UNITED" }] }),
  component: () => null,
});
