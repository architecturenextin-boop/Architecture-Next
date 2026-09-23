import { createLazyFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, PlayCircle, Loader2, Lock, BookOpen, X, FileText, Download, Headphones, Palette, Archive, Layers, Image } from "lucide-react";
import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
import { ProfileCard } from "@/components/profile-card";
import { useAuth } from "@/hooks/use-auth";
import { courseService } from "@/lib/services/course.service";
import { tokenStorage } from "@/lib/api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CourseWithContent } from "@/lib/database.types";
import { getMediaUrl } from "@/lib/utils";
import Plyr from "plyr";
import "plyr/dist/plyr.css";

export const Route = createLazyFileRoute("/learn/$courseId")({
  component: LearnPage,
});

function getYouTubeVideoId(url: string) {
  let videoId = "";
  if (url.includes("youtu.be/")) {
    videoId = url.split("youtu.be/")[1]?.split("?")[0]?.split("&")[0] || "";
  } else if (url.includes("watch?v=")) {
    videoId = url.split("watch?v=")[1]?.split("&")[0] || "";
  } else if (url.includes("/embed/")) {
    videoId = url.split("/embed/")[1]?.split("?")[0]?.split("&")[0] || "";
  } else if (url.includes("/v/")) {
    videoId = url.split("/v/")[1]?.split("?")[0]?.split("&")[0] || "";
  } else if (url.includes("shorts/")) {
    videoId = url.split("shorts/")[1]?.split("?")[0]?.split("&")[0] || "";
  }
  return videoId;
}

function getYouTubeEmbedUrl(url: string) {
  const videoId = getYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
}

