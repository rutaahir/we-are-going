import { createFileRoute } from "@tanstack/react-router";
import { AdminVenues } from "./community-admin.venues";

export const Route = createFileRoute("/admin/venues")({
  component: AdminVenues,
});
