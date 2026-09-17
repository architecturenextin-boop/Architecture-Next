import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
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
  Play,
  RefreshCw,
  Share2,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/site-header";
import { Footer } from "@/components/footer";
import { instructor, testimonials } from "@/lib/static-data";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "@/lib/services/course.service";
import type { CourseWithContent } from "@/lib/database.types";
import certificateImg from "@/assets/certificate.png";
import certificateWebp from "@/assets/certificate.webp";
import { useAuth } from "@/hooks/use-auth";
import { getMediaUrl } from "@/lib/utils";

export const Route = createFileRoute("/courses/$courseId")({
  head: () => {
    return {
      meta: [
        { title: "Course Details — ArchitectureNext" },
        { name: "description", content: "Explore complete curriculum, projects, and enrolment details." },
      ],
    };
  },
  component: CourseDetailPage,
});

function getYouTubeVideoId(url?: string | null): string {
  if (!url) return "";
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : url;
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

  const { data: course, isLoading, error } = useQuery({
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

  const enrollment = learningData?.isEnrolled ? { status: "active" } : null;
  const progress = learningData?.progress || [];

  const originalPrice = course?.original_price || (course?.price ? Math.round(course.price * 2.5) : 0);
  const price = course?.price || 0;
  const discountPercentage =
    originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const isYouTube = course?.preview_video_url?.includes("youtube.com") || course?.preview_video_url?.includes("youtu.be");
  const youTubeId = isYouTube ? getYouTubeVideoId(course?.preview_video_url) : "";
  const isDirectVideo = !!course?.preview_video_url && !isYouTube;

  const lastUpdatedFormatted = useMemo(() => {
    if (!course?.updated_at) return "Recently updated";
    try {
      return new Date(course.updated_at).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently updated";
    }
  }, [course?.updated_at]);

  const materialsList =
    course?.highlights && course.highlights.length > 0
      ? course.highlights
      : ["HD Video Lessons & Practice Files", "Downloadable CAD/BIM Resource Packs", "Lifetime Access & Certificate of Completion"];

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
      : [
          "BIM & CAD Workflows",
          "Visualisation & Detailing",
          "Industry Best Practices",
        ];

  const courseModules = course?.modules || [];

  const totalLessons = courseModules.reduce(
    (total, module) => total + (module.lessons_safe?.length || 0),
    0,
  );

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
    if (!cartAdded) {
      setCartAdded(true);
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
    <div className="min-h-screen bg-white pb-20 text-foreground selection:bg-primary selection:text-primary-foreground lg:pb-0">
      <SiteHeader
        action={
          <Button
            onClick={handleAddToCart}
            size="sm"
            className="bg-gradient-primary px-4 font-semibold text-primary-foreground shadow-soft transition-all hover:brightness-110 sm:px-5"
          >
            {cartAdded ? "View cart" : "Enroll Now"}
          </Button>
        }
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-hero">
        <div className="pointer-events-none absolute -right-36 -top-48 h-[32rem] w-[32rem] rounded-full bg-brand-blue/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-56 left-0 h-[30rem] w-[30rem] rounded-full bg-brand-purple/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-14 xl:gap-16">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className="h-4 w-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
                <span className="font-bold text-foreground">
                  {course.rating || 4.9}
                </span>
                <span>
                  ({(course.review_count || 1240).toLocaleString()} ratings)
                </span>
                <span>Architecture &amp; Interior Design</span>
              </div>

              <div className="mt-7 max-w-5xl">
                <div className="mb-4 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  <Sparkles className="h-4 w-4" />
                  {course.level || "Professional"} Online Programme
                </div>

                <h1 className="font-display text-4xl font-extrabold leading-[1.06] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-[3.6rem]">
                  {course.title}
                </h1>

                <p className="mt-6 max-w-4xl text-base leading-8 text-muted-foreground sm:text-lg">
                  {course.tagline || course.description || "Master industry-standard architectural workflows through practical structured lessons."}
                </p>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsWishlisted((current) => !current)}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-xs transition hover:border-primary/40 hover:text-primary"
                >
                  <Bookmark
                    className={`h-4 w-4 ${
                      isWishlisted ? "fill-primary text-primary" : ""
                    }`}
                  />
                  {isWishlisted ? "Saved to wishlist" : "Add to wishlist"}
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground shadow-xs transition hover:border-primary/40 hover:text-primary"
                >
                  <Share2 className="h-4 w-4" />
                  {copiedShare ? "Link copied" : "Share course"}
                </button>
              </div>

              {/* Dynamic Preview Media: YouTube iframe / Direct MP4 / Cover Image */}
              <div className="mt-9 overflow-hidden rounded-[24px] border border-border/70 bg-black shadow-[0_24px_70px_-34px_rgba(15,23,42,0.42)]">
                <div className="aspect-video w-full">
                  {isYouTube ? (
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${youTubeId}?rel=0&modestbranding=1&playsinline=1`}
                      title={course.title}
                      className="h-full w-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
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

                <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-2">
                  <span className="font-display text-5xl font-extrabold leading-none tracking-[-0.05em] text-foreground">
                    {course.currency || "₹"}
                    {course.price.toLocaleString()}
                  </span>
                  {originalPrice > price && (
                    <span className="pb-1 text-sm font-semibold text-muted-foreground line-through">
                      {course.currency || "₹"}
                      {originalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="mt-4 text-sm leading-6 text-muted-foreground">
                  One-time payment with lifetime access to lessons, resources, future updates, and certification.
                </p>

                {!user ? (
                  <Button
                    onClick={() => navigate({ to: "/auth" })}
                    className="mt-6 h-12 w-full bg-gradient-primary text-base font-bold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 hover:brightness-110"
                  >
                    Login to Enroll
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
                          (a, b) => new Date(b.last_watched_at).getTime() - new Date(a.last_watched_at).getTime()
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
                    {progress && progress.length > 0 ? "Continue Learning" : "Start Learning"}
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
                    value={`${totalLessons} lessons`}
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

                <div className="mt-7 flex items-center gap-2 border-t border-border/70 pt-5 text-xs font-medium text-muted-foreground">
                  <RefreshCw className="h-4 w-4 shrink-0 text-primary" />
                  Last updated <strong className="text-foreground">{lastUpdatedFormatted}</strong>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="border-b border-border/70 bg-white">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-5 md:px-8">
          {[
            { id: "overview" as const, label: "Course overview" },
            { id: "reviews" as const, label: "Student reviews" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`relative py-4 text-sm font-bold transition sm:text-base ${
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

      <main className="mx-auto max-w-7xl px-5 py-12 md:px-8 lg:py-16">
        {activeTab === "overview" ? (
          <div className="grid gap-14 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-20">
            <div className="min-w-0">
              <ContentSection
                eyebrow="Course overview"
                title="A practical path from concept to presentation"
              >
                <div className="max-w-4xl text-base leading-8 text-muted-foreground">
                  <p className={showMoreAbout ? "" : "line-clamp-5 whitespace-pre-line"}>
                    {course.description ||
                      "Master architectural design, BIM workflows, 3D visualisation, construction detailing, and AI-powered design tools through a structured, project-oriented learning experience."}
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
                      <h3 className="font-display text-base font-bold text-foreground">
                        {item}
                      </h3>
                    </article>
                  ))}
                </div>
              </ContentSection>

              <ContentSection
                eyebrow="Curriculum"
                title={`${courseModules.length} modules · ${totalLessons} guided lessons`}
              >
                <div className="overflow-hidden rounded-2xl border border-border/70 bg-white">
                  {courseModules.map((module, index) => {
                    const isOpen = openModule === index;

                    return (
                      <div
                        key={module.id}
                        className="border-b border-border/70 last:border-b-0"
                      >
                        <button
                          type="button"
                          onClick={() => setOpenModule(isOpen ? null : index)}
                          className="grid w-full grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-4 px-5 py-5 text-left transition hover:bg-muted/30 sm:grid-cols-[58px_minmax(0,1fr)_120px_auto] sm:px-6"
                        >
                          <span className="font-display text-xs font-extrabold text-muted-foreground">
                            {String(index + 1).padStart(2, "0")}
                          </span>

                          <div className="min-w-0">
                            <h3 className="font-display text-base font-extrabold text-foreground sm:text-lg">
                              {module.title}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground sm:hidden">
                              {module.lessons_safe?.length || 0} lessons
                            </p>
                          </div>

                          <span className="hidden text-sm font-semibold text-muted-foreground sm:block">
                            {module.lessons_safe?.length || 0} lessons
                          </span>

                          <span className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-foreground">
                            <ChevronDown
                              className={`h-4 w-4 transition-transform duration-200 ${
                                isOpen ? "rotate-180" : ""
                              }`}
                            />
                          </span>
                        </button>

                        {isOpen && (
                          <div className="border-t border-border/60 bg-muted/20 px-5 py-3 sm:px-6">
                            {(module.lessons_safe || []).map((lesson, lessonIndex) => (
                              <div
                                key={lesson.id}
                                className="flex items-center justify-between gap-4 border-b border-border/60 py-3.5 pl-[58px] last:border-b-0"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                                    <Play className="h-3 w-3 fill-current" />
                                  </span>
                                  <span className="truncate text-sm font-medium text-foreground">
                                    {lessonIndex + 1}. {lesson.title}
                                  </span>
                                  {lesson.is_free && (
                                    <span className="rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                                      Free Preview
                                    </span>
                                  )}
                                </div>
                                <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                                  {lesson.duration}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ContentSection>

              {/* Certificate Section */}
              <section className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-gradient-to-br from-primary/[0.07] via-white to-brand-blue/[0.08] p-7 sm:p-10 lg:p-12">
                <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />

                <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                      <GraduationCap className="h-4 w-4" />
                      Professional recognition
                    </div>
                    <h2 className="mt-4 max-w-2xl font-display text-2xl font-extrabold leading-tight text-foreground sm:text-3xl">
                      Complete the programme with a verifiable certificate.
                    </h2>
                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                      Add it to your resume, LinkedIn profile, and portfolio to demonstrate structured learning and practical project experience.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Verifiable credential
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary" />
                        Resume &amp; LinkedIn ready
                      </span>
                    </div>
                  </div>

                  <div className="relative flex min-h-[250px] items-center justify-center rounded-2xl border border-border/70 bg-white p-5 shadow-soft">
                    <picture>
                      <source srcSet={certificateWebp} type="image/webp" />
                      <img
                        src={certificateImg}
                        alt="ArchitectureNext certificate of completion"
                        className="max-h-[230px] w-full object-contain"
                      />
                    </picture>
                  </div>
                </div>
              </section>
            </div>

            {/* Sidebar Details: Materials, Requirements, Target Audience */}
            <aside className="space-y-10">
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
        ) : (
          <section className="mx-auto max-w-6xl">
            <div className="grid gap-8 border-b border-border/70 pb-10 md:grid-cols-[240px_minmax(0,1fr)] md:items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Overall rating
                </p>
                <div className="mt-4 flex items-end gap-3">
                  <span className="font-display text-6xl font-extrabold tracking-[-0.06em] text-foreground">
                    {course.rating || "4.9"}
                  </span>
                  <span className="pb-2 text-sm font-semibold text-muted-foreground">
                    / 5.0
                  </span>
                </div>
                <div className="mt-3 flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star
                      key={index}
                      className="h-5 w-5 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-primary">
                  Verified student feedback
                </p>
                <h2 className="mt-2 max-w-3xl font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
                  What students say after completing the course
                </h2>
              </div>
            </div>

            <div className="grid gap-6 pt-8 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <figure
                  key={testimonial.name}
                  className="flex flex-col justify-between rounded-2xl border border-border/70 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-elevated"
                >
                  <div>
                    <div className="flex text-amber-400">
                      {Array.from({ length: testimonial.rating }).map(
                        (_, starIndex) => (
                          <Star
                            key={starIndex}
                            className="h-4 w-4 fill-amber-400 text-amber-400"
                          />
                        ),
                      )}
                    </div>
                    <blockquote className="mt-5 text-base leading-8 text-foreground/85">
                      “{testimonial.quote}”
                    </blockquote>
                  </div>

                  <figcaption className="mt-7 border-t border-border/70 pt-5">
                    <p className="font-display text-sm font-extrabold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Mobile sticky purchase bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white/95 px-4 py-3 shadow-elevated backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Course price
            </p>
            <p className="font-display text-xl font-extrabold text-foreground">
              {course.currency || "₹"}
              {course.price.toLocaleString()}
            </p>
          </div>

          <Button
            onClick={handleAddToCart}
            className="h-11 bg-gradient-primary px-6 font-bold text-primary-foreground hover:brightness-110"
          >
            {cartAdded ? "Checkout" : "Enroll now"}
          </Button>
        </div>
      </div>

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
      className={`grid grid-cols-[34px_minmax(0,1fr)_auto] items-center gap-3 py-4 ${
        last ? "" : "border-b border-border/70"
      }`}
    >
      <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <span className="max-w-[145px] text-right text-sm font-extrabold leading-5 text-foreground">
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
    <section className="mb-16 last:mb-0">
      <div className="mb-7">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
        <h2 className="mt-3 max-w-3xl font-display text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
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
    <section className="border-t border-border/70 pt-6">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h3 className="font-display text-sm font-extrabold uppercase tracking-[0.12em] text-foreground">
          {title}
        </h3>
      </div>

      <ul className="mt-5 space-y-3.5">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex items-start gap-3 text-sm leading-6 text-muted-foreground"
          >
            <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