function formatVideoDuration(seconds: number): string {
  const rounded = Math.round(seconds);
  const hrs = Math.floor(rounded / 3600);
  const mins = Math.floor((rounded % 3600) / 60);
  const secs = rounded % 60;

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

function LearnPage() {
  const { courseId } = Route.useParams();
  const { lessonId } = Route.useSearch();
  const { user, profile, isLoading: authLoading } = useAuth();
  const isAdmin = profile?.role?.toUpperCase() === "ADMIN" || user?.role?.toUpperCase() === "ADMIN";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveDuration, setLiveDuration] = useState<string | null>(null);

  // Dedicated unmanaged container for the video/iframe player
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<Plyr | null>(null);

  // 1. Fetch course details and learning content from Backend REST API
  const { data: learningData, isLoading: courseLoading } = useQuery({
    queryKey: ["learn-course", courseId],
    queryFn: async () => {
      return courseService.getCourseLearningContent(courseId);
    },
    enabled: !!courseId,
  });

  const course = learningData?.course;
  const isEnrolled = learningData?.isEnrolled || isAdmin;
  const progressList = learningData?.progress || [];

  // Explicitly sort modules and lessons
  const sortedModules = useMemo(() => {
    if (!course?.modules) return [];
    return [...course.modules]
      .sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((m: any) => {
        const rawLessons = m.lessons || m.lessons_safe || [];
        const sortedLessons = [...rawLessons].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        return { ...m, lessons: sortedLessons };
      });
  }, [course]);

  // Flat lessons array for tracking prev/next
  const flatLessons = useMemo(() => {
    return sortedModules.flatMap((m: any) =>
      (m.lessons || []).map((l: any) => ({ ...l, moduleTitle: m.title }))
    );
  }, [sortedModules]);

  const [activeId, setActiveId] = useState("");

  const completed = useMemo(() => {
    return progressList.filter((p: any) => p.completed).map((p: any) => p.lesson_id);
  }, [progressList]);

  // Synchronize active lesson with URL search params or last-watched progress
  useEffect(() => {
    if (flatLessons.length === 0) return;

    if (lessonId && flatLessons.some((l) => l.id === lessonId)) {
      if (activeId !== lessonId) {
        setActiveId(lessonId);
      }
    } else if (!activeId) {
      if (progressList.length > 0) {
        const latest = [...progressList].sort(
          (a: any, b: any) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime()
        )[0];
        if (latest && flatLessons.some((l) => l.id === latest.lesson_id)) {
          setActiveId(latest.lesson_id);
          return;
        }
      }
      setActiveId(flatLessons[0]?.id || "");
    }
  }, [flatLessons, lessonId, activeId, progressList]);

  // Update navigation search param smoothly without unmounting route
  const handleSelectLesson = (id: string) => {
    if (id === activeId) return;
    setPlayerReady(false);
    setVideoLoading(true);
    setActiveId(id);
    setSidebarOpen(false);
    navigate({
      to: "/learn/$courseId",
      params: { courseId },
      search: { lessonId: id },
      replace: true,
    });
  };

  const activeLesson = useMemo(() => {
    return flatLessons.find((l) => l.id === activeId) || flatLessons[0];
  }, [flatLessons, activeId]);

  const isPdfLesson = useMemo(() => {
    const hasPdf = !!(activeLesson?.pdf_url || (activeLesson as any)?.pdf_path);
    const hasVideo = !!(activeLesson?.video_url || (activeLesson as any)?.video_path);
    return hasPdf && !hasVideo;
  }, [activeLesson]);

  const currentIndex = useMemo(() => {
    return flatLessons.findIndex((l) => l.id === activeId);
  }, [flatLessons, activeId]);

  const prevLesson = currentIndex > 0 ? flatLessons[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < flatLessons.length - 1
      ? flatLessons[currentIndex + 1]
      : null;

  // Video state
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(true);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  // PDF blob state for secure rendering without cross-origin CSP frame blocking
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Fetch video URL or PDF blob whenever activeId changes
  useEffect(() => {
    if (!activeId) return;
    let active = true;

    async function fetchUrl() {
      setPlayerReady(false);
      setVideoLoading(true);
      setVideoError(null);
      setVideoUrl(null);
      setPdfBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setPdfLoading(false);
      setPdfError(null);

      try {
        const currentLesson = flatLessons.find((l) => l.id === activeId);

        if (!currentLesson) {
          throw new Error("Lesson not found");
        }

        // Check enrollment restriction
        if (!currentLesson.is_free && !isEnrolled) {
          throw new Error("You must be actively enrolled to stream this lesson.");
        }

        const rawVideo = currentLesson.video_url || (currentLesson as any).video_path;
        if (rawVideo) {
          let resolved = getMediaUrl(rawVideo);
          const token = tokenStorage.get();
          if (token && resolved.includes("/api/v1/media/") && !resolved.includes("token=")) {
            resolved = `${resolved}${resolved.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
          }
          if (active) setVideoUrl(resolved);
          return;
        }

        const rawPdf = currentLesson.pdf_url || (currentLesson as any).pdf_path;
        if (rawPdf) {
          const ext = rawPdf.split("?")[0].split(".").pop()?.toLowerCase() || "";
          if (ext === "pdf") {
            setPdfLoading(true);
            try {
              let resolvedPdf = getMediaUrl(rawPdf);
              const isPresignedR2 = resolvedPdf.includes("X-Amz-") || resolvedPdf.includes("r2.cloudflarestorage.com");
              const headers: Record<string, string> = {};
              
              if (!isPresignedR2) {
                const token = tokenStorage.get();
                if (token) headers["Authorization"] = `Bearer ${token}`;
              }

              const res = await fetch(resolvedPdf, { headers });
              if (res.ok) {
                const blob = await res.blob();
                const blobUrl = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
                if (active) {
                  setPdfBlobUrl(blobUrl);
                  setPlayerReady(true);
                }
              } else {
                // If fetch fails or has CORS, fallback to direct presigned URL in iframe
                if (active) {
                  setPdfBlobUrl(resolvedPdf);
                  setPlayerReady(true);
                }
              }
            } catch (pErr: any) {
              if (active) {
                let resolvedPdf = getMediaUrl(rawPdf);
                setPdfBlobUrl(resolvedPdf);
                setPlayerReady(true);
              }
            } finally {
              if (active) setPdfLoading(false);
            }
          } else {
            if (active) {
              setVideoUrl(null);
              setPlayerReady(true);
            }
          }
          return;
        }

        throw new Error("No video or PDF material is attached to this lesson.");
      } catch (err: any) {
        if (active) {
          setVideoError(err.message || "Failed to load lesson content");
        }
      } finally {
        if (active) {
          setVideoLoading(false);
        }
      }
    }

    fetchUrl();
    return () => {
      active = false;
    };
  }, [activeId, flatLessons, isEnrolled]);

  // 3. Mutation to toggle lesson completion
  const toggleProgressMutation = useMutation({
    mutationFn: async (lessonIdToToggle: string) => {
      if (!course || !user) return;
      
      const isCompleted = completed.includes(lessonIdToToggle);
      let currentTime = 0;
      try {
        currentTime = playerRef.current ? Math.floor(playerRef.current.currentTime || 0) : 0;
      } catch (_) {}
      
      await courseService.saveLessonProgress(course.id, lessonIdToToggle, {
        progress_seconds: currentTime,
        completed: !isCompleted,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["learn-course", courseId] });
    }
  });

  // Imperative player mounting inside unmanaged container (prevents React removeChild errors)
  useEffect(() => {
    const container = playerContainerRef.current;
    if (!container || !videoUrl) return;

    container.innerHTML = "";
    setPlayerReady(false);
    let active = true;
    let hasAutoCompleted = false;

    const autoSave = async (seconds: number, markCompleted: boolean = false) => {
      if (!user || !course || !activeId) return;

      try {
        const isAlreadyCompleted = completed.includes(activeId);
        const shouldBeCompleted = markCompleted || isAlreadyCompleted;

        await courseService.saveLessonProgress(course.id, activeId, {
          progress_seconds: Math.max(0, seconds),
          completed: shouldBeCompleted,
        });

        if (markCompleted || (shouldBeCompleted && !isAlreadyCompleted)) {
          queryClient.invalidateQueries({ queryKey: ["learn-course", courseId] });
        }
      } catch (err) {
        console.error("Failed to save learning progress:", err);
      }
    };

    const isYouTube = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");

    const playerOptions: Plyr.Options = {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "settings",
        "fullscreen"
      ],
      seekTime: 10,
      invertTime: false,
      tooltips: { controls: true, seek: true },
      settings: ["speed"],
      speed: { selected: 1, options: [0.75, 1, 1.25, 1.5, 2] },
      keyboard: { global: true, focused: true },
      youtube: {
        noCookie: false,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
        modestbranding: 1
      }
    };

    let playerInstance: Plyr | null = null;

    // Seek to previous watched position
    const previousProgress = progressList.find((p) => p.lesson_id === activeId);
    const savedSeconds = previousProgress ? previousProgress.progress_seconds : 0;
    let hasSeeked = false;

    const performSeek = () => {
      try {
        if (savedSeconds > 0 && !hasSeeked && playerInstance) {
          playerInstance.currentTime = savedSeconds;
          hasSeeked = true;
        }
      } catch (_) {}
    };

    const handleReady = () => {
      performSeek();
      if (active) {
        setPlayerReady(true);
      }
    };

    const triggerAutoCompletion = (seconds: number) => {
      if (!hasAutoCompleted) {
        hasAutoCompleted = true;
        autoSave(seconds, true);
      }
    };

    if (isYouTube) {
      const videoId = getYouTubeVideoId(videoUrl);
      const embedDiv = document.createElement("div");
      embedDiv.className = "w-full h-full";
      embedDiv.setAttribute("data-plyr-provider", "youtube");
      embedDiv.setAttribute("data-plyr-embed-id", videoId);
      container.appendChild(embedDiv);

      try {
        playerInstance = new Plyr(embedDiv, playerOptions);
        playerRef.current = playerInstance;
      } catch (e) {
        console.warn("Plyr YouTube init warning:", e);
      }
    } else {
      // MP4 / Storage Video element with Plyr
      const videoEl = document.createElement("video");
      videoEl.className = "plyr w-full h-full";
      videoEl.playsInline = true;
      videoEl.controls = true;
      videoEl.preload = "metadata";
      videoEl.src = videoUrl;
      container.appendChild(videoEl);

      try {
        playerInstance = new Plyr(videoEl, playerOptions);
        playerRef.current = playerInstance;
      } catch (e) {
        console.warn("Plyr HTML5 init warning:", e);
      }

      videoEl.oncanplay = handleReady;
      videoEl.onloadeddata = handleReady;
      videoEl.onerror = (e) => {
        console.error("HTML5 Video Error Event:", e, "MediaError code:", videoEl.error?.code, videoEl.error?.message, "Source URL:", videoUrl);
        if (active) {
          setVideoError("Unable to load video stream. If this is a private lesson, ensure your enrollment is active or that the video is uploaded to Cloudflare R2.");
          setPlayerReady(true);
        }
      };
      videoEl.onended = () => {
        try {
          triggerAutoCompletion(Math.floor(videoEl.currentTime || 0));
        } catch (_) {}
      };
    }

    let lastSavedSeconds = 0;

    const updateDurationFromPlayer = async () => {
      try {
        const dur = Math.floor(playerInstance?.duration || 0);
        if (dur && !isNaN(dur) && dur > 0) {
          const formatted = formatVideoDuration(dur);
          setLiveDuration(formatted);
        }
      } catch (_) {}
    };

    if (playerInstance) {
      playerInstance.on("ready", () => {
        handleReady();
        updateDurationFromPlayer();
      });
      playerInstance.on("loadedmetadata", () => {
        handleReady();
        updateDurationFromPlayer();
      });
      playerInstance.on("canplay", () => {
        handleReady();
        updateDurationFromPlayer();
      });
      playerInstance.on("loadeddata", () => {
        handleReady();
        updateDurationFromPlayer();
      });

      playerInstance.on("timeupdate", () => {
        try {
          const current = Math.floor(playerInstance?.currentTime || 0);
          const duration = Math.floor(playerInstance?.duration || 0);

          if (duration > 0 && !liveDuration) {
            updateDurationFromPlayer();
          }

          // Auto-mark completed when video reaches >= 90% or within 3 seconds of end
          if (duration > 5 && !hasAutoCompleted && !completed.includes(activeId)) {
            if (current >= duration - 3 || (duration > 0 && current / duration >= 0.90)) {
              triggerAutoCompletion(current);
            }
          }

          if (Math.abs(current - lastSavedSeconds) >= 7) {
            lastSavedSeconds = current;
            autoSave(current);
          }
        } catch (_) {}
      });

      playerInstance.on("pause", () => {
        try {
          autoSave(Math.floor(playerInstance?.currentTime || 0));
        } catch (_) {}
      });

      playerInstance.on("ended", () => {
        try {
          triggerAutoCompletion(Math.floor(playerInstance?.currentTime || 0));
        } catch (_) {}
      });
    }

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        try {
          if (playerInstance?.currentTime) {
            autoSave(Math.floor(playerInstance.currentTime));
          }
        } catch (_) {}
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    const safetyTimer = setTimeout(() => {
      if (active) setPlayerReady(true);
    }, 1000);

    return () => {
      active = false;
      clearTimeout(safetyTimer);
      document.removeEventListener("visibilitychange", handleVisibility);
      try {
        if (playerInstance) {
          const currentTime = playerInstance.currentTime ? Math.floor(playerInstance.currentTime) : 0;
          if (currentTime > 0) autoSave(currentTime);
          playerInstance.destroy();
        }
      } catch (_) {}
      playerRef.current = null;
      setPlayerReady(false);
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [videoUrl, activeId, user?.id, course?.id, completed]);

  if (courseLoading || authLoading || !activeId) {
    return (
      <div className="grid min-h-screen place-items-center bg-white">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Not enrolled and not admin: Show Protected Locked Screen
  if (!isAdmin && isEnrolled === false) {
    return (
      <div className="grid min-h-screen place-items-center bg-surface-soft p-4">
        <div className="max-w-md w-full rounded-2xl border border-border bg-card p-8 text-center shadow-elevated">
          <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold">Course Access Restricted</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            You must be actively enrolled in <span className="font-semibold text-foreground">{course?.title || "this course"}</span> to access its lessons.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Button
              className="w-full bg-gradient-primary text-primary-foreground font-semibold"
              onClick={() => navigate({ to: "/checkout", search: { course: courseId } })}
            >
              Enroll Now for {course?.currency || "₹"}{course?.price}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate({ to: "/courses" })}
            >
              Browse All Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!course) return <div className="grid min-h-screen place-items-center">Course not found</div>;

  const activeIdx = flatLessons.findIndex((l) => l.id === activeId);
  const pct = flatLessons.length ? Math.round((completed.length / flatLessons.length) * 100) : 0;
  const isDone = completed.includes(activeId);

  const go = (delta: number) => {
    const next = flatLessons[activeIdx + delta];
    if (next && next.id) handleSelectLesson(next.id);
  };

  return (
    <div className="min-h-screen bg-surface-soft">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 backdrop-blur-xl shadow-xs">
        <div className="mx-auto flex h-14 sm:h-16 max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6">
          {/* Left: Back button + Course Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Back Button */}
            <Link
              to="/dashboard"
              aria-label="Back to Dashboard"
              className="inline-flex h-9 w-9 sm:w-auto sm:px-3 items-center justify-center gap-1.5 rounded-xl border border-border/70 bg-card/80 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted shrink-0 shadow-xs transition"
            >
              <ArrowLeft className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>

            <div className="hidden sm:block h-4 w-px bg-border/80 shrink-0" />

            {/* Course Title and Progress Pill */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h2 className="truncate text-xs sm:text-sm font-bold text-foreground leading-snug">
                {course.title}
              </h2>
              <span className="hidden sm:inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary shrink-0">
                {pct}%
              </span>
            </div>
          </div>

          {/* Right: Modules Drawer Button + Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Desktop progress bar */}
            <div className="hidden md:flex items-center gap-2 mr-1">
              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-gradient-primary transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <span className="text-xs font-bold text-primary font-mono">{pct}%</span>
            </div>

            {/* Mobile / Tablet Modules Drawer Toggle Button */}
            <button 
              onClick={() => setSidebarOpen((v) => !v)} 
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card px-2.5 sm:px-3 h-9 text-xs font-semibold text-foreground hover:bg-muted lg:hidden shadow-xs transition active:scale-95 shrink-0"
              aria-label="Toggle course modules drawer"
            >
              <BookOpen className="h-4 w-4 text-primary shrink-0" />
              <span className="hidden sm:inline">{sidebarOpen ? "Close" : "Modules"}</span>
              <span className="inline-flex sm:hidden font-bold text-primary text-[11px]">{pct}%</span>
            </button>

            <ProfileCard />
          </div>
        </div>
      </header>

      {/* Main Grid: Video Player + Lessons Sidebar */}
      <div className="mx-auto w-full max-w-7xl grid gap-4 sm:gap-5 px-3 sm:px-6 py-5 sm:py-7 lg:py-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4 sm:space-y-5">
          {/* Video / PDF Container: Tall Reel Background with Centered Landscape Video */}
          <div className={`overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-b from-[#0e0e18] via-[#05050a] to-[#0e0e18] shadow-elevated transition-all duration-300 flex items-center justify-center ${
            isPdfLesson ? "w-full h-[450px] sm:h-[600px] md:h-[650px] max-h-[85vh]" : "relative w-full min-h-[360px] sm:min-h-[440px] md:min-h-[480px] lg:min-h-[520px] max-h-[75vh]"
          }`}>
            {isPdfLesson ? (
              (activeLesson?.pdf_url || (activeLesson as any)?.pdf_path) ? (
                (() => {
                  const rawPdf = activeLesson?.pdf_url || (activeLesson as any)?.pdf_path || "";
                  const filename = rawPdf.split("?")[0].split("/").pop() || "Resource File";
                  const ext = rawPdf.split("?")[0].split(".").pop()?.toLowerCase() || "";

                  if (ext === "pdf") {
                    if (pdfLoading) {
                      return (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
                          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                          <p className="text-sm font-semibold">Loading PDF Document...</p>
                        </div>
                      );
                    }

                    if (pdfError || !pdfBlobUrl) {
                      return (
                        <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-white p-6 text-center">
                          <FileText className="h-12 w-12 text-destructive mb-3" />
                          <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
                            {pdfError ? "Failed to stream PDF directly" : "PDF preview unavailable"}
                          </h3>
                          <p className="text-xs text-muted-foreground max-w-sm mb-4">
                            {pdfError || "Please download the document to view it on your device."}
                          </p>
                          <a
                            href={(() => {
                              let docUrl = getMediaUrl(rawPdf);
                              const token = tokenStorage.get();
                              if (token && docUrl.includes("/api/v1/media/") && !docUrl.includes("token=")) {
                                docUrl = `${docUrl}${docUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
                              }
                              return docUrl;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-4 py-2 text-xs font-bold"
                          >
                            <Download className="h-4 w-4" /> Download PDF Document
                          </a>
                        </div>
                      );
                    }

                    const iframeSrc = pdfBlobUrl.startsWith("blob:") ? `${pdfBlobUrl}#toolbar=0&navpanes=0` : pdfBlobUrl;
                    return (
                      <div className="w-full h-full bg-slate-900 flex flex-col relative">
                        <iframe
                          src={iframeSrc}
                          className="w-full h-full border-none rounded-xl"
                          title="PDF Lesson Viewer"
                          allowFullScreen
                        />
                      </div>
                    );
                  }

                  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
                    return (
                      <div className="w-full h-full bg-[#0B0B12] flex items-center justify-center p-4 relative">
                        <img
                          src={getMediaUrl(rawPdf)}
                          alt={activeLesson.title}
                          className="w-full h-full object-contain rounded-xl select-none"
                        />
                      </div>
                    );
                  }

                  if (ext === "mp3" || ext === "wav") {
                    return (
                      <div className="w-full h-full bg-gradient-to-br from-[#0B0B12] via-[#14141F] to-[#1A1A2A] flex flex-col items-center justify-center p-6 text-center text-white">
                        <div className="relative flex items-center justify-center mb-6">
                          <div className="absolute h-24 w-24 rounded-full bg-primary/10 animate-pulse" />
                          <div className="h-16 w-16 rounded-2xl bg-gradient-primary shadow-glow flex items-center justify-center text-white">
                            <Headphones className="h-8 w-8 animate-bounce" />
                          </div>
                        </div>
                        <h3 className="font-display text-base sm:text-lg font-bold text-white mb-1">
                          Audio Lesson: {activeLesson.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-muted-foreground max-w-xs mb-6 truncate font-mono">
                          {filename}
                        </p>
                        <div className="w-full max-w-sm px-4">
                          <audio
                            src={getMediaUrl(activeLesson.pdf_url)}
                            controls
                            className="w-full"
                          />
                        </div>
                      </div>
                    );
                  }

                  // PSD, DWG, CAD, ZIP, and other file types
                  let fileIcon = <FileText className="h-10 w-10 text-primary" />;
                  let fileTypeLabel = "Lesson Material File";
                  let descriptionLabel = "Download this resource file to open it in your local design software and start working.";
                  let downloadBtnLabel = "Download Resource File";

                  if (ext === "dwg") {
                    fileIcon = <Layers className="h-10 w-10 text-emerald-500" />;
                    fileTypeLabel = "AutoCAD Drawing (DWG)";
                    descriptionLabel = "This AutoCAD drawing template file can be downloaded and opened directly in AutoCAD, Revit, or compatible CAD software.";
                    downloadBtnLabel = "Download AutoCAD Drawing";
                  } else if (ext === "psd") {
                    fileIcon = <Palette className="h-10 w-10 text-sky-500" />;
                    fileTypeLabel = "Photoshop Document (PSD)";
                    descriptionLabel = "This Photoshop design file contains presentation templates, layouts, or catalog materials. Download to edit in Adobe Photoshop.";
                    downloadBtnLabel = "Download Photoshop PSD";
                  } else if (ext === "zip" || ext === "rar") {
                    fileIcon = <Archive className="h-10 w-10 text-amber-500" />;
                    fileTypeLabel = "Compressed Resource Package";
                    descriptionLabel = "This package contains multiple resources, design catalogs, families, blocks, or exercise materials. Unzip after downloading.";
                    downloadBtnLabel = "Download Resource Package";
                  }

                  return (
                    <div className="w-full h-full bg-gradient-to-br from-[#0B0B12] via-[#14141F] to-[#1A1A2A] flex flex-col items-center justify-center p-6 text-center text-white">
                      <div className="h-16 w-16 rounded-2xl bg-[#222235]/60 flex items-center justify-center mb-5 border border-white/5 shadow-soft">
                        {fileIcon}
                      </div>
                      <h3 className="font-display text-base sm:text-lg font-bold text-foreground mb-2">
                        {fileTypeLabel}
                      </h3>
                      <p className="text-[10px] sm:text-xs text-muted-foreground max-w-xs mb-2 truncate font-mono">
                        {filename}
                      </p>
                      <p className="text-xs text-muted-foreground/80 max-w-sm mb-6 leading-relaxed">
                        {descriptionLabel}
                      </p>
                      <a
                        href={(() => {
                          let docUrl = getMediaUrl(activeLesson.pdf_url);
                          const token = tokenStorage.get();
                          if (token && docUrl.includes("/api/v1/media/") && !docUrl.includes("token=")) {
                            docUrl = `${docUrl}${docUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
                          }
                          return docUrl;
                        })()}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-primary text-primary-foreground px-5 py-2.5 text-xs font-bold shadow-soft hover:opacity-95 transition"
                      >
                        <Download className="h-4 w-4" /> {downloadBtnLabel}
                      </a>
                    </div>
                  );
                })()
              ) : (
                <div className="flex flex-col items-center justify-center text-white bg-black/85 p-6 text-center w-full h-full animate-pulse">
                  <FileText className="h-12 w-12 mb-2 text-white/40" />
                  <p className="font-semibold text-xs sm:text-sm">No Resource File attached to this lesson</p>
                </div>
              )
            ) : (
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Premium Smooth Loading State */}
                {(videoLoading || !playerReady) && !videoError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-br from-[#0B0B12] via-[#14141F] to-[#1A1A2A] text-white transition-opacity duration-300">
                    <div className="relative flex items-center justify-center">
                      <div className="absolute h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/20 animate-ping" />
                      <div className="relative flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-gradient-primary shadow-glow">
                        <Loader2 className="h-6 w-6 sm:h-7 sm:w-7 animate-spin text-white" />
                      </div>
                    </div>
                    <div className="mt-3 sm:mt-4 text-center px-4">
                      <p className="font-display text-xs sm:text-sm font-semibold text-white tracking-tight">
                        {activeLesson?.title || "Loading Lesson..."}
                      </p>
                      <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                        Loading video player...
                      </p>
                    </div>
                  </div>
                )}

                {/* Error State */}
                {videoError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 p-4 sm:p-6 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-destructive/15 text-destructive mb-2">
                      <PlayCircle className="h-7 w-7" />
                    </div>
                    <p className="font-semibold text-xs sm:text-sm text-destructive">Playback Blocked</p>
                    <p className="text-[11px] sm:text-xs text-white/75 mt-1 max-w-sm">{videoError}</p>
                  </div>
                )}

                {/* Empty / Not Selected State */}
                {!videoLoading && !videoError && !videoUrl && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 p-6 text-center">
                    <PlayCircle className="h-12 w-12 mb-2 text-white/40 animate-pulse" />
                    <p className="font-semibold text-xs sm:text-sm">Select a lesson to begin learning</p>
                  </div>
                )}

                {/* Video Player Container */}
                <div
                  ref={playerContainerRef}
                  className={`w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                    playerReady && !videoLoading && !videoError && videoUrl
                      ? "opacity-100"
                      : "opacity-0 pointer-events-none"
                  }`}
                />
              </div>
            )}
          </div>

          {/* Now Playing Details & Action Bar */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-soft">
             <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                  Now playing
                </span>
                {(liveDuration || activeLesson?.duration) && (
                  <span className="text-[11px] sm:text-xs font-mono font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">
                    {liveDuration || activeLesson.duration}
                  </span>
                )}
              </div>

              {isPdfLesson && activeLesson?.pdf_url && (
                <a
                  href={getMediaUrl(activeLesson.pdf_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 text-primary hover:bg-primary/10 px-3 py-1 text-xs font-semibold shadow-xs transition"
                >
                  <Download className="h-3.5 w-3.5" /> Download PDF File
                </a>
              )}
            </div>

            <h1 className="mt-2.5 font-display text-base sm:text-xl md:text-2xl font-bold tracking-tight text-foreground">
              {activeLesson?.title}
            </h1>
            
            {activeLesson?.description && (
              <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {activeLesson.description}
              </p>
            )}

            {/* Action Buttons Row */}
            <div className="mt-4 sm:mt-5 flex items-center justify-between gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-border/50">
              {/* Interactive Completion Toggle Pill */}
              <button 
                type="button"
                onClick={() => toggleProgressMutation.mutate(activeId)} 
                disabled={toggleProgressMutation.isPending}
                aria-pressed={isDone}
                className={`group inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                  isDone 
                    ? "border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/15" 
                    : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-muted/60 hover:text-foreground"
                }`}
              >
                <div className={`grid h-5 w-5 place-items-center rounded-md transition-colors ${
                  isDone 
                    ? "bg-emerald-500 text-white shadow-xs" 
                    : "border border-muted-foreground/40 bg-background group-hover:border-primary/60"
                }`}>
                  <Check className={`h-3.5 w-3.5 stroke-[2.5] transition-transform ${isDone ? "scale-100" : "scale-0 text-primary"}`} />
                </div>
                <span>{isDone ? "Completed" : "Mark Complete"}</span>
              </button>

              {/* Navigation Controls: Clean Symbols + Responsive Labels */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => go(-1)} 
                  disabled={activeIdx === 0}
                  className="h-10 sm:h-11 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-semibold border-border/80 hover:bg-muted disabled:opacity-40"
                  aria-label="Previous Lesson"
                >
                  <ChevronLeft className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Previous</span>
                </Button>
                <Button 
                  size="sm" 
                  className="h-10 sm:h-11 px-3.5 sm:px-5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-primary text-primary-foreground hover:opacity-95 shadow-soft disabled:opacity-40" 
                  onClick={() => go(1)} 
                  disabled={activeIdx === flatLessons.length - 1}
                  aria-label="Next Lesson"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4 sm:ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Sidebar Course Content */}
        <aside className="hidden lg:block h-fit rounded-2xl border border-border bg-card p-3.5 shadow-soft sticky top-20">
          <div className="px-3 py-2 border-b border-border/60 mb-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Course content</div>
            <div className="text-xs text-muted-foreground">{flatLessons.length} lessons • {course.total_duration}</div>
          </div>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
            {sortedModules.map((m: any) => (
              <div key={m.id}>
                <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground bg-muted/40 rounded-lg">{m.title}</div>
                <div className="mt-1 space-y-1">
                  {(m.lessons || []).map((l: any) => {
                    const done = completed.includes(l.id || "");
                    const active = activeId === l.id;
                    const isLessonPdf = !!l.pdf_url && !l.video_url;
                    return (
                      <button 
                        key={l.id} 
                        onClick={() => { if (l.id) handleSelectLesson(l.id); }} 
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-sm transition ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                      >
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          {done ? (
                            <Check className="h-3 w-3" />
                          ) : isLessonPdf ? (
                            (() => {
                              const ext = l.pdf_url?.split(".").pop()?.toLowerCase() || "";
                              if (ext === "mp3" || ext === "wav") return <Headphones className="h-3 w-3" />;
                              if (ext === "dwg" || ext === "psd") return <Layers className="h-3 w-3" />;
                              if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return <Image className="h-3 w-3" />;
                              return <FileText className="h-3 w-3" />;
                            })()
                          ) : (
                            <PlayCircle className="h-3 w-3" />
                          )}
                        </span>
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        {((active ? liveDuration : null) || l.duration) && (
                          <span className="text-xs text-muted-foreground font-mono shrink-0">
                            {(active ? liveDuration : null) || l.duration}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Mobile Slide-Over Drawer for Modules */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs animate-fade-in">
            <div 
              className="fixed inset-0" 
              onClick={() => setSidebarOpen(false)} 
            />
            <div className="relative z-10 w-full max-h-[85vh] overflow-hidden rounded-t-3xl border-t border-border bg-card p-4 pb-8 shadow-glow animate-fade-up">
              <div className="mx-auto h-1.5 w-12 rounded-full bg-muted-foreground/30 mb-3" />
              <div className="flex items-center justify-between border-b border-border pb-3 px-1">
                <div>
                  <h3 className="font-display text-sm font-bold">Course Modules</h3>
                  <p className="text-xs text-muted-foreground">{flatLessons.length} lessons • {pct}% completed</p>
                </div>
                <button 
                  onClick={() => setSidebarOpen(false)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-3 space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {sortedModules.map((m: any) => (
                  <div key={m.id}>
                    <div className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground bg-muted/40 rounded-lg">{m.title}</div>
                    <div className="mt-1 space-y-1">
                       {(m.lessons || []).map((l: any) => {
                        const done = completed.includes(l.id || "");
                        const active = activeId === l.id;
                        const isLessonPdf = !!l.pdf_url && !l.video_url;
                        return (
                          <button 
                            key={l.id} 
                            onClick={() => { 
                              if (l.id) handleSelectLesson(l.id); 
                              setSidebarOpen(false);
                            }} 
                            className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs sm:text-sm transition ${active ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-foreground"}`}
                          >
                            <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10px] ${done ? "bg-success text-success-foreground" : active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                              {done ? (
                                <Check className="h-3 w-3" />
                              ) : isLessonPdf ? (
                                (() => {
                                  const ext = l.pdf_url?.split(".").pop()?.toLowerCase() || "";
                                  if (ext === "mp3" || ext === "wav") return <Headphones className="h-3 w-3" />;
                                  if (ext === "dwg" || ext === "psd") return <Layers className="h-3 w-3" />;
                                  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return <Image className="h-3 w-3" />;
                                  return <FileText className="h-3 w-3" />;
                                })()
                              ) : (
                                <PlayCircle className="h-3 w-3" />
                              )}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{l.title}</span>
                            {((active ? liveDuration : null) || l.duration) && (
                              <span className="text-xs text-muted-foreground font-mono shrink-0">
                                {(active ? liveDuration : null) || l.duration}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
