import { createFileRoute } from "@tanstack/react-router";
import {
  Search,
  Loader2,
  Users,
  BookOpen,
  ShieldCheck,
  GraduationCap,
  Phone,
  Mail,
  Calendar,
  Eye,
  X,
  PlusCircle,
  CheckCircle2,
  Trash2,
  Edit3,
  Check,
  Save,
  UserCheck,
  UserX,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Circle,
  Clock,
  PlayCircle,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { toast } from "sonner";
import { confirmAction } from "@/lib/confirm";

export const Route = createFileRoute("/admin/students")({
  head: () => ({ meta: [{ title: "Students Management — Admin" }] }),
  component: StudentsPage,
});

function StudentsPage() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "student" | "admin">("all");
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    goal: "",
    role: "student" as "student" | "admin",
  });
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const [expandedCourseIds, setExpandedCourseIds] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();

  // 1. Query all profiles from Backend REST API
  const { data: students = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      return adminService.getAllStudents();
    },
  });

  // 2. Fetch all courses with full modules & lessons
  const { data: fullCourses = [] } = useQuery({
    queryKey: ["admin-all-courses-full"],
    queryFn: async () => {
      return adminService.getAllCourses();
    },
  });

  const courses = useMemo(() => {
    return fullCourses.map((c: any) => ({ id: c.id, title: c.title, price: c.price }));
  }, [fullCourses]);

  // 3. Query progress data for the selected student & enrolled courses
  const { data: myCoursesProgress = [] } = useQuery({
    queryKey: ["admin-dashboard-my-courses-progress", selectedStudent?.id],
    queryFn: async () => {
      try {
        return await dashboardService.getMyCourses();
      } catch {
        return [];
      }
    },
    enabled: !!selectedStudent?.id,
  });

  const { data: coursesProgressMap = {} } = useQuery({
    queryKey: ["admin-student-courses-progress", selectedStudent?.id, selectedStudent?.enrollments, fullCourses],
    queryFn: async () => {
      if (!selectedStudent?.id || !selectedStudent?.enrollments?.length) return {};
      const result: Record<string, any[]> = {};

      // 1. Try student-specific admin progress endpoint
      try {
        const studentDetail = await adminService.getStudentProgress(selectedStudent.id);
        if (studentDetail?.progress && Array.isArray(studentDetail.progress)) {
          result["all"] = studentDetail.progress;
        } else if (Array.isArray(studentDetail)) {
          result["all"] = studentDetail;
        }
      } catch (_) {}

      // 2. Query each enrolled course by both slug and ID
      await Promise.allSettled(
        selectedStudent.enrollments.map(async (en: any) => {
          const cId = en.course?.id || en.course_id;
          const matchingCourse = fullCourses.find((fc: any) => fc.id === cId || fc.title === en.course?.title);
          const cSlug = en.course?.slug || matchingCourse?.slug;
          const targets = [cSlug, cId].filter(Boolean) as string[];

          for (const target of targets) {
            try {
              // Check React Query cache first
              let data: any = queryClient.getQueryData(["learn-course", target]);
              if (!data) {
                data = await courseService.getCourseLearningContent(target);
              }

              if (data?.progress && Array.isArray(data.progress)) {
                if (cId) result[cId] = data.progress;
                if (cSlug) result[cSlug] = data.progress;
                if (matchingCourse?.id) result[matchingCourse.id] = data.progress;
                if (matchingCourse?.slug) result[matchingCourse.slug] = data.progress;
                result[target] = data.progress;
                break;
              }
            } catch (_) {
              // Check localStorage cache fallback
              try {
                const localKey = `skillspring_course_learn_${target}`;
                const cached = localStorage.getItem(localKey);
                if (cached) {
                  const parsed = JSON.parse(cached);
                  if (parsed?.progress && Array.isArray(parsed.progress)) {
                    if (cId) result[cId] = parsed.progress;
                    if (cSlug) result[cSlug] = parsed.progress;
                    result[target] = parsed.progress;
                    break;
                  }
                }
              } catch (_) {}
            }
          }
        })
      );

      return result;
    },
    enabled: !!selectedStudent?.id && !!selectedStudent?.enrollments?.length,
  });

  // Consolidate all progress records for the selected student
  const studentProgressList = useMemo(() => {
    if (!selectedStudent) return [];
    const fromStudent = Array.isArray(selectedStudent.progress)
      ? selectedStudent.progress
      : Array.isArray(selectedStudent.lesson_progress)
      ? selectedStudent.lesson_progress
      : [];

    const fromEnrollments = (selectedStudent.enrollments || []).flatMap((en: any) =>
      Array.isArray(en.progress) ? en.progress : Array.isArray(en.lesson_progress) ? en.lesson_progress : []
    );

    const fromCourseMap = Object.values(coursesProgressMap).flat();

    const map = new Map<string, any>();
    [...fromEnrollments, ...fromStudent, ...fromCourseMap].forEach((item: any) => {
      if (item && (item.lesson_id || item.id)) {
        map.set(item.lesson_id || item.id, item);
      }
    });

    return Array.from(map.values());
  }, [selectedStudent, coursesProgressMap]);

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourseIds((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));
  };

  // Sync edit form whenever selected student changes
  useEffect(() => {
    if (selectedStudent) {
      setEditForm({
        full_name: selectedStudent.full_name || "",
        email: selectedStudent.email || "",
        phone: selectedStudent.phone || "",
        goal: selectedStudent.goal || "",
        role: (selectedStudent.role as "student" | "admin") || "student",
      });
      setIsEditing(false);
    }
  }, [selectedStudent]);

  // 3. Mutation: Grant / Enroll Student in a course
  const enrollStudentMutation = useMutation({
    mutationFn: async ({ userId, courseId }: { userId: string; courseId: string }) => {
      return adminService.manualEnrollStudent({ userId, courseId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setEnrollCourseId("");
      toast.success("Student enrolled successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to enroll student.");
    },
  });

  // 4. Mutation: Revoke / Remove Course Access
  const revokeEnrollmentMutation = useMutation({
    mutationFn: async ({ userId, courseId, enrollmentId }: { userId: string; courseId?: string; enrollmentId?: string }) => {
      return adminService.revokeStudentEnrollment({ userId, courseId, enrollmentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      toast.success("Course access removed successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to remove course access.");
    },
  });

  // 5. Mutation: Update User Role (Student <-> Admin)
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: "admin" | "student" }) => {
      return adminService.updateStudentRole(userId, role);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      toast.success("Role updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role.");
    },
  });

  // 6. Mutation: Update Student Details (Name, Email, Phone, Goal, Role)
  const updateStudentMutation = useMutation({
    mutationFn: async ({
      userId,
      payload,
    }: {
      userId: string;
      payload: {
        full_name?: string;
        email?: string;
        phone?: string;
        goal?: string;
        role?: "admin" | "student";
      };
    }) => {
      return adminService.updateStudent(userId, payload);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setSelectedStudent((prev: any) => (prev ? { ...prev, ...variables.payload } : null));
      setIsEditing(false);
      toast.success("User details updated successfully!");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update user details.");
    },
  });

  // 7. Mutation: Delete User
  const deleteStudentMutation = useMutation({
    mutationFn: async (userId: string) => {
      return adminService.deleteStudent(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-students"] });
      setSelectedStudent(null);
      toast.success("User deleted successfully.");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete user.");
    },
  });

  const handleDeleteStudent = (student: any) => {
    confirmAction({
      title: "Delete User Account?",
      description: `Are you sure you want to permanently delete ${
        student.full_name || student.email || "this user"
      }? This will remove all their enrollments and profile history. This action cannot be undone.`,
      confirmLabel: "Delete User Permanently",
      variant: "destructive",
      onConfirm: () => {
        deleteStudentMutation.mutate(student.id);
      },
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const rawDigits = editForm.phone.replace(/\D/g, "");
    const cleanPhone =
      rawDigits.length > 10 && rawDigits.startsWith("91") ? rawDigits.slice(2) : rawDigits.slice(-10);

    updateStudentMutation.mutate({
      userId: selectedStudent.id,
      payload: {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: cleanPhone || editForm.phone.trim(),
        goal: editForm.goal.trim(),
        role: editForm.role,
      },
    });
  };

  // Filter students based on search and role
  const filteredStudents = useMemo(() => {
    return students.filter((s: any) => {
      const matchSearch =
        !search.trim() ||
        (s.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (s.phone || "").includes(search.trim()) ||
        (s.id || "").toLowerCase().includes(search.toLowerCase());

      const matchRole = roleFilter === "all" || s.role === roleFilter;

      return matchSearch && matchRole;
    });
  }, [students, search, roleFilter]);

  // Key stats
  const totalStudents = students.length;
  const enrolledStudents = students.filter((s: any) => s.coursesCount > 0).length;
  const totalEnrollments = students.reduce((acc: number, s: any) => acc + s.coursesCount, 0);
  const totalAdmins = students.filter((s: any) => s.role === "admin").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Students &amp; Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage registered learners, active course enrollments, profile updates, and system roles.
          </p>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Users</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold">{totalStudents}</div>
          <div className="text-xs text-muted-foreground mt-0.5">All registered accounts</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Active Learners</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-success/10 text-success">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold">{enrolledStudents}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Enrolled in ≥ 1 course</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Enrollments</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent">
              <BookOpen className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold">{totalEnrollments}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Active course accesses</div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Admins</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/10 text-purple-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 font-display text-2xl font-bold">{totalAdmins}</div>
          <div className="text-xs text-muted-foreground mt-0.5">Admin privilege accounts</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setRoleFilter("all")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              roleFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All Users ({students.length})
          </button>
          <button
            onClick={() => setRoleFilter("student")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              roleFilter === "student"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Students ({students.filter((s: any) => s.role !== "admin").length})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              roleFilter === "admin"
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Admins ({students.filter((s: any) => s.role === "admin").length})
          </button>
        </div>

        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, phone, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {/* Main Students List / Table */}
      {profilesLoading ? (
        <div className="flex h-[40vh] items-center justify-center bg-card rounded-2xl border border-border">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="text-center p-12 text-sm text-muted-foreground bg-card rounded-2xl border border-border shadow-soft">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-foreground">No students or users found</p>
          <p className="text-xs mt-1">Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <>
          {/* Mobile Student Cards (< 640px) */}
          <div className="space-y-3.5 sm:hidden">
            {filteredStudents.map((r: any) => {
              const coursesCount = r.coursesCount || 0;
              const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A";
              const initial = (r.full_name || r.email || "L")[0].toUpperCase();

              return (
                <article key={r.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <span className="font-semibold text-foreground block truncate">
                          {r.full_name || "Learner"}
                        </span>
                        <span className="text-[11px] text-muted-foreground font-mono block">
                          ID: {r.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>

                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                        r.role === "admin"
                          ? "bg-purple-500/15 text-purple-600 border border-purple-500/20"
                          : "bg-emerald-500/15 text-emerald-600"
                      }`}
                    >
                      {r.role || "student"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground border-y border-border/60 py-2.5">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{r.email || "No email"}</span>
                    </div>
                    {r.phone ? (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>+91 {r.phone}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 italic text-[11px]">
                        <Phone className="h-3.5 w-3.5 text-amber-500/70 shrink-0" />
                        <span>Mobile number required</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                          coursesCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <BookOpen className="h-3 w-3" /> {coursesCount} {coursesCount === 1 ? "Course" : "Courses"}
                      </span>
                      <span className="text-[11px]">Joined {date}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedStudent(r)}
                      className="flex-1 min-h-[40px] text-xs font-semibold gap-1.5 cursor-pointer"
                    >
                      <Eye className="h-4 w-4" /> Manage Details
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteStudent(r)}
                      className="h-10 w-10 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer shrink-0"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Tablet & Desktop Table (>= 640px) */}
          <div className="hidden sm:block overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3.5 text-left">Student / User</th>
                    <th className="hidden px-5 py-3.5 text-left md:table-cell">Contact</th>
                    <th className="px-5 py-3.5 text-left">Enrollments</th>
                    <th className="hidden px-5 py-3.5 text-left lg:table-cell">Status</th>
                    <th className="hidden px-5 py-3.5 text-left sm:table-cell">Joined</th>
                    <th className="px-5 py-3.5 text-left">Role</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredStudents.map((r: any) => {
                    const coursesCount = r.coursesCount || 0;
                    const date = r.created_at ? new Date(r.created_at).toLocaleDateString() : "N/A";
                    const initial = (r.full_name || r.email || "L")[0].toUpperCase();

                    return (
                      <tr key={r.id} className="hover:bg-muted/20 transition-colors">
                        {/* Student Name & ID */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
                              {initial}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-foreground block truncate">
                                {r.full_name || "Learner"}
                              </span>
                              <span className="text-[11px] text-muted-foreground font-mono block">
                                ID: {r.id.substring(0, 8)}...
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email & Mobile */}
                        <td className="hidden px-5 py-3.5 md:table-cell">
                          <div className="space-y-0.5 text-xs">
                            <div className="flex items-center gap-1.5 text-foreground">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[200px]">{r.email || "No email"}</span>
                            </div>
                            {r.phone ? (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>+91 {r.phone}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 italic text-[11px]">
                                <Phone className="h-3.5 w-3.5 text-amber-500/70 shrink-0" />
                                <span>Mobile number required</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Courses Count */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                              coursesCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}
                          >
                            <BookOpen className="h-3 w-3" /> {coursesCount} {coursesCount === 1 ? "Course" : "Courses"}
                          </span>
                        </td>

                        {/* Onboarded Status */}
                        <td className="hidden px-5 py-3.5 lg:table-cell">
                          {r.onboarded ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" /> Onboarded
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-600">
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Joined Date */}
                        <td className="hidden px-5 py-3.5 text-muted-foreground text-xs sm:table-cell">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{date}</span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-3.5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                              r.role === "admin"
                                ? "bg-purple-500/15 text-purple-600 border border-purple-500/20"
                                : "bg-emerald-500/15 text-emerald-600"
                            }`}
                          >
                            {r.role || "student"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedStudent(r)}
                              className="h-8 text-xs font-semibold gap-1 cursor-pointer"
                            >
                              <Eye className="h-3.5 w-3.5" /> Details
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteStudent(r)}
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Student Details & Course Enrollment Modal */}
      {selectedStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-3 sm:p-5 md:p-6 lg:p-8 animate-fade-in overflow-hidden"
          onClick={() => {
            setSelectedStudent(null);
            setIsEditing(false);
          }}
        >
          <div
            className="relative w-full max-w-lg sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl rounded-3xl border border-border bg-card shadow-elevated flex flex-col h-[88vh] max-h-[920px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/80 px-5 sm:px-7 py-4 shrink-0 bg-card z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-primary font-display text-lg font-bold text-primary-foreground shadow-soft">
                  {(selectedStudent.full_name || selectedStudent.email || "L")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-base sm:text-lg font-bold text-foreground truncate">
                      {selectedStudent.full_name || "Learner Details"}
                    </h3>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        selectedStudent.role === "admin"
                          ? "bg-purple-500/15 text-purple-600 border border-purple-500/20"
                          : "bg-emerald-500/15 text-emerald-600"
                      }`}
                    >
                      {selectedStudent.role || "student"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground font-mono truncate">
                    User ID: {selectedStudent.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={isEditing ? "secondary" : "outline"}
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-8 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  {isEditing ? (
                    <>
                      <X className="h-3.5 w-3.5" /> Cancel Edit
                    </>
                  ) : (
                    <>
                      <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                    </>
                  )}
                </Button>
                <button
                  onClick={() => {
                    setSelectedStudent(null);
                    setIsEditing(false);
                  }}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Modal Content - Guaranteed fluid scrolling */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-7 space-y-6"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {/* EDIT MODE FORM */}
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="space-y-4 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5">
                  <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                    <span className="font-display text-sm font-bold text-foreground flex items-center gap-1.5">
                      <Edit3 className="h-4 w-4 text-primary" /> Edit User Profile
                    </span>
                    <span className="text-[11px] text-muted-foreground">Admin Mode</span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Full Name
                      </label>
                      <Input
                        value={editForm.full_name}
                        onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                        placeholder="Learner name"
                        className="h-9 text-xs bg-card"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Email Address
                      </label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="email@example.com"
                        className="h-9 text-xs bg-card"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Mobile Number
                      </label>
                      <div className="flex items-center rounded-xl border border-input bg-card px-2.5 py-0.5 focus-within:ring-2 focus-within:ring-ring">
                        <span className="text-xs font-bold text-muted-foreground pr-1.5 border-r border-border">+91</span>
                        <Input
                          type="tel"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="Mobile number required"
                          className="border-0 shadow-none focus-visible:ring-0 h-8 text-xs bg-transparent placeholder:text-amber-500/70 placeholder:italic"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        System Role
                      </label>
                      <select
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                        className="w-full h-9 rounded-xl border border-input bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="student">Student (Standard learner)</option>
                        <option value="admin">Admin (Full administrative access)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                        Learning Goal
                      </label>
                      <Input
                        value={editForm.goal}
                        onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                        placeholder="e.g. Switch careers, Revit & BIM mastery..."
                        className="h-9 text-xs bg-card"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(false)}
                      className="text-xs h-8 cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={updateStudentMutation.isPending}
                      className="bg-gradient-primary text-primary-foreground font-semibold text-xs h-8 gap-1.5 cursor-pointer"
                    >
                      {updateStudentMutation.isPending ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-3.5 w-3.5" /> Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              ) : (
                /* VIEW DETAILS OVERVIEW */
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  <div className="rounded-2xl border border-border bg-muted/20 p-3.5 flex flex-col justify-center">
                    <span className="text-muted-foreground block font-medium text-[11px]">Email Address</span>
                    <span className="font-semibold text-foreground text-sm truncate block mt-0.5" title={selectedStudent.email}>
                      {selectedStudent.email || "N/A"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-3.5 flex flex-col justify-center">
                    <span className="text-muted-foreground block font-medium text-[11px]">Mobile Number</span>
                    <span
                      className={`text-sm block mt-0.5 truncate ${
                        selectedStudent.phone
                          ? "font-semibold text-foreground"
                          : "text-amber-600 dark:text-amber-400 font-medium italic text-xs"
                      }`}
                    >
                      {selectedStudent.phone ? `+91 ${selectedStudent.phone}` : "Mobile number required"}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-3.5 flex flex-col justify-center">
                    <span className="text-muted-foreground block font-medium text-[11px]">Completed Lessons</span>
                    <span className="font-semibold text-foreground text-sm block mt-0.5 flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      {(() => {
                        if (!selectedStudent?.enrollments) return 0;
                        let total = 0;
                        selectedStudent.enrollments.forEach((en: any) => {
                          const courseId = en.course?.id || en.course_id;
                          const courseSlug = en.course?.slug;
                          const courseDetail = fullCourses.find(
                            (c: any) => c.id === courseId || (c.slug && c.slug === courseSlug) || (c.title && c.title.toLowerCase() === en.course?.title?.toLowerCase())
                          ) || en.course;
                          const rawModules = courseDetail?.modules || [];
                          const allLessons = rawModules.flatMap((m: any) => m.lessons || m.lessons_safe || []);

                          const courseProg = [
                            ...(coursesProgressMap[courseId] || []),
                            ...(coursesProgressMap[courseSlug] || []),
                            ...(coursesProgressMap[courseDetail?.slug] || []),
                            ...(coursesProgressMap[courseDetail?.id] || []),
                            ...(coursesProgressMap["all"] || []),
                            ...studentProgressList,
                          ];

                          const doneCount = allLessons.filter((lesson: any) => {
                            const lId = String(lesson.id || "").trim();
                            const lTitle = String(lesson.title || "").trim().toLowerCase();

                            const prog = courseProg.find((p: any) => {
                              const pLessonId = String(p.lesson_id || p.lessonId || p.id || "").trim();
                              const pTitle = String(p.title || p.lesson_title || "").trim().toLowerCase();
                              return (pLessonId && pLessonId === lId) || (pTitle && pTitle === lTitle);
                            });

                            if (prog && (prog.completed === true || prog.completed === "true" || prog.completed === 1 || prog.status === "completed" || prog.is_completed === true)) return true;
                            if (Array.isArray(en?.completed_lessons) && en.completed_lessons.some((x: any) => String(x).trim() === lId)) return true;
                            if (Array.isArray(en?.completedLessons) && en.completedLessons.some((x: any) => String(x).trim() === lId)) return true;
                            return false;
                          }).length;

                          const dashboardItem = myCoursesProgress.find((mc: any) => mc.course_id === courseId || mc.slug === courseSlug || mc.title === courseDetail?.title);
                          const finalCount = doneCount > 0 ? doneCount : (dashboardItem?.progress_count || (typeof en.completed_count === "number" ? en.completed_count : typeof en.progress_count === "number" ? en.progress_count : 0));
                          total += finalCount;
                        });
                        return total;
                      })()} Total Completed
                    </span>
                  </div>

                  <div className="rounded-2xl border border-border bg-muted/20 p-3.5 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-muted-foreground block font-medium text-[11px]">System Role</span>
                      <span className="font-bold uppercase tracking-wider text-primary text-xs mt-0.5 block truncate">
                        {selectedStudent.role || "student"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7.5 px-2.5 shrink-0 cursor-pointer"
                      disabled={updateRoleMutation.isPending}
                      onClick={() => {
                        const newRole = selectedStudent.role === "admin" ? "student" : "admin";
                        confirmAction({
                          title: "Change User Role?",
                          description: `Are you sure you want to change the role of ${
                            selectedStudent.full_name || "this user"
                          } to ${newRole.toUpperCase()}?`,
                          confirmLabel: `Switch to ${newRole.toUpperCase()}`,
                          variant: "warning",
                          onConfirm: () => {
                            updateRoleMutation.mutate({ userId: selectedStudent.id, role: newRole });
                            setSelectedStudent({ ...selectedStudent, role: newRole });
                          },
                        });
                      }}
                    >
                      Switch to {selectedStudent.role === "admin" ? "Student" : "Admin"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Enrolled Courses Section with Completed Lessons Breakdown */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-display text-sm font-bold flex items-center gap-1.5 text-foreground">
                    <BookOpen className="h-4 w-4 text-primary" /> Active Course Enrollments &amp; Progress (
                    {selectedStudent.enrollments?.length || 0})
                  </h4>
                </div>

                {selectedStudent.enrollments?.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
                    This student is not enrolled in any courses yet.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {selectedStudent.enrollments.map((en: any) => {
                      const courseId = en.course?.id || en.course_id;
                      const courseSlug = en.course?.slug;
                      const courseDetail = fullCourses.find(
                        (c: any) => c.id === courseId || (c.slug && c.slug === courseSlug) || (c.title && c.title.toLowerCase() === en.course?.title?.toLowerCase())
                      ) || en.course;
                      
                      // Extract modules and lessons for this course
                      const rawModules = courseDetail?.modules || [];
                      const modules = [...rawModules].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                      const allLessons = modules.flatMap((m: any) =>
                        (m.lessons || m.lessons_safe || []).map((l: any) => ({
                          ...l,
                          moduleId: m.id,
                          moduleTitle: m.title,
                        }))
                      );

                      const dashboardItem = myCoursesProgress.find((mc: any) => mc.course_id === courseId || mc.slug === courseSlug || mc.title === courseDetail?.title);
                      const totalLessons = allLessons.length || en.total_lessons || courseDetail?.total_lessons || dashboardItem?.total_lessons || 0;

                      // Completed lessons for this course
                      const courseProg = [
                        ...(coursesProgressMap[courseId] || []),
                        ...(coursesProgressMap[courseSlug] || []),
                        ...(coursesProgressMap[courseDetail?.slug] || []),
                        ...(coursesProgressMap[courseDetail?.id] || []),
                        ...(coursesProgressMap["all"] || []),
                        ...studentProgressList,
                      ];

                      const completedLessons = allLessons.filter((lesson: any) => {
                        const lId = String(lesson.id || "").trim();
                        const lTitle = String(lesson.title || "").trim().toLowerCase();

                        const prog = courseProg.find((p: any) => {
                          const pLessonId = String(p.lesson_id || p.lessonId || p.id || "").trim();
                          const pTitle = String(p.title || p.lesson_title || "").trim().toLowerCase();
                          return (pLessonId && pLessonId === lId) || (pTitle && pTitle === lTitle);
                        });

                        if (prog) {
                          if (
                            prog.completed === true ||
                            prog.completed === "true" ||
                            prog.completed === 1 ||
                            prog.status === "completed" ||
                            prog.is_completed === true
                          ) {
                            return true;
                          }
                          if (Number(prog.progress_seconds) > 0 && Number(prog.duration) > 0) {
                            if (Number(prog.progress_seconds) >= Number(prog.duration) * 0.7) return true;
                          }
                        }

                        if (Array.isArray(en?.completed_lessons) && en.completed_lessons.some((x: any) => String(x).trim() === lId)) {
                          return true;
                        }
                        if (Array.isArray(en?.completedLessons) && en.completedLessons.some((x: any) => String(x).trim() === lId)) {
                          return true;
                        }
                        return false;
                      });

                      const completedCount = completedLessons.length > 0
                        ? completedLessons.length
                        : (dashboardItem?.progress_count || (typeof en.completed_count === "number" ? en.completed_count : typeof en.progress_count === "number" ? en.progress_count : 0));
                      const progressPct = totalLessons > 0 ? Math.min(100, Math.round((completedCount / totalLessons) * 100)) : 0;
                      const isExpanded = !!expandedCourseIds[courseId];

                      return (
                        <div
                          key={en.id}
                          className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3 transition hover:border-primary/30"
                        >
                          {/* Course Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-foreground truncate">
                                  {en.course?.title || courseDetail?.title || "Course"}
                                </span>
                                <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-bold text-success uppercase shrink-0">
                                  {en.status || "active"}
                                </span>
                              </div>
                              <span className="text-[11px] text-muted-foreground block mt-0.5">
                                Enrolled on {new Date(en.enrolled_at || en.created_at).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                disabled={revokeEnrollmentMutation.isPending}
                                className="h-7.5 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                                title="Revoke course access"
                                onClick={() => {
                                  confirmAction({
                                    title: "Revoke Course Access?",
                                    description: `Are you sure you want to remove access to "${
                                      en.course?.title || "this course"
                                    }" for ${
                                      selectedStudent.full_name || selectedStudent.email
                                    }? They will no longer be able to view course lessons.`,
                                    confirmLabel: "Revoke Access",
                                    variant: "destructive",
                                    onConfirm: () => {
                                      revokeEnrollmentMutation.mutate(
                                        {
                                          userId: selectedStudent.id,
                                          courseId: en.course?.id,
                                          enrollmentId: en.id,
                                        },
                                        {
                                          onSuccess: () => {
                                            setSelectedStudent({
                                              ...selectedStudent,
                                              coursesCount: Math.max(0, (selectedStudent.coursesCount || 1) - 1),
                                              enrollments: (selectedStudent.enrollments || []).filter(
                                                (item: any) => item.id !== en.id
                                              ),
                                            });
                                          },
                                        }
                                      );
                                    },
                                  });
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
                              </Button>
                            </div>
                          </div>

                          {/* Progress Bar & Completed Stats */}
                          <div className="rounded-xl bg-muted/30 p-3 space-y-2 border border-border/50">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold text-foreground flex items-center gap-1.5">
                                <CheckCircle2 className={`h-4 w-4 ${completedCount > 0 ? "text-emerald-500" : "text-muted-foreground"}`} />
                                {completedCount} of {totalLessons} Lessons Completed
                              </span>
                              <span className="font-bold text-primary font-mono">{progressPct}%</span>
                            </div>

                            <div className="h-2 w-full overflow-hidden rounded-full bg-border/70">
                              <div
                                className="h-full bg-gradient-primary rounded-full transition-all duration-500"
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Expandable Lesson-by-Lesson Breakdown */}
                          {allLessons.length > 0 && (
                            <div className="pt-1">
                              <button
                                onClick={() => toggleCourseExpand(courseId)}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3.5 w-3.5" /> Hide Completed Lessons
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3.5 w-3.5" /> View Completed Lessons ({completedCount}/{totalLessons})
                                  </>
                                )}
                              </button>

                              {isExpanded && (
                                <div className="mt-3 space-y-3 pt-3 border-t border-border/60">
                                  {modules.map((m: any, mIdx: number) => {
                                    const rawMLessons = m.lessons || m.lessons_safe || [];
                                    const mLessons = [...rawMLessons].sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                                    if (mLessons.length === 0) return null;

                                    const mDoneCount = mLessons.filter((l: any) => {
                                      const lId = String(l.id || "").trim();
                                      const lTitle = String(l.title || "").trim().toLowerCase();
                                      return completedLessons.some((cl: any) => {
                                        const clId = String(cl.id || "").trim();
                                        const clTitle = String(cl.title || "").trim().toLowerCase();
                                        return (clId && clId === lId) || (clTitle && clTitle === lTitle);
                                      });
                                    }).length;

                                    return (
                                      <div key={m.id || mIdx} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                            {m.title || `Module ${mIdx + 1}`}
                                          </span>
                                          <span className="text-[10px] text-muted-foreground font-medium">
                                            {mDoneCount}/{mLessons.length} completed
                                          </span>
                                        </div>

                                        <div className="space-y-1 rounded-xl bg-background border border-border/60 p-2">
                                          {mLessons.map((l: any, lIdx: number) => {
                                            const lId = String(l.id || "").trim();
                                            const lTitle = String(l.title || "").trim().toLowerCase();
                                            const isDone = completedLessons.some((cl: any) => {
                                              const clId = String(cl.id || "").trim();
                                              const clTitle = String(cl.title || "").trim().toLowerCase();
                                              return (clId && clId === lId) || (clTitle && clTitle === lTitle);
                                            });

                                            return (
                                              <div
                                                key={l.id || lIdx}
                                                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs transition ${
                                                  isDone ? "bg-emerald-500/10 text-foreground" : "text-muted-foreground hover:bg-muted/30"
                                                }`}
                                              >
                                                <div className="flex items-center gap-2 min-w-0">
                                                  {isDone ? (
                                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                                  ) : (
                                                    <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                                  )}
                                                  <span className={`truncate ${isDone ? "font-semibold text-foreground" : ""}`}>
                                                    {l.title}
                                                  </span>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                  {l.duration && (
                                                    <span className="text-[10px] text-muted-foreground font-mono">
                                                      {l.duration}
                                                    </span>
                                                  )}
                                                  {isDone ? (
                                                    <span className="rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                                      Completed
                                                    </span>
                                                  ) : (
                                                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium">
                                                      Not Started
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Grant Instant Course Access */}
                <div className="mt-3 pt-4 border-t border-border space-y-2">
                  <span className="text-xs font-semibold text-foreground block">Grant Instant Course Access</span>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <select
                      value={enrollCourseId}
                      onChange={(e) => setEnrollCourseId(e.target.value)}
                      className="flex-1 rounded-xl border border-input bg-surface px-3 py-2 text-xs shadow-soft outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select course to enroll...</option>
                      {courses.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.title} (₹{c.price})
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      disabled={!enrollCourseId || enrollStudentMutation.isPending}
                      onClick={() => {
                        if (!enrollCourseId) return;
                        enrollStudentMutation.mutate(
                          { userId: selectedStudent.id, courseId: enrollCourseId },
                          {
                            onSuccess: (newEnroll) => {
                              const courseObj = courses.find((c: any) => c.id === enrollCourseId);
                              setSelectedStudent({
                                ...selectedStudent,
                                coursesCount: (selectedStudent.coursesCount || 0) + 1,
                                enrollments: [
                                  ...(selectedStudent.enrollments || []),
                                  { ...newEnroll, course: courseObj },
                                ],
                              });
                              setEnrollCourseId("");
                            },
                          }
                        );
                      }}
                      className="bg-gradient-primary text-primary-foreground text-xs font-semibold h-9 shrink-0 cursor-pointer"
                    >
                      <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Enroll Student
                    </Button>
                  </div>
                </div>
              </div>

              {/* Danger Zone: Delete User */}
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-destructive flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5" /> Danger Zone
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Permanently delete this user account and revoke all enrollments.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteStudent(selectedStudent)}
                    disabled={deleteStudentMutation.isPending}
                    className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete User
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

