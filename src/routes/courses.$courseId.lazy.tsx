import { createLazyFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BarChart3,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Globe,
  GraduationCap,
  Layers3,
  MessageSquareQuote,
  Play,
  Share2,
  ShieldCheck,
  Star,
  Tag,
  Users,
  Wrench,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CourseOfferNotification } from "@/components/course-offer-notification";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { instructor } from "@/lib/static-data";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/lib/services/course.service";
import { testimonialService } from "@/lib/services/testimonial.service";
import { couponService, type CourseCouponProgress } from "@/lib/services/coupon.service";
import type { CourseWithContent, PublicTestimonial } from "@/lib/database.types";
import certificateImg from "@/assets/certificate.webp";
import certificateWebp from "@/assets/certificate.webp";
import { useAuth } from "@/hooks/use-auth";
import { OG_IMAGE } from "@/lib/seo";
import { getMediaUrl, isValidDuration } from "@/lib/utils";

export const Route = createLazyFileRoute("/courses/$courseId")({
  component: CourseDetailPage,
});

function getYouTubeVideoId(url?: string | null): string {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url;
}

function getVimeoVideoId(url?: string | null): string {
  if (!url) return "";
  const match = url.match(
    /(?:vimeo\.com\/(?:video\/|channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|manage\/videos\/)?|player\.vimeo\.com\/video\/)(\d+)/,
  );
  return match ? match[1] : "";
}

