import { createLazyFileRoute } from "@tanstack/react-router";
import { 
  Edit3, Plus, Trash2, Upload, Video, Loader2, ArrowUp, ArrowDown, Image, Info,
  Pause, Play, RefreshCw, XCircle, CheckCircle2, PlayCircle, Eye, EyeOff, AlertCircle, FileVideo,
  UploadCloud, Link2, FileText, X
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { getMediaUrl } from "@/lib/utils";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";

export const Route = createLazyFileRoute("/admin/courses")({
  component: AdminCourses,
});

function parseListInput(input?: string | string[]): string[] {
  if (!input) return [];
  if (Array.isArray(input)) return input.filter(Boolean);
  return input
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function AdminCourses() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [adding, setAdding] = useState(false);

  // 1. Fetch all courses with modules and lessons
  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["admin-courses"],
    queryFn: async () => {
      return adminService.getAllCourses();
    }
  });

  const invalidateAllCourseQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-courses"] });
    queryClient.invalidateQueries({ queryKey: ["courses"] });
    queryClient.invalidateQueries({ queryKey: ["courses", "published"] });
    queryClient.invalidateQueries({ queryKey: ["landing-courses"] });
    queryClient.invalidateQueries({ queryKey: ["landing-main-course"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-recommended"] });
  };

  // 2. Delete Course Mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: string) => {
      return adminService.deleteCourse(id);
    },
    onSuccess: () => {
      invalidateAllCourseQueries();
      toast.success("Course deleted successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete course.");
    }
  });

  // 3. Quick Toggle Publish / Unpublish Mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ course, targetStatus }: { course: any; targetStatus: "published" | "draft" }) => {
      const courseObj = {
        ...course,
        status: targetStatus,
        published: targetStatus === "published",
      };
      return adminService.upsertCourse(courseObj, course.modules || []);
    },
    onSuccess: (_, vars) => {
      invalidateAllCourseQueries();
      toast.success(
        vars.targetStatus === "published"
          ? "Course published live to student catalog!"
          : "Course unpublished (set to draft)!"
      );
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update course visibility.");
    }
  });

  // 4. Upsert Course Mutation (atomic REST endpoint)
  const upsertCourseMutation = useMutation({
    mutationFn: async (formData: any) => {
      const courseId = formData.id || crypto.randomUUID();
      const courseSlug = formData.slug || formData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      
      const courseObj = {
        id: courseId,
        slug: courseSlug,
        title: formData.title,
        tagline: formData.tagline || "",
        description: formData.description || "",
        cover_url: formData.coverUrl || editing?.cover_url || "/course-cover.jpeg",
        thumbnail_url: formData.coverUrl || editing?.cover_url || "/course-cover.jpeg",
        price: Number(formData.price),
        original_price: Number(formData.originalPrice) || editing?.original_price || Math.round(Number(formData.price) * 2.5),
        currency: "₹",
        total_duration: formData.totalDuration || editing?.total_duration || "2h 30m",
        level: formData.level || editing?.level || "Beginner",
        language: formData.language || editing?.language || "Malayalam",
        rating: Number(formData.rating) || editing?.rating || 4.9,
        review_count: Number(formData.reviewCount) || editing?.review_count || 1240,
        preview_video_url: formData.previewVideoUrl || "",
        what_you_will_learn: parseListInput(formData.whatYouWillLearn),
        tools_covered: formData.toolsCovered ? formData.toolsCovered.split(/,|\n/).map((s: string) => s.trim()).filter(Boolean) : [],
        highlights: parseListInput(formData.highlights),
        requirements: parseListInput(formData.requirements),
        target_audience: parseListInput(formData.targetAudience),
        published: formData.status === "published",
        status: formData.status
      };

      // Format modules and lessons with correct sort order
      const formattedModules = (formData.modules || []).map((m: any, mIdx: number) => ({
        id: m.id && !m.id.startsWith("m-") ? m.id : crypto.randomUUID(),
        title: m.title,
        description: m.description || "",
        sort_order: mIdx,
        lessons: (m.lessons || []).map((l: any, lIdx: number) => ({
          id: l.id && !l.id.startsWith("l-") ? l.id : crypto.randomUUID(),
          title: l.title,
          description: l.description || "",
          duration: l.duration || "15:00",
          video_url: l.video_url || "",
          video_path: l.video_path || "",
          pdf_url: l.pdf_url || "",
          pdf_path: l.pdf_path || "",
          is_free: !!l.is_free,
          sort_order: lIdx
        }))
      }));

      return adminService.upsertCourse(courseObj, formattedModules);
    },
    onSuccess: () => {
      invalidateAllCourseQueries();
      setEditing(null);
      setAdding(false);
      toast.success("Course saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save course.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Courses</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your catalog, edit modules, and configure lesson video streams.</p>
        </div>
        <Button onClick={() => setAdding(true)} className="bg-gradient-primary text-primary-foreground">
          <Plus className="mr-1.5 h-4 w-4" /> Add course
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(Array.isArray(courses) ? courses : []).map((c: any) => {
          const isPublished = c.status === "published" || (c.published && c.status !== "draft" && c.status !== "archived");
          return (
            <article key={c.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft flex flex-col justify-between">
              <div className="relative">
                <img src={getMediaUrl(c.cover_url)} alt={c.title} loading="lazy" className="aspect-video w-full object-cover" />
                <span className={`absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full font-bold uppercase shadow-sm ${
                  isPublished ? "bg-emerald-500 text-white" :
                  c.status === "archived" ? "bg-zinc-500 text-white" : "bg-amber-500 text-white"
                }`}>
                  {isPublished ? "Published" : (c.status || "Draft")}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-base font-bold leading-snug">{c.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground">{c.total_lessons || 0} lessons • {c.level || "Beginner"}</p>
                </div>
                <div className="mt-5 space-y-2">
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={isPublished ? "secondary" : "default"}
                      disabled={togglePublishMutation.isPending}
                      className="flex-1 font-semibold cursor-pointer"
                      onClick={() => {
                        togglePublishMutation.mutate({
                          course: c,
                          targetStatus: isPublished ? "draft" : "published",
                        });
                      }}
                    >
                      {isPublished ? (
                        <>
                          <EyeOff className="mr-1.5 h-3.5 w-3.5 text-amber-500" /> Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="mr-1.5 h-3.5 w-3.5 text-emerald-300" /> Publish Live
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setEditing(c)}>
                      <Edit3 className="mr-1 h-3.5 w-3.5" /> Edit Builder
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      disabled={deleteCourseMutation.isPending}
                      className="flex-1 text-destructive hover:bg-destructive/10 cursor-pointer" 
                      onClick={() => {
                        confirmAction({
                          title: "Delete Course?",
                          description: `Are you sure you want to delete "${c.title}" and all its associated modules and lessons? This action cannot be undone.`,
                          confirmLabel: "Delete Course",
                          variant: "destructive",
                          onConfirm: () => {
                            deleteCourseMutation.mutate(c.id);
                          },
                        });
                      }}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> Delete
                    </Button>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
        <button onClick={() => setAdding(true)} className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 text-sm font-medium text-muted-foreground transition hover:border-primary hover:text-primary">
          <Plus className="h-6 w-6" /> Add new course
        </button>
      </div>

      {(editing || adding) && (
        <Modal onClose={() => { setEditing(null); setAdding(false); }} title={editing ? "Course Curriculum Builder" : "Create New Course"}>
          <CourseForm
            initial={editing ?? undefined}
            isPending={upsertCourseMutation.isPending}
            onSubmit={(data) => {
              upsertCourseMutation.mutate(data);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 animate-fade-in" 
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-elevated max-h-[90vh] overflow-y-auto animate-scale-in" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Sticky Header */}
        <div className="flex items-center justify-between border-b border-border/60 pb-4 mb-6 sticky -top-6 sm:-top-8 -mt-6 sm:-mt-8 -mx-6 sm:-mx-8 px-6 sm:px-8 pt-6 sm:pt-8 bg-card/95 backdrop-blur-md z-20">
          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground">{title}</h2>
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div>
          {children}
        </div>
      </div>
    </div>
  );
}

// Utility function to format seconds into exact MM:SS or HH:MM:SS
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

// Utility function to read exact duration from video File metadata via memory video element
function getVideoDurationFromFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    try {
      const video = document.createElement("video");
      video.preload = "metadata";
      const objectUrl = URL.createObjectURL(file);
      video.src = objectUrl;

      const cleanup = () => {
        try {
          URL.revokeObjectURL(objectUrl);
          video.remove();
        } catch (_) {}
      };

      video.onloadedmetadata = () => {
        const durationSec = video.duration;
        cleanup();
        if (durationSec && !isNaN(durationSec) && durationSec > 0) {
          resolve(formatVideoDuration(durationSec));
        } else {
          resolve("00:00");
        }
      };

      video.onerror = () => {
        cleanup();
        resolve("00:00");
      };

      setTimeout(() => {
        cleanup();
        resolve("00:00");
      }, 5000);
    } catch (_) {
      resolve("00:00");
    }
  });
}

// Utility to extract YouTube video ID from various URL formats
function getYouTubeVideoId(url: string): string {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url;
}

// Subcomponent to handle lesson video uploads and streaming URLs with instant preview and auto duration detection
function LessonVideoManager({
  lesson,
  onChange
}: {
  courseId: string;
  moduleId: string;
  lesson: any;
  onChange: (updates: any) => void;
}) {
  // Determine starting tab based on what resources exist on the lesson model
  const getInitialTab = () => {
    if (lesson.pdf_path || (lesson.pdf_url && !lesson.video_url)) {
      return "pdf";
    }
    if (lesson.video_path) {
      return "video";
    }
    if (lesson.video_url) {
      return "url";
    }
    return "video";
  };

  const [tab, setTab] = useState<"video" | "url" | "pdf">(getInitialTab);
  const [urlInput, setUrlInput] = useState(lesson.video_url || "");
  const [showUrlPreview, setShowUrlPreview] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveUrl = (url: string) => {
    setUrlInput(url);
    onChange({
      video_url: url.trim() || null,
      video_path: null,
      pdf_url: null,
      pdf_path: null,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError("");

    try {
      if (tab === "video") {
        // 1. Auto-detect video duration
        const detectedDuration = await getVideoDurationFromFile(file);

        // 2. Upload file
        const res = await adminService.uploadVideo(file, (percent) => {
          setUploadProgress(percent);
        });

        // 3. Update lesson
        onChange({
          video_url: res.videoPath || res.videoUrl,
          video_path: res.videoPath,
          pdf_url: null,
          pdf_path: null,
          duration: detectedDuration !== "00:00" ? detectedDuration : lesson.duration || "15:00",
        });

        setUrlInput(res.videoPath || res.videoUrl);
      } else if (tab === "pdf") {
        // 1. Upload PDF document
        const res = await adminService.uploadDocument(file, (percent) => {
          setUploadProgress(percent);
        });

        // 2. Update lesson to represent a PDF document lesson
        onChange({
          pdf_url: res.documentPath || res.documentUrl,
          pdf_path: res.documentPath,
          video_url: null,
          video_path: null,
          duration: "PDF Document",
        });

        setUrlInput("");
      }
      setIsUploading(false);
    } catch (err: any) {
      setUploadError(err.message || `Failed to upload ${tab === "video" ? "video" : "PDF"}.`);
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    setUrlInput("");
    onChange({
      video_url: null,
      video_path: null,
      pdf_url: null,
      pdf_path: null,
      duration: "00:00",
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const isYouTube = urlInput.includes("youtube.com") || urlInput.includes("youtu.be");
  const youTubeId = isYouTube ? getYouTubeVideoId(urlInput) : "";
  const isVideoAttached = lesson.video_path || (lesson.video_url && !lesson.pdf_url);
  const isPdfAttached = lesson.pdf_path || (lesson.pdf_url && !lesson.video_url);

  return (
    <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-3 text-xs transition-all">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/50 pb-2.5">
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          {isPdfAttached ? (
            <>
              <FileText className="h-3.5 w-3.5 text-primary" /> Lesson Document / File
            </>
          ) : (
            <>
              <PlayCircle className="h-3.5 w-3.5 text-primary" /> Lesson Content Media
            </>
          )}
        </span>

        {isVideoAttached || isPdfAttached ? (
          <div className="flex items-center gap-2">
            <span className="font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> {isPdfAttached ? "File Attached" : "Video Attached"}
            </span>
            <button
              type="button"
              onClick={handleRemoveMedia}
              className="text-[10px] text-destructive hover:underline font-semibold"
            >
              Remove
            </button>
          </div>
        ) : (
          <span className="font-mono bg-amber-500/15 text-amber-600 px-2.5 py-0.5 rounded text-[10px] font-bold">
            No Media Attached
          </span>
        )}
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex rounded-lg border border-border bg-card/60 p-0.5 w-fit">
        <button
          type="button"
          onClick={() => setTab("video")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
            tab === "video"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <UploadCloud className="h-3.5 w-3.5" /> Upload Video
        </button>
        <button
          type="button"
          onClick={() => setTab("url")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
            tab === "url"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Link2 className="h-3.5 w-3.5" /> External URL
        </button>
        <button
          type="button"
          onClick={() => setTab("pdf")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1 text-xs font-semibold transition ${
            tab === "pdf"
              ? "bg-primary text-primary-foreground shadow-2xs"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <FileText className="h-3.5 w-3.5" /> Upload File / Resource
        </button>
      </div>

      {tab === "video" && (
        /* TAB 1: LOCAL VIDEO UPLOAD */
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            key="video-file-input"
            accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov,.mkv"
            className="hidden"
            onChange={handleFileUpload}
          />

          {!isUploading ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer rounded-xl border-2 border-dashed border-border/80 bg-card/40 p-4 text-center transition hover:border-primary/60 hover:bg-primary/5"
            >
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
                <FileVideo className="h-5 w-5" />
              </div>
              <div className="mt-2 text-xs font-bold text-foreground">
                {lesson.video_url ? "Click to Replace Video File" : "Choose MP4 / WebM Video File"}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Supports direct uploads up to 1 GB · Auto-detects exact lesson duration
              </p>
              {lesson.video_url && (
                <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-sm mx-auto">
                  Current Video: {lesson.video_url.split("/").pop()}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Uploading Video File...
                </span>
                <span className="font-mono text-primary">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-primary transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "pdf" && (
        /* TAB 3: LOCAL FILE/DOCUMENT UPLOAD */
        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            key="pdf-file-input"
            accept=".pdf,.zip,.rar,.psd,.dwg,.mp3,.wav,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.png,.jpg,.jpeg,.webp,.svg,.gif"
            className="hidden"
            onChange={handleFileUpload}
          />

          {!isUploading ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer rounded-xl border-2 border-dashed border-border/80 bg-card/40 p-4 text-center transition hover:border-primary/60 hover:bg-primary/5"
            >
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
                <FileText className="h-5 w-5" />
              </div>
              <div className="mt-2 text-xs font-bold text-foreground">
                {lesson.pdf_url ? "Click to Replace Attached File" : "Choose Resource File"}
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Supports PDF, Images, ZIP, PSD, DWG, or MP3 files up to 100 MB
              </p>
              {lesson.pdf_url && (
                <div className="mt-2 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate max-w-sm mx-auto">
                  Current File: {lesson.pdf_url.split("/").pop()}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Uploading Resource File...
                </span>
                <span className="font-mono text-primary">{uploadProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-primary transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "url" && (
        /* TAB 2: EXTERNAL STREAM URL */
        <div className="space-y-3">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 flex items-start gap-2 text-muted-foreground text-[11px]">
            <Info className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <strong className="text-foreground font-semibold">Video Stream Hosting:</strong>
              <p className="mt-0.5">
                Paste an Unlisted YouTube link, Vimeo stream, Cloudflare Stream, Bunny.net, or direct MP4 URL.
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex-1">
              <Input
                value={urlInput}
                onChange={(e) => handleSaveUrl(e.target.value)}
                placeholder="Paste YouTube, Vimeo, or direct MP4 stream URL"
                className="h-8 text-xs bg-card"
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview Player Toggle (Only for Video URL / Video Local) */}
      {tab !== "pdf" && urlInput && (
        <div className="pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowUrlPreview(!showUrlPreview)}
            className="h-7 text-[11px] font-semibold flex items-center gap-1.5 bg-card"
          >
            <Eye className="h-3.5 w-3.5 text-primary" /> {showUrlPreview ? "Hide Preview Player" : "Open Preview Player"}
          </Button>

          {showUrlPreview && (
            <div className="mt-2.5 rounded-xl border border-border bg-card p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-foreground flex items-center gap-1">
                  <PlayCircle className="h-3.5 w-3.5 text-primary" /> Player Preview:
                </span>
                <button
                  type="button"
                  onClick={() => setShowUrlPreview(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕ Close
                </button>
              </div>
              <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black shadow-inner">
                {isYouTube ? (
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${youTubeId}?autoplay=0&rel=0`}
                    title="YouTube video player"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : (
                  <video src={getMediaUrl(urlInput)} controls playsInline className="w-full h-full object-contain" />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CourseForm({ initial, isPending, onSubmit }: { initial?: any; isPending: boolean; onSubmit: (data: any) => void }) {
  const courseIdRef = useRef(initial?.id || crypto.randomUUID());
  
  // Basic Info States
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price ?? 999);
  const [originalPrice, setOriginalPrice] = useState(initial?.original_price ?? 2499);
  const [status, setStatus] = useState<"draft" | "published" | "archived">(initial?.status ?? "draft");
  
  // Extended Metadata States
  const [level, setLevel] = useState(initial?.level ?? "Beginner");
  const [language, setLanguage] = useState(initial?.language ?? "Malayalam");
  const [totalDuration, setTotalDuration] = useState(initial?.total_duration ?? "2h 30m");
  const [coverUrl, setCoverUrl] = useState(initial?.cover_url ?? "/course-cover.jpeg");
  const [previewVideoUrl, setPreviewVideoUrl] = useState(initial?.preview_video_url ?? "");
  const [rating, setRating] = useState(initial?.rating ?? 4.9);
  const [reviewCount, setReviewCount] = useState(initial?.review_count ?? 1240);

  // Multi-line list states (joined by newlines for easy multi-line editing)
  const [targetAudience, setTargetAudience] = useState(
    initial?.target_audience?.length
      ? initial.target_audience.join("\n")
      : ""
  );

  const [requirements, setRequirements] = useState(
    initial?.requirements?.length
      ? initial.requirements.join("\n")
      : ""
  );

  const [highlights, setHighlights] = useState(
    initial?.highlights?.length
      ? initial.highlights.join("\n")
      : ""
  );

  const [toolsCovered, setToolsCovered] = useState(
    initial?.tools_covered?.length
      ? initial.tools_covered.join(", ")
      : ""
  );

  // Structured Learning Outcomes list state (Heading / Title only)
  const [learningOutcomesList, setLearningOutcomesList] = useState<{ id: string; title: string }[]>(() => {
    if (Array.isArray(initial?.what_you_will_learn) && initial.what_you_will_learn.length > 0) {
      return initial.what_you_will_learn.map((item: any, idx: number) => {
        const [heading] = String(item).split(":");
        return {
          id: `outcome-${idx}-${Date.now()}`,
          title: heading?.trim() || String(item).trim(),
        };
      });
    }
    return [];
  });

  const handleAddOutcome = () => {
    setLearningOutcomesList((prev) => [
      ...prev,
      { id: `outcome-${Date.now()}`, title: "" }
    ]);
  };

  const handleUpdateOutcome = (id: string, title: string) => {
    setLearningOutcomesList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title } : item))
    );
  };

  const handleDeleteOutcome = (id: string) => {
    setLearningOutcomesList((prev) => prev.filter((item) => item.id !== id));
  };

  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Multi-Module and Lessons state structure
  const [modules, setModules] = useState<any[]>(
    initial?.modules ?? [
      { id: "m-1", title: "Module 1 - Getting Started", description: "", lessons: [] }
    ]
  );

  const [newModuleTitle, setNewModuleTitle] = useState("");

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    setModules([
      ...modules,
      {
        id: `m-${Date.now()}`,
        title: newModuleTitle.trim(),
        description: "",
        lessons: []
      }
    ]);
    setNewModuleTitle("");
  };

  const handleUpdateModule = (modId: string, updates: any) => {
    setModules(
      modules.map((m) => (m.id === modId ? { ...m, ...updates } : m))
    );
  };

  const handleDeleteModule = (modId: string) => {
    const mod = modules.find((m) => m.id === modId);
    confirmAction({
      title: "Delete Module?",
      description: `Are you sure you want to delete "${mod?.title || "this module"}" and all its lessons?`,
      confirmLabel: "Delete Module",
      variant: "destructive",
      onConfirm: () => {
        setModules(modules.filter((m) => m.id !== modId));
        toast.success("Module removed");
      },
    });
  };

  const handleMoveModule = (idx: number, dir: "up" | "down") => {
    const nextIdx = dir === "up" ? idx - 1 : idx + 1;
    if (nextIdx < 0 || nextIdx >= modules.length) return;
    const list = [...modules];
    const temp = list[idx];
    list[idx] = list[nextIdx];
    list[nextIdx] = temp;
    setModules(list);
  };

  // Lesson handlers
  const handleAddLesson = (modId: string, titleText: string) => {
    if (!titleText.trim()) return;
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: [
            ...m.lessons,
            {
              id: `l-${Date.now()}`,
              title: titleText.trim(),
              description: "",
              duration: "15:00",
              video_url: "",
              video_path: "",
              is_free: false
            }
          ]
        };
      })
    );
  };

  const handleUpdateLesson = (modId: string, lesId: string, updates: any) => {
    setModules(
      modules.map((m) => {
        if (m.id !== modId) return m;
        return {
          ...m,
          lessons: m.lessons.map((l: any) => (l.id === lesId ? { ...l, ...updates } : l))
        };
      })
    );
  };

  const handleDeleteLesson = (modId: string, lesId: string) => {
    const mod = modules.find((m) => m.id === modId);
    const les = mod?.lessons?.find((l: any) => l.id === lesId);
    confirmAction({
      title: "Delete Lesson?",
      description: `Are you sure you want to delete "${les?.title || "this lesson"}"?`,
      confirmLabel: "Delete Lesson",
      variant: "destructive",
      onConfirm: () => {
        setModules(
          modules.map((m) => {
            if (m.id !== modId) return m;
            return {
              ...m,
              lessons: m.lessons.filter((l: any) => l.id !== lesId)
            };
          })
        );
        toast.success("Lesson removed");
      },
    });
  };

  const handleMoveLesson = (modIdx: number, lesIdx: number, dir: "up" | "down") => {
    const lessons = modules[modIdx].lessons;
    const nextIdx = dir === "up" ? lesIdx - 1 : lesIdx + 1;
    if (nextIdx < 0 || nextIdx >= lessons.length) return;
    const list = [...lessons];
    const temp = list[lesIdx];
    list[lesIdx] = list[nextIdx];
    list[nextIdx] = temp;

    setModules(
      modules.map((m, idx) => (idx === modIdx ? { ...m, lessons: list } : m))
    );
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const res = await adminService.uploadImage(file);
      if (res?.imageUrl || res?.imagePath) {
        setCoverUrl(res.imageUrl || res.imagePath);
      }
      setCoverUploading(false);
    } catch (err: any) {
      toast.error("Cover image upload failed: " + err.message);
      setCoverUploading(false);
    }
  };

  const autoCalculateTotalDuration = () => {
    let totalSeconds = 0;
    for (const m of modules || []) {
      for (const l of m.lessons || []) {
        if (l.duration) {
          const parts = l.duration.split(":").map(Number);
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            totalSeconds += parts[0] * 60 + parts[1];
          } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
            totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
          }
        }
      }
    }
    if (totalSeconds > 0) {
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const calculated = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
      setTotalDuration(calculated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedWhatYouWillLearn = learningOutcomesList
      .map((o) => o.title.trim())
      .filter(Boolean);

    // DEBUG: Log form data before submission
    console.log('Submitting course form data:', {
      id: courseIdRef.current,
      title,
      slug,
      tagline,
      description,
      price: Number(price) || 0,
      originalPrice: Number(originalPrice) || 0,
      level,
      language,
      totalDuration,
      coverUrl,
      previewVideoUrl,
      toolsCovered,
      highlights,
      requirements,
      targetAudience,
      whatYouWillLearn: formattedWhatYouWillLearn,
      status,
      modules
    });

    onSubmit({
      id: courseIdRef.current,
      title,
      slug,
      tagline,
      description,
      price: Number(price) || 0,
      originalPrice: Number(originalPrice) || 0,
      level,
      language,
      totalDuration,
      coverUrl,
      previewVideoUrl,
      rating: Number(rating) || 4.9,
      reviewCount: Number(reviewCount) || 1240,
      toolsCovered,
      highlights,
      requirements,
      targetAudience,
      whatYouWillLearn: formattedWhatYouWillLearn,
      status,
      modules
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-foreground pb-6">
      {/* SECTION 1: BASIC DETAILS */}
      <div className="space-y-4">
        <h3 className="font-display text-base font-bold border-b border-border/60 pb-1.5">1. Basic Details</h3>
        
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Title</span>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Course title..." required className="mt-1 bg-surface" />
          </label>
          
          <label className="block">
            <span className="text-sm font-semibold">Slug (URL string)</span>
            <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g. architecture-plan-presentation-animation" className="mt-1 bg-surface" />
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-semibold">Tagline / Short Summary</span>
          <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Transform standard architectural drawings into compelling visual presentations..." className="mt-1 bg-surface" />
        </label>
        
        <label className="block">
          <span className="text-sm font-semibold">Full Course Description</span>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Comprehensive course overview..." className="mt-1 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm shadow-soft outline-none focus:ring-2 focus:ring-ring" />
        </label>
      </div>

      {/* SECTION 2: METADATA & PRICING */}
      <div className="space-y-4">
        <h3 className="font-display text-base font-bold border-b border-border/60 pb-1.5">2. Pricing, Rating & Metadata</h3>
        
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="block">
            <span className="text-sm font-semibold">Price (₹)</span>
            <Input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} required className="mt-1 font-bold bg-surface" />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Original Price (₹)</span>
            <Input type="number" value={originalPrice} onChange={(e) => setOriginalPrice(Number(e.target.value))} required className="mt-1 bg-surface text-muted-foreground" />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Rating (out of 5)</span>
            <Input type="number" step="0.1" min="1" max="5" value={rating} onChange={(e) => setRating(Number(e.target.value))} className="mt-1 bg-surface" />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Review Count</span>
            <Input type="number" value={reviewCount} onChange={(e) => setReviewCount(Number(e.target.value))} className="mt-1 bg-surface" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-sm font-semibold">Level</span>
            <select value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm shadow-soft outline-none">
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="All Levels">All Levels</option>
              <option value="Beginner → Studio-ready">Beginner → Studio-ready</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Language</span>
            <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="e.g. Malayalam" className="mt-1 bg-surface" />
          </label>

          <div className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Total Duration</span>
              <button 
                type="button" 
                onClick={autoCalculateTotalDuration} 
                className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
              >
                Auto-calculate
              </button>
            </div>
            <Input value={totalDuration} onChange={(e) => setTotalDuration(e.target.value)} placeholder="e.g. 18h 45m" className="mt-1 bg-surface" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold">Status</span>
            <select value={status} onChange={(e: any) => setStatus(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-input bg-surface px-3 text-sm shadow-soft outline-none">
              <option value="draft">Draft (Unpublished)</option>
              <option value="published">Published (Live in catalog & accessible)</option>
              <option value="archived">Archived</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">YouTube Preview Video (Watch Link)</span>
            <Input value={previewVideoUrl} onChange={(e) => setPreviewVideoUrl(e.target.value)} placeholder="https://youtu.be/..." className="mt-1 bg-surface" />
          </label>
        </div>

        <div className="block">
          <span className="text-sm font-semibold">Course Cover Image</span>
          <div className="flex gap-2 mt-1">
            <Input value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} placeholder="Image cover URL or upload below..." className="flex-1 bg-surface font-mono text-xs" />
            <input type="file" accept="image/*" ref={coverInputRef} onChange={handleCoverUpload} className="hidden" />
            <Button type="button" variant="outline" disabled={coverUploading} onClick={() => coverInputRef.current?.click()} className="flex items-center gap-1">
              {coverUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Image className="h-4 w-4" />} Upload Image
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION 3: COMPREHENSIVE CURRICULUM SPECIFICATIONS */}
      <div className="space-y-4">
        <div className="border-b border-border/60 pb-1.5 flex items-center justify-between">
          <h3 className="font-display text-base font-bold">3. Course Specifications & Target Audience</h3>
          <span className="text-xs text-muted-foreground">Each new line creates an individual bullet point on the live course page</span>
        </div>

        {/* Designed For / Target Audience */}
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Designed For (Target Audience)
            </span>
            <span className="text-xs text-muted-foreground">1 target audience group per line</span>
          </div>
          <textarea 
            value={targetAudience} 
            onChange={(e) => setTargetAudience(e.target.value)} 
            rows={5} 
            placeholder="e.g.&#10;Architecture Students&#10;Civil Engineering Students&#10;Interior Designers"
            className="mt-1.5 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm font-sans leading-relaxed shadow-soft outline-none focus:ring-2 focus:ring-ring" 
          />
        </label>

        {/* What You Will Learn / Structured Learning Outcomes */}
        <div className="space-y-3 rounded-2xl border border-border/80 bg-muted/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-bold text-foreground">
                Learning Outcomes (What You Will Learn)
              </span>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add outcome headings/skills that will be shown on the live course page.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={handleAddOutcome}
              className="flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            >
              <Plus className="h-4 w-4" /> Add Outcome
            </Button>
          </div>

          <div className="space-y-2 pt-1">
            {learningOutcomesList.length === 0 ? (
              <div className="py-4 px-4 text-center rounded-xl border border-dashed border-border bg-background/50 text-xs text-muted-foreground">
                No learning outcomes added yet. Click &quot;Add Outcome&quot; to add one.
              </div>
            ) : (
              learningOutcomesList.map((outcome, idx) => (
                <div
                  key={outcome.id}
                  className="flex items-center gap-2 rounded-xl border border-border bg-card p-2 shadow-xs"
                >
                  <span className="inline-flex h-8 w-14 shrink-0 items-center justify-center font-mono text-xs font-bold text-primary bg-primary/10 rounded-lg">
                    #{String(idx + 1).padStart(2, "0")}
                  </span>
                  <Input
                    value={outcome.title}
                    onChange={(e) => handleUpdateOutcome(outcome.id, e.target.value)}
                    placeholder="e.g. BIM & Revit workflows"
                    className="flex-1 h-9 bg-surface font-semibold text-sm"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDeleteOutcome(outcome.id)}
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>

          {learningOutcomesList.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOutcome}
              className="w-full flex items-center justify-center gap-1.5 border-dashed border-primary/40 text-primary hover:bg-primary/5 py-2 mt-2"
            >
              <Plus className="h-4 w-4" /> Add Another Learning Outcome
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Requirements / Prerequisites */}
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Requirements &amp; Prerequisites</span>
              <span className="text-xs text-muted-foreground">1 item per line</span>
            </div>
            <textarea 
              value={requirements} 
              onChange={(e) => setRequirements(e.target.value)} 
              rows={4} 
              placeholder="e.g.&#10;Basic computer operating system knowledge&#10;Curiosity and passion for learning"
              className="mt-1.5 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm leading-relaxed shadow-soft outline-none focus:ring-2 focus:ring-ring" 
            />
          </label>

          {/* Materials Included / Course Highlights */}
          <label className="block">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">Materials Included &amp; Highlights</span>
              <span className="text-xs text-muted-foreground">1 item per line</span>
            </div>
            <textarea 
              value={highlights} 
              onChange={(e) => setHighlights(e.target.value)} 
              rows={4} 
              placeholder="e.g.&#10;HD Video Lessons &amp; Practice Files&#10;Downloadable CAD/BIM Resource Packs"
              className="mt-1.5 w-full rounded-xl border border-input bg-surface px-3 py-2 text-sm leading-relaxed shadow-soft outline-none focus:ring-2 focus:ring-ring" 
            />
          </label>
        </div>

        {/* Software & Tools Covered */}
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">Software &amp; Tools Covered (Tag Cloud)</span>
            <span className="text-xs text-muted-foreground">Comma-separated software names</span>
          </div>
          <Input 
            value={toolsCovered} 
            onChange={(e) => setToolsCovered(e.target.value)} 
            placeholder="AutoCAD, Revit, 3ds Max, Adobe Photoshop, Rhino, Lumion, Enscape" 
            className="mt-1.5 bg-surface" 
          />
        </label>
      </div>

      {/* SECTION 4: CURRICULUM SECTION */}
      <div className="border-t border-border pt-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold">4. Course Modules & Curriculum</h3>
        </div>

        {/* List of Modules */}
        <div className="space-y-4">
          {modules.map((m, mIdx) => (
            <div key={m.id} className="rounded-2xl border border-border bg-muted/10 p-4 space-y-4">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex-1 min-w-[200px] flex items-center gap-2">
                  <span className="text-sm font-bold font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                    M{mIdx + 1}
                  </span>
                  <Input 
                    value={m.title} 
                    onChange={(e) => handleUpdateModule(m.id, { title: e.target.value })} 
                    placeholder="Module Title"
                    className="h-8 font-semibold text-sm bg-card"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => handleMoveModule(mIdx, "up")} disabled={mIdx === 0}>
                    <ArrowUp className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="icon" variant="outline" className="h-7 w-7" onClick={() => handleMoveModule(mIdx, "down")} disabled={mIdx === modules.length - 1}>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-7 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteModule(m.id)}>
                    Remove Module
                  </Button>
                </div>
              </div>

              {/* Module Description */}
              <Input 
                value={m.description || ""} 
                onChange={(e) => handleUpdateModule(m.id, { description: e.target.value })} 
                placeholder="Optional module description..." 
                className="h-7 text-xs bg-card"
              />

              {/* Lessons inside Module */}
              <div className="space-y-3 pl-4 border-l-2 border-border/80">
                <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  Lessons List ({m.lessons?.length || 0})
                </div>

                {m.lessons?.length > 0 && (
                  <div className="space-y-3">
                    {m.lessons.map((l: any, lIdx: number) => (
                      <div key={l.id} className="rounded-xl border border-border/50 bg-card p-3 space-y-3 shadow-soft">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex-1 min-w-[200px] flex items-center gap-2">
                            <span className="text-xs font-mono font-bold bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                              L{lIdx + 1}
                            </span>
                            <Input 
                              value={l.title} 
                              onChange={(e) => handleUpdateLesson(m.id, l.id, { title: e.target.value })} 
                              placeholder="Lesson Title"
                              className="h-7 font-medium text-xs bg-muted/20"
                            />
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Button type="button" size="icon" variant="outline" className="h-6 w-6" onClick={() => handleMoveLesson(mIdx, lIdx, "up")} disabled={lIdx === 0}>
                              <ArrowUp className="h-3 w-3" />
                            </Button>
                            <Button type="button" size="icon" variant="outline" className="h-6 w-6" onClick={() => handleMoveLesson(mIdx, lIdx, "down")} disabled={lIdx === m.lessons.length - 1}>
                              <ArrowDown className="h-3 w-3" />
                            </Button>
                            <Button type="button" size="icon" variant="outline" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={() => handleDeleteLesson(m.id, l.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {/* Lesson metadata row */}
                        <div className="grid gap-2 sm:grid-cols-2 items-center">
                          <label className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground whitespace-nowrap">Duration:</span>
                            <Input 
                              value={l.duration} 
                              onChange={(e) => handleUpdateLesson(m.id, l.id, { duration: e.target.value })} 
                              placeholder="12:30"
                              className="h-7 text-xs font-mono bg-surface"
                            />
                          </label>

                          <label className="flex items-center gap-2 text-xs">
                            <input 
                              type="checkbox" 
                              checked={!!l.is_free} 
                              onChange={(e) => handleUpdateLesson(m.id, l.id, { is_free: e.target.checked })} 
                              className="rounded border-border text-primary focus:ring-ring h-3.5 w-3.5"
                            />
                            <span className="font-semibold text-muted-foreground">Free Preview Lesson (Open to all students)</span>
                          </label>
                        </div>

                        {/* Video Upload Manager */}
                        <LessonVideoManager
                          courseId={courseIdRef.current}
                          moduleId={m.id}
                          lesson={l}
                          onChange={(updates) => handleUpdateLesson(m.id, l.id, updates)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Lesson Input */}
                <AddLessonForm onAdd={(titleText) => handleAddLesson(m.id, titleText)} />
              </div>
            </div>
          ))}
        </div>

        {/* Add Module Trigger */}
        <div className="flex gap-2 rounded-2xl border border-border p-4 bg-muted/5">
          <Input 
            value={newModuleTitle} 
            onChange={(e) => setNewModuleTitle(e.target.value)} 
            placeholder="New Module Title (e.g. Module 2 - Advanced Rendering)" 
            className="flex-1 bg-surface"
          />
          <Button type="button" onClick={handleAddModule} variant="outline" className="font-semibold bg-card">
            + Add Module
          </Button>
        </div>
      </div>

      <Button type="submit" disabled={isPending} className="w-full bg-gradient-primary text-primary-foreground font-bold h-12 rounded-xl shadow-soft text-base">
        {isPending ? "Saving Course..." : "Save Course & Curriculum"}
      </Button>
    </form>
  );
}

// Separate helper component to avoid form submits while typing new lesson titles
function AddLessonForm({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");

  const handleAdd = () => {
    if (!title.trim()) return;
    onAdd(title);
    setTitle("");
  };

  return (
    <div className="flex gap-2 pt-1.5">
      <Input 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        placeholder="Add lesson name (e.g. Revit Workspace settings)" 
        className="h-8 text-xs flex-1 bg-card"
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
      />
      <Button type="button" size="sm" onClick={handleAdd} variant="outline" className="h-8 text-xs font-semibold bg-card">
        + Add Lesson
      </Button>
    </div>
  );
}
