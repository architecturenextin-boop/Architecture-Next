import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Database,
  Download,
  Trash2,
  HardDrive,
  FileJson,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  Clock,
  Layers,
  Users,
  CreditCard,
  BookOpen,
  Loader2,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminService } from "@/lib/services/admin.service";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/backup")({
  head: () => ({
    meta: [
      { title: "Data Backup & Storage — Admin" },
      { name: "description", content: "Manage and download system database backups and data archives." },
    ],
  }),
  component: AdminBackupPage,
});

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function AdminBackupPage() {
  const queryClient = useQueryClient();
  const [isLiveDownloading, setIsLiveDownloading] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);

  // Fetch backups and live summary
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["admin", "backups"],
    queryFn: adminService.getBackups,
  });

  // Create & store backup mutation
  const createMutation = useMutation({
    mutationFn: adminService.createBackup,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
      toast.success("New database backup created and stored successfully!", {
        description: `Saved as ${res.filename} (${formatBytes(res.size)})`,
      });
    },
    onError: (err: any) => {
      toast.error("Failed to create database backup", {
        description: err?.message || "An unexpected error occurred",
      });
    },
  });

  // Delete backup mutation
  const deleteMutation = useMutation({
    mutationFn: adminService.deleteBackup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "backups"] });
      toast.success("Backup file removed from server storage.");
    },
    onError: (err: any) => {
      toast.error("Failed to delete backup file", {
        description: err?.message || "An unexpected error occurred",
      });
    },
  });

  // Trigger browser download for a specific backup file
  const handleDownload = async (filename?: string) => {
    try {
      if (filename) {
        setDownloadingFile(filename);
      } else {
        setIsLiveDownloading(true);
      }

      const blob = await adminService.downloadBackup(filename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `live_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Backup downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to download backup", {
        description: err?.message || "Network error while downloading backup file.",
      });
    } finally {
      setDownloadingFile(null);
      setIsLiveDownloading(false);
    }
  };

  const backups = data?.backups || [];
  const live = data?.liveSummary || {
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalPayments: 0,
    totalCoupons: 0,
    totalTestimonials: 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-foreground">
                Data Backup & Storage
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Export, store, and manage full database snapshots of courses, students, and payments.
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl border-border/80 h-9"
          >
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDownload()}
            disabled={isLiveDownloading}
            className="rounded-xl border-border/80 h-9"
          >
            {isLiveDownloading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin text-primary" />
            ) : (
              <FileJson className="h-4 w-4 mr-1.5 text-primary" />
            )}
            Download Live JSON
          </Button>

          <Button
            size="sm"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
            className="rounded-xl bg-gradient-primary h-9 font-semibold text-primary-foreground shadow-glow hover:brightness-110"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <HardDrive className="h-4 w-4 mr-1.5" />
            )}
            Create & Store Backup
          </Button>
        </div>
      </div>

      {/* Live System Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Courses</span>
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {live.totalCourses}
          </p>
          <span className="text-[11px] text-muted-foreground">Catalog & modules</span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Students</span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {live.totalUsers}
          </p>
          <span className="text-[11px] text-muted-foreground">
            {live.totalEnrollments} active enrollments
          </span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Payments</span>
            <CreditCard className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {live.totalPayments}
          </p>
          <span className="text-[11px] text-muted-foreground">Completed transactions</span>
        </div>

        <div className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Archives</span>
            <HardDrive className="h-4 w-4 text-brand-purple" />
          </div>
          <p className="mt-2 font-display text-2xl sm:text-3xl font-bold text-foreground">
            {backups.length}
          </p>
          <span className="text-[11px] text-muted-foreground">Server storage snapshots</span>
        </div>
      </div>

      {/* Stored Server Backups List */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-4">
          <div>
            <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">
              Stored Server Backups
            </h2>
            <p className="text-xs text-muted-foreground">
              Snapshots saved in the server's local storage directory with complete timestamped records.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Encrypted & Verified
          </span>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Loading backup archives...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="mt-2 text-sm font-semibold">Failed to load backups</p>
            <p className="text-xs text-muted-foreground">{(error as any)?.message || "Server connection error"}</p>
          </div>
        ) : backups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-foreground">
              No server backups stored yet
            </h3>
            <p className="mt-1 max-w-sm text-xs sm:text-sm text-muted-foreground">
              Create your first server snapshot to preserve all platform courses, students, and payment records.
            </p>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending}
              className="mt-5 rounded-xl bg-gradient-primary font-semibold text-primary-foreground shadow-glow hover:brightness-110"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <HardDrive className="h-4 w-4 mr-1.5" />
              )}
              Create First Backup Now
            </Button>
          </div>
        ) : (
          <div className="mt-4 divide-y divide-border/60">
            {backups.map((b) => (
              <div
                key={b.filename}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between transition-colors hover:bg-muted/30 px-2 rounded-xl"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <FileJson className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-xs sm:text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                        {b.filename}
                      </p>
                      <span className="rounded-md border border-border/80 bg-muted/50 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        {formatBytes(b.size)}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/70" />
                        {formatDate(b.createdAt)}
                      </span>

                      {b.summary && (
                        <>
                          <span>•</span>
                          <span>{b.summary.totalCourses ?? 0} courses</span>
                          <span>•</span>
                          <span>{b.summary.totalUsers ?? 0} users</span>
                          <span>•</span>
                          <span>{b.summary.totalPayments ?? 0} payments</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(b.filename)}
                    disabled={downloadingFile === b.filename}
                    className="h-8 rounded-lg text-xs font-semibold"
                  >
                    {downloadingFile === b.filename ? (
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5 mr-1.5 text-primary" />
                    )}
                    Download
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (window.confirm(`Delete backup "${b.filename}"? This action cannot be undone.`)) {
                        deleteMutation.mutate(b.filename);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Delete backup archive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Backup Coverage & Information Card */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-5 sm:p-6 shadow-2xs">
        <div className="flex items-center gap-2 text-primary mb-3">
          <Sparkles className="h-4 w-4" />
          <h3 className="font-display text-sm font-extrabold uppercase tracking-wider text-foreground">
            Complete Platform Coverage
          </h3>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          Every generated backup creates a lossless JSON export of the entire system state, designed for quick recovery and offline archive:
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Curriculum & Media</p>
              <p className="text-[11px] text-muted-foreground">All course data, modules, lessons, video URLs, and study PDFs.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Student Accounts</p>
              <p className="text-[11px] text-muted-foreground">User credentials, profiles, contact details, and role assignments.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Financial & Orders</p>
              <p className="text-[11px] text-muted-foreground">Payment records, transaction gateways, and active enrollments.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Coupons & Discounts</p>
              <p className="text-[11px] text-muted-foreground">Promo codes, usage limits, percentage discounts, and redemptions.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Student Reviews</p>
              <p className="text-[11px] text-muted-foreground">Testimonials, ratings, approvals, and verified student status.</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 rounded-xl border border-border/60 bg-background/60 p-3">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">Learning Progress</p>
              <p className="text-[11px] text-muted-foreground">Lesson watch positions, completion checks, and timestamps.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
