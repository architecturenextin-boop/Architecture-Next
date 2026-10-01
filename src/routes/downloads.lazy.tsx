import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { downloadManager, OfflineLessonRecord, StorageEstimateInfo } from "@/lib/offline/download-manager";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";
import { 
  Download, 
  Trash2, 
  PlayCircle, 
  HardDrive, 
  Wifi, 
  WifiOff, 
  Clock, 
  ShieldCheck, 
  AlertCircle,
  ArrowLeft,
  Loader2,
  Sparkles
} from "lucide-react";

export const Route = createLazyFileRoute("/downloads")({
  component: DownloadsPage,
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function DownloadsPage() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<OfflineLessonRecord[]>([]);
  const [storage, setStorage] = useState<StorageEstimateInfo | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

  useEffect(() => {
    const unsub = downloadManager.subscribe((list) => {
      setLessons(list);
    });

    downloadManager.getStorageUsage().then(setStorage);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      unsub();
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleDelete = async (lessonId: string) => {
    if (window.confirm("Are you sure you want to delete this offline lesson from device storage?")) {
      await downloadManager.deleteDownloadedLesson(lessonId);
      const updatedStorage = await downloadManager.getStorageUsage();
      setStorage(updatedStorage);
    }
  };

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="inline-flex h-9 w-9 sm:w-auto sm:px-3 items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card/80 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 shadow-xs transition"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-4 w-px bg-border/80 hidden sm:block" />
            <h1 className="font-display text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
              <Download className="h-4 w-4 text-primary" />
              Offline Downloads
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Wifi className="h-3.5 w-3.5" />
                Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-500 border border-amber-500/30 animate-pulse">
                <WifiOff className="h-3.5 w-3.5" />
                Offline Mode
              </span>
            )}
            <ProfileCard />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Storage Bar Card */}
        <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-soft">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20">
                <HardDrive className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Device Offline Storage</h3>
                <p className="text-xs text-muted-foreground">
                  Encrypted AES-GCM segments stored in browser IndexedDB
                </p>
              </div>
            </div>

            {storage && (
              <div className="text-left sm:text-right">
                <div className="text-xs font-bold text-foreground">
                  {storage.usageFormatted} used of {storage.quotaFormatted}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {storage.percentUsed}% total browser quota
                </div>
              </div>
            )}
          </div>

          {storage && (
            <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-gradient-primary transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(2, storage.percentUsed))}%` }}
              />
            </div>
          )}
        </div>

        {/* Downloaded Lessons List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground">
              Downloaded Lessons ({lessons.filter((l) => l.status === "completed").length})
            </h2>
            {lessons.length > 0 && (
              <span className="text-xs text-muted-foreground">
                Total size: {formatBytes(lessons.reduce((acc, l) => acc + (l.sizeBytes || 0), 0))}
              </span>
            )}
          </div>

          {lessons.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
              <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground">
                <Download className="h-7 w-7" />
              </div>
              <h3 className="font-display text-base font-bold text-foreground">No Offline Downloads Yet</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Download lessons while connected to Wi-Fi to watch them anywhere without internet access.
              </p>
              <Button
                className="mt-5 bg-gradient-primary text-primary-foreground font-semibold"
                onClick={() => navigate({ to: "/courses" })}
              >
                Explore Courses
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
              {lessons.map((lesson) => {
                const isExpired = new Date(lesson.expiresAt) < new Date();
                const daysLeft = Math.max(0, Math.ceil((new Date(lesson.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

                return (
                  <div
                    key={lesson.id}
                    className="flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-soft hover:border-primary/40 transition"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="inline-flex items-center rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                          {lesson.quality}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {lesson.duration || "15:00"}
                        </div>
                      </div>

                      <h4 className="font-bold text-sm text-foreground line-clamp-2 mb-1">
                        {lesson.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate mb-3">
                        {lesson.courseTitle}
                      </p>

                      {lesson.status === "downloading" && (
                        <div className="space-y-1.5 my-3">
                          <div className="flex justify-between text-[11px] font-semibold text-primary">
                            <span>Downloading ({lesson.downloadedSegments}/{lesson.totalSegments})...</span>
                            <span>{lesson.progressPercent}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${lesson.progressPercent}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {lesson.status === "completed" && (
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-4">
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          <span>{formatBytes(lesson.sizeBytes)}</span>
                          <span>•</span>
                          <span className={isExpired ? "text-destructive font-bold" : "text-muted-foreground"}>
                            {isExpired ? "License expired" : `Expires in ${daysLeft} days`}
                          </span>
                        </div>
                      )}

                      {lesson.status === "error" && (
                        <div className="flex items-center gap-1.5 text-xs text-destructive my-2">
                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{lesson.errorMessage || "Download error"}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-border/50 mt-2">
                      <Button
                        className="flex-1 bg-gradient-primary text-primary-foreground font-semibold h-9 text-xs gap-1.5"
                        disabled={lesson.status !== "completed" || isExpired}
                        onClick={() => navigate({ to: `/learn/${lesson.courseId}`, search: { lessonId: lesson.id } })}
                      >
                        <PlayCircle className="h-3.5 w-3.5" />
                        Play Lesson
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9 text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => handleDelete(lesson.id)}
                        aria-label="Delete offline lesson"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Safari & Storage Eviction Notice */}
        <div className="rounded-2xl border border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground leading-relaxed">
          <p className="font-semibold text-foreground mb-1">
            📱 Note on Mobile & iOS Safari Playback
          </p>
          <p>
            Offline video segments are encrypted using high-security WebCrypto AES-GCM and stored directly inside your browser database. On iOS devices (iPhone/iPad), Safari may clear offline cache after 7 days of inactivity. Connecting to the internet periodically will automatically refresh licenses and preserve your downloaded content.
          </p>
        </div>
      </main>
    </div>
  );
}