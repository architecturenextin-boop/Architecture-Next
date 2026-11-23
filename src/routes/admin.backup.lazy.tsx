import { createLazyFileRoute } from "@tanstack/react-router";

export const Route = createLazyFileRoute("/admin/backup")({
  head: () => ({
    meta: [
      { title: "Data Backup & Storage — Admin" },
      { name: "description", content: "Manage and download system database backups and data archives." },
    ],
  }),
});