function getVimeoEmbedUrl(url?: string | null): string {
  if (!url) return "";
  const vimeoId = getVimeoVideoId(url);
  if (!vimeoId) return url;

  const hashMatch =
    url.match(/[?&]h=([a-zA-Z0-9]+)/) || url.match(/vimeo\.com\/\d+\/([a-zA-Z0-9]+)/);
  const hashParam = hashMatch ? `&h=${hashMatch[1]}` : "";

  return `https://player.vimeo.com/video/${vimeoId}?autoplay=0&playsinline=1&title=0&byline=0&portrait=0&color=00b2ff&transparent=0&dnt=1${hashParam}`;
}

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"overview" | "reviews">("overview");
  const [openModule, setOpenModule] = useState<number | null>(0);
  const [showMoreAbout, setShowMoreAbout] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [showAllOutcomes, setShowAllOutcomes] = useState(false);

  const {
    data: course,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["course", courseId],
    queryFn: async () => {
      const data = await courseService.getCourse(courseId);
      const mappedModules = (data.modules || []).map((m: any) => ({
        ...m,
        lessons_safe: m.lessons_safe || m.lessons || [],
      }));
      return { ...data, modules: mappedModules } as CourseWithContent;
    },
  });

  const { data: learningData, isLoading: enrollmentLoading } = useQuery({
    queryKey: ["course-learning-status", courseId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      try {
        return await courseService.getCourseLearningContent(courseId);
      } catch {
        return null;
      }
    },
    enabled: !!user && !!courseId,
  });

  const { data: testimonials = [], isLoading: testimonialsLoading } = useQuery({
    queryKey: ["course-testimonials", course?.id || courseId],
    queryFn: async () => {
      const target = course?.id || courseId;
      if (!target) return [];
      try {
        return await testimonialService.getPublicTestimonials(target);
      } catch {
        return [];
      }
    },
    enabled: !!(course?.id || courseId),
  });

  // Coupon progress for this course
  const { data: courseCoupons = [] } = useQuery({
    queryKey: ["course-coupons", course?.id || courseId],
    queryFn: async () => {
      const target = course?.id || courseId;
      if (!target) return [];
      try {
        return await couponService.getCourseCoupons(target);
      } catch {
        return [];
      }
    },
    enabled: !!(course?.id || courseId),
    select: (data) =>
      Array.isArray(data)
        ? data.filter((cp) => cp?.coupon?.isActive)
        : [],
  });

  const enrollment = learningData?.isEnrolled ? { status: "active" } : null;
  const progress = learningData?.progress || [];

  const originalPrice =
    course?.original_price || (course?.price ? Math.round(course.price * 2.5) : 0);
  const price = course?.price || 0;
  const discountPercentage =
    originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;

  const isYouTube =
    course?.preview_video_url?.includes("youtube.com") ||
    course?.preview_video_url?.includes("youtu.be");
  const youTubeId = isYouTube ? getYouTubeVideoId(course?.preview_video_url) : "";
  const isVimeo = !!course?.preview_video_url && course.preview_video_url.includes("vimeo.com");
  const vimeoEmbedUrl = isVimeo ? getVimeoEmbedUrl(course?.preview_video_url) : "";
  const isDirectVideo = !!course?.preview_video_url && !isYouTube && !isVimeo;

  const materialsList =
    course?.highlights && course.highlights.length > 0
      ? course.highlights
      : [
          "HD Video Lessons & Practice Files",
          "Downloadable CAD Resource Packs",
          "Lifetime Access & Certificate of Completion",
        ];

  const requirementsList =
    course?.requirements && course.requirements.length > 0
      ? course.requirements
      : [
          "Basic computer operating system knowledge",
          "Passion to learn industry design workflows",
          "Computer capable of running course software",
        ];

  const targetAudienceList =
    course?.target_audience && course.target_audience.length > 0
      ? course.target_audience
      : [
          "Architecture & Interior Design students",
          "Civil Engineering graduates & professionals",
          "Draftsmen, Freelancers, and 3D Visualizers",
        ];

  const learningOutcomes =
    course?.what_you_will_learn && course.what_you_will_learn.length > 0
      ? course.what_you_will_learn.map((item) => {
          const [title] = item.split(":");
          return title.trim();
        })
      : ["Architectural & CAD Workflows", "Visualisation & Detailing", "Industry Best Practices"];

  const courseModules = course?.modules || [];

  const totalLessons = courseModules.reduce(
    (total, module) => total + (module.lessons_safe?.length || 0),
    0,
  );
  const isPrebookCourse = totalLessons === 0;

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      window.setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setCopiedShare(false);
    }
  };

  const handleAddToCart = () => {
    if (!course) return;
    if (!user) {
      navigate({
        to: "/auth",
        search: {
          redirect: window.location.pathname + window.location.search,
        },
      });
      return;
    }

    navigate({
      to: "/checkout",
      search: { course: course.slug || course.id },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
        <h2 className="text-2xl font-bold text-destructive">Course not found</h2>
        <p className="text-muted-foreground mt-2 text-center max-w-md">
          The course you are trying to view does not exist or cannot be loaded at this time.
        </p>
        <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground">
          <Link to="/courses">Return to Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground selection:bg-primary selection:text-primary-foreground lg:pb-0">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-hero">
        <div className="pointer-events-none absolute -top-40 -right-32 h-[28rem] w-[28rem] rounded-full bg-brand-blue/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-brand-purple/15 blur-[120px]" />
        <div className="relative mx-auto max-w-7xl px-5 py-8 md:px-8 md:py-12 lg:py-16">
          <div className="mb-6">
            <Link
              to="/courses"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-border/80 bg-background/80 px-4 py-2 text-xs sm:text-sm font-semibold text-muted-foreground backdrop-blur transition-all hover:border-primary/50 hover:bg-card hover:text-primary group shadow-xs"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              <span>Back to Courses</span>
            </Link>
          </div>

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14 xl:gap-16">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="font-bold text-foreground">{course.rating || 4.9}</span>
                <span>({(course.review_count || 1240).toLocaleString()} ratings)</span>
                <span>Architecture &amp; Interior Design</span>
              </div>

              <div className="mt-7 max-w-5xl">
                <h1 className="font-display text-2xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.15] tracking-[-0.03em] text-foreground">
                  {course.title}
                </h1>

                <p className="mt-4 sm:mt-6 max-w-4xl text-sm sm:text-base lg:text-lg leading-relaxed text-muted-foreground">
                  {course.tagline ||
                    course.description ||
                    "Master industry-standard architectural workflows through practical structured lessons."}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsWishlisted((current) => !current)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-xs transition hover:border-primary/40 hover:text-primary cursor-pointer"
                >
                  <Bookmark
                    className={`h-4 w-4 ${isWishlisted ? "fill-primary text-primary" : ""}`}
                  />
                  {isWishlisted ? "Saved to wishlist" : "Add to wishlist"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-xs transition hover:border-primary/40 hover:text-primary cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  {copiedShare ? "Link copied" : "Share course"}
                </button>
              </div>

              {/* Dynamic Preview Media: YouTube iframe / Direct MP4 / Cover Image */}
              <div
                id="preview"
                className="mt-9 scroll-mt-28 overflow-hidden rounded-[24px] border border-border/70 bg-black shadow-elevated"
              >
                <div className="aspect-video w-full">
                  {isYouTube ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${youTubeId}?rel=0&modestbranding=1&playsinline=1`}
                      title={course.title}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  ) : isVimeo ? (
                    <iframe
                      src={vimeoEmbedUrl}
                      title={course.title}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                      allowFullScreen
                    />
                  ) : isDirectVideo ? (
                    <video
                      src={getMediaUrl(course.preview_video_url)}
                      controls
                      playsInline
                      poster={getMediaUrl(course.cover_url) || undefined}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <img
                      src={getMediaUrl(course.cover_url) || "/course-cover.jpeg"}
                      alt={course.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar Pricing & Enrollment Card */}
            <aside className="border-t border-border/70 pt-8 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
              <div>
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                    Complete course access
                  </p>

                  {discountPercentage > 0 && (
                    <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                      Save {discountPercentage}%
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
                    {course.currency || "₹"}
                    {course.price.toLocaleString()}
                  </span>
                  {originalPrice > price && (
                    <span className="text-sm font-semibold text-muted-foreground line-through">
                      {course.currency || "₹"}
                      {originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  One-time payment with lifetime access to lessons, resources, future updates, and
                  certification.
                </p>

                {!user ? (
                  <Button
                    onClick={() =>
                      navigate({
                        to: "/auth",
                        search: {
                          redirect: window.location.pathname + window.location.search,
                        },
                      })
                    }
                    className="mt-6 h-12 w-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
                  >
                    {isPrebookCourse ? "Login to Prebook" : "Login to Enroll"}
                  </Button>
                ) : enrollmentLoading ? (
                  <Button
                    disabled
                    className="mt-6 h-12 w-full bg-muted text-muted-foreground text-base font-bold"
                  >
                    Checking enrollment...
                  </Button>
                ) : enrollment ? (
                  <Button
                    onClick={() => {
                      if (progress && progress.length > 0) {
                        const latest = [...progress].sort(
                          (a, b) =>
                            new Date(b.last_watched_at).getTime() -
                            new Date(a.last_watched_at).getTime(),
                        )[0];
                        navigate({
                          to: "/learn/$courseId",
                          params: { courseId: course.slug || course.id },
                          search: { lessonId: latest.lesson_id },
                        });
                      } else {
                        navigate({
                          to: "/learn/$courseId",
                          params: { courseId: course.slug || course.id },
                        });
                      }
                    }}
                    className="mt-6 h-12 w-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
                  >
                    {isPrebookCourse
                      ? "Prebook Complete"
                      : progress && progress.length > 0
                        ? "Continue Learning"
                        : "Start Learning"}
                  </Button>
                ) : (
                  <Button
                    onClick={() =>
                      navigate({
                        to: "/checkout",
                        search: { course: course.slug || course.id },
                      })
                    }
                    className="mt-6 h-12 w-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
                  >
                    Buy Course
                  </Button>
                )}

                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Secure checkout · Instant enrollment
                </div>

                <div className="mt-8 border-y border-border/70">
                  <CourseFact
                    icon={<BarChart3 className="h-4 w-4" />}
                    label="Course level"
                    value={course.level || "Beginner"}
                  />
                  <CourseFact
                    icon={<Clock3 className="h-4 w-4" />}
                    label="Total duration"
                    value={course.total_duration || "Self-paced"}
                  />
                  <CourseFact
                    icon={<Layers3 className="h-4 w-4" />}
                    label="Course lessons"
                    value={`${totalLessons > 0 ? totalLessons : "Coming soon"}${totalLessons > 0 ? " lessons" : ""}`}
                  />
                  <CourseFact
                    icon={<Globe className="h-4 w-4" />}
                    label="Language"
                    value={course.language || "Malayalam"}
                  />
                  <CourseFact
                    icon={<Award className="h-4 w-4" />}
                    label="Certificate"
                    value="Included"
                    last
                  />
                </div>

                <div className="mt-7">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                    Course instructor
                  </p>

                  <div className="mt-4 flex items-center gap-4">
                    <div className="relative shrink-0">
                      <img
                        src={instructor.image}
                        alt={instructor.name}
                        className="h-14 w-14 rounded-full object-cover ring-1 ring-border ring-offset-4 ring-offset-white"
                      />
                      <span className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-white bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    </div>

                    <div className="min-w-0">
                      <h2 className="truncate font-display text-base font-extrabold text-foreground">
                        {instructor.name}
                      </h2>
                      <p className="mt-1 text-sm leading-5 text-muted-foreground">
                        Architecture & Design Instructor
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-border/70 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 sm:gap-8 px-4 sm:px-6 md:px-8">
          {[
            { id: "overview" as const, label: "Course overview" },
            { id: "reviews" as const, label: "Student reviews" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-3.5 sm:py-4 text-xs sm:text-base font-bold transition ${
                activeTab === tab.id
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span className="absolute inset-x-0 bottom-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 md:px-8 lg:py-16">
        {activeTab === "overview" && (
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-20">
            <div className="min-w-0">
              <ContentSection
                eyebrow="Course overview"
                title="A practical path from concept to presentation"
              >
                <div className="max-w-4xl text-base leading-8 text-muted-foreground">
                  <p className={showMoreAbout ? "" : "line-clamp-5 whitespace-pre-line"}>
                    {course.description ||
                      "Master architectural design, CAD workflows, 3D visualisation, construction detailing, and AI-powered design tools through a structured, project-oriented learning experience."}
                  </p>

                  {course.description && course.description.length > 200 && (
                    <button
                      type="button"
                      onClick={() => setShowMoreAbout((current) => !current)}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary transition hover:underline"
                    >
                      {showMoreAbout ? "Show less" : "Read full overview"}
                      <ArrowRight
                        className={`h-4 w-4 transition-transform ${
                          showMoreAbout ? "-rotate-90" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>
              </ContentSection>

              {/* Curriculum Section */}
              <ContentSection
                eyebrow="Curriculum"
                title={`${courseModules.length} modules · ${totalLessons} guided lessons`}
              >
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
                  {courseModules.map((module, index) => {
                    const isOpen = openModule === index;

                    return (
                      <div key={module.id} className="border-b border-border/70 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setOpenModule(isOpen ? null : index)}
                          className="grid w-full grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted/30 sm:grid-cols-[58px_minmax(0,1fr)_120px_auto] sm:gap-4 sm:px-6 sm:py-5"
                        >
                          <span className="font-display text-xs font-extrabold text-muted-foreground">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0">
                            <h3 className="font-display text-sm sm:text-base font-extrabold text-foreground sm:text-lg">
                              {module.title}
                            </h3>
                            <p className="mt-0.5 text-xs text-muted-foreground sm:hidden">
                              {module.lessons_safe?.length || 0} lessons
                            </p>
                          </div>

                          <span className="hidden text-sm font-semibold text-muted-foreground sm:block">
                            {module.lessons_safe?.length || 0} lessons
                          </span>

                          <span className="grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full border border-border bg-white text-foreground">
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-border/60 bg-muted/20 px-3.5 py-2.5 sm:px-6">
                            {(module.lessons_safe || []).map((lesson, lessonIndex) => {
                              const canWatch = !!enrollment || !!lesson.is_free;
                              return (
                                <div
                                  key={lesson.id}
                                  onClick={() => {
                                    if (canWatch) {
                                      if (!user) {
                                        navigate({
                                          to: "/auth",
                                          search: {
                                            redirect: `/learn/${course.slug || course.id}?lessonId=${lesson.id}`,
                                          },
                                        });
                                      } else {
                                        navigate({
                                          to: "/learn/$courseId",
                                          params: { courseId: course.slug || course.id },
                                          search: { lessonId: lesson.id },
                                        });
                                      }
                                    }
                                  }}
                                  className={`group flex items-center justify-between gap-3 border-b border-border/60 py-3 sm:pl-[58px] last:border-b-0 rounded-lg px-2 transition ${
                                    canWatch ? "cursor-pointer hover:bg-primary/5" : ""
                                  }`}
                                >
                                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                                    <span
                                      className={`grid h-6 w-6 sm:h-7 sm:w-7 shrink-0 place-items-center rounded-full transition ${
                                        canWatch
                                          ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105"
                                          : "bg-muted text-muted-foreground/60"
                                      }`}
                                    >
                                      <Play className="h-2.5 w-2.5 sm:h-3 sm:w-3 fill-current" />
                                    </span>
                                    <span
                                      className={`truncate text-xs sm:text-sm font-medium transition ${
                                        canWatch
                                          ? "text-foreground group-hover:text-primary"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {lessonIndex + 1}. {lesson.title}
                                    </span>
                                    {lesson.is_free && (
                                      <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold shrink-0 flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        Free Preview
                                      </span>
                                    )}
                                  </div>
                                  {isValidDuration(lesson.duration) && (
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground">
                                        {lesson.duration}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ContentSection>

              {/* Learning Outcomes Section */}
              <ContentSection
                eyebrow="Learning outcomes"
                title="Skills you will build during the programme"
              >
                <div className="grid gap-x-10 gap-y-0 border-t border-border/70 md:grid-cols-2">
                  {learningOutcomes.map((item, index) => (
                    <article
                      key={`${item}-${index}`}
                      className="grid grid-cols-[44px_minmax(0,1fr)] gap-4 border-b border-border/70 py-5 items-center"
                    >
                      <span className="font-display text-sm font-extrabold text-primary">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="font-display text-base font-bold text-foreground">{item}</h3>
                    </article>
                  ))}
                </div>
              </ContentSection>

              {/* Certificate Section */}
              <section className="relative overflow-hidden rounded-2xl sm:rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-white to-brand-blue/[0.08] p-5 sm:p-10 lg:p-12 shadow-soft sm:shadow-elevated">
                <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative grid gap-6 sm:gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      <GraduationCap className="h-4 w-4" />
                      Professional recognition
                    </div>
                    <h2 className="mt-2.5 sm:mt-4 max-w-2xl font-display text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight text-foreground">
                      Complete the programme with a verifiable certificate.
                    </h2>
                    <p className="mt-2.5 sm:mt-4 max-w-2xl text-xs sm:text-base leading-relaxed text-muted-foreground">
                      Add it to your resume, LinkedIn profile, and portfolio to demonstrate
                      structured learning and practical project experience.
                    </p>

                    <div className="mt-4 sm:mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs sm:text-sm font-semibold text-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        Verifiable credential
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                        Resume &amp; LinkedIn ready
                      </span>
                    </div>
                  </div>

                  <div className="relative flex min-h-[160px] sm:min-h-[220px] items-center justify-center rounded-xl sm:rounded-2xl border border-border/70 bg-white p-3 sm:p-5 shadow-soft">
                    {course?.certificate_url ? (
                      <img
                        src={getMediaUrl(course.certificate_url)}
                        alt={`${course.title} certificate of completion`}
                        className="max-h-[160px] sm:max-h-[230px] w-full object-contain rounded-lg shadow-xs"
                      />
                    ) : (
                      <picture>
                        <source srcSet={certificateWebp} type="image/webp" />
                        <img
                          src={certificateImg}
                          alt="ArchitectureNext certificate of completion"
                          className="max-h-[150px] sm:max-h-[220px] w-full object-contain"
                        />
                      </picture>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar Details: Materials, Requirements, Target Audience */}
            <aside className="space-y-6 sm:space-y-10">
              <InformationList
                icon={<FileText className="h-4 w-4" />}
                title="Materials included"
                items={materialsList}
              />
              <InformationList
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="Requirements"
                items={requirementsList}
              />
              <InformationList
                icon={<Users className="h-4 w-4" />}
                title="Designed for"
                items={targetAudienceList}
              />
            </aside>
          </div>
        )}

        {/* Student Reviews Tab Content (Removed from Course overview, shown exclusively in Student reviews tab) */}
        {activeTab === "reviews" && (
          <section id="reviews" className="scroll-mt-24">
            <div className="flex items-center justify-between gap-4 mb-5 sm:mb-7">
              <div className="flex items-center gap-2">
                <h2 className="font-display text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                  Student Reviews
                </h2>
              </div>

              {/* Write a Review Button */}
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 sm:h-9 rounded-full border-primary/30 hover:border-primary hover:bg-primary/5 text-xs font-semibold text-primary"
              >
                <Link
                  to="/dashboard/testimonials"
                  search={{ courseId: course.id }}
                >
                  <MessageSquareQuote className="h-3.5 w-3.5 mr-1" />
                  <span>{enrollment ? "Write a Review" : "Reviews"}</span>
                </Link>
              </Button>
            </div>

            {testimonialsLoading ? (
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex h-44 flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-2xs animate-pulse"
                  >
                    <div className="space-y-3">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <div key={s} className="h-3.5 w-3.5 rounded-full bg-muted" />
                        ))}
                      </div>
                      <div className="h-3.5 w-full rounded bg-muted" />
                      <div className="h-3.5 w-4/5 rounded bg-muted" />
                    </div>
                    <div className="flex items-center gap-2.5 pt-3 border-t border-border/60">
                      <div className="h-8 w-8 rounded-full bg-muted" />
                      <div className="space-y-1">
                        <div className="h-3 w-20 rounded bg-muted" />
                        <div className="h-2.5 w-14 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : testimonials.length === 0 ? (
              <div className="pt-4 text-center">
                <div className="rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 sm:p-10 max-w-lg mx-auto">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                    <MessageSquareQuote className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-sm sm:text-base font-bold text-foreground">
                    No student reviews for this course yet
                  </h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                    Be the first enrolled learner to share your project feedback and experience for this programme.
                  </p>
                  {enrollment && (
                    <Button
                      asChild
                      size="sm"
                      className="mt-4 h-8 rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground shadow-soft"
                    >
                      <Link to="/dashboard/testimonials" search={{ courseId: course.id }}>
                        Write First Review
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-6 sm:grid-cols-2">
                {testimonials.slice(0, 4).map((testimonial) => (
                  <CourseReviewCard key={testimonial.id} testimonial={testimonial} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Mobile sticky purchase / continue learning bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 py-2.5 shadow-elevated backdrop-blur-md lg:hidden pb-[max(0.65rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          {enrollment ? (
            <>
              <div className="min-w-0 flex-1">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Enrolled
                </span>
                <p className="mt-0.5 truncate text-xs font-semibold text-muted-foreground">
                  Lifetime access unlocked
                </p>
              </div>

              <Button
                onClick={() => {
                  if (progress && progress.length > 0) {
                    const latest = [...progress].sort(
                      (a, b) =>
                        new Date(b.last_watched_at).getTime() -
                        new Date(a.last_watched_at).getTime(),
                    )[0];
                    navigate({
                      to: "/learn/$courseId",
                      params: { courseId: course.slug || course.id },
                      search: { lessonId: latest.lesson_id },
                    });
                  } else {
                    navigate({
                      to: "/learn/$courseId",
                      params: { courseId: course.slug || course.id },
                    });
                  }
                }}
                className="h-10 bg-gradient-primary px-5 font-bold text-sm text-primary-foreground shadow-glow hover:brightness-110 active:scale-95 cursor-pointer"
              >
                {isPrebookCourse
                  ? "Prebook Complete"
                  : progress && progress.length > 0
                    ? "Continue Learning"
                    : "Start Learning"}
              </Button>
            </>
          ) : (
            <>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-lg sm:text-xl font-extrabold text-foreground">
                    {course.currency || "₹"}
                    {course.price.toLocaleString()}
                  </span>
                  {originalPrice > price && (
                    <span className="text-xs font-semibold text-muted-foreground line-through">
                      {course.currency || "₹"}
                      {originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {discountPercentage > 0 ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    Save {discountPercentage}% · Instant Access
                  </span>
                ) : (
                  <p className="text-[10px] font-semibold text-muted-foreground">
                    One-time payment
                  </p>
                )}
              </div>

              <Button
                onClick={handleAddToCart}
                className="h-10 bg-gradient-primary px-5 font-bold text-sm text-primary-foreground shadow-glow hover:brightness-110 active:scale-95 cursor-pointer"
              >
                {!user
                  ? isPrebookCourse
                    ? "Login to Prebook"
                    : "Login to Enroll"
                  : isPrebookCourse
                    ? "Prebook Now"
                    : "Buy Course"}
              </Button>
            </>
          )}
        </div>
      </div>

      {!enrollment && courseCoupons.length > 0 && (
        <CourseOfferNotification course={course} coupon={courseCoupons[0]} />
      )}

      <Footer />
    </div>
  );
}

function CourseFact({
  icon,
  label,
  value,
  last = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 py-3.5 ${
        last ? "" : "border-b border-border/70"
      }`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-xs sm:text-sm font-medium text-muted-foreground">{label}</span>
      <span className="max-w-[145px] text-right text-xs sm:text-sm font-extrabold leading-5 text-foreground">
        {value}
      </span>
    </div>
  );
}

function ContentSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-10 sm:mb-16 last:mb-0">
      <div className="mb-4 sm:mb-7">
        <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
        <h2 className="mt-2 sm:mt-3 max-w-3xl font-display text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function InformationList({
  icon,
  title,
  items,
}: {
  icon: ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <section className="rounded-xl border border-border/70 bg-card/60 p-4 sm:p-5 shadow-2xs">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h3 className="font-display text-xs sm:text-sm font-extrabold uppercase tracking-[0.12em] text-foreground">
          {title}
        </h3>
      </div>

      <ul className="mt-3 space-y-2 sm:space-y-2.5">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed text-muted-foreground"
          >
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
              aria-hidden="true"
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function CourseReviewCard({ testimonial }: { testimonial: PublicTestimonial }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = (testimonial.quote || "").length > 140;

  return (
    <figure className="group relative flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-soft">
      <div>
        <div className="flex items-center justify-between gap-2">
          <div className="flex text-amber-400">
            {Array.from({ length: testimonial.rating || 5 }).map((_, starIndex) => (
              <Star key={starIndex} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Verified Student
          </span>
        </div>

        <blockquote className="mt-3.5 text-xs sm:text-sm leading-relaxed text-foreground/85">
          <p className={isExpanded ? "" : "line-clamp-3"}>
            “{testimonial.quote}”
          </p>
        </blockquote>

        {isLong && (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 inline-flex items-center gap-1 text-[11px] sm:text-xs font-bold text-primary hover:underline cursor-pointer"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>

      <figcaption className="mt-5 border-t border-border/60 pt-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full bg-gradient-primary text-xs font-bold text-primary-foreground overflow-hidden">
            {testimonial.avatarUrl || (testimonial as any).avatar ? (
              <img
                src={testimonial.avatarUrl || (testimonial as any).avatar}
                alt={testimonial.name}
                className="h-full w-full object-cover"
              />
            ) : (
              (testimonial.name || "A")[0]
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-xs sm:text-sm font-bold text-foreground">
              {testimonial.name}
            </p>
            <p className="truncate text-[10px] sm:text-xs text-muted-foreground">
              {testimonial.role || "Architecture Learner"}
            </p>
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
