import { createFileRoute } from "@tanstack/react-router";
import { Search, Loader2, Users, BookOpen, ShieldCheck, GraduationCap, Phone, Mail, Calendar, Eye, X, PlusCircle, CheckCircle2, UserMinus, Trash2 } from "lucide-react";
import { useState, useMemo } from "react";
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
  const [enrollCourseId, setEnrollCourseId] = useState("");
  const queryClient = useQueryClient();

  // 1. Query all profiles from Backend REST API
  const { data: students = [], isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      return adminService.getAllStudents();
    },
  });

  // 2. Fetch all courses for manual enrollment dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ["admin-all-courses-list"],
    queryFn: async () => {
      const all = await adminService.getAllCourses();
      return all.map((c) => ({ id: c.id, title: c.title, price: c.price }));
    },
  });

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
          <h1 className="font-display text-3xl font-bold">Students & Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage all registered learners, active course enrollments, and user roles from the database.
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
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              roleFilter === "all" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All Users ({students.length})
          </button>
          <button
            onClick={() => setRoleFilter("student")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              roleFilter === "student" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Students ({students.filter((s: any) => s.role !== "admin").length})
          </button>
          <button
            onClick={() => setRoleFilter("admin")}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
              roleFilter === "admin" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
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

                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      r.role === "admin" 
                        ? "bg-purple-500/15 text-purple-600 border border-purple-500/20" 
                        : "bg-emerald-500/15 text-emerald-600"
                    }`}>
                      {r.role || "student"}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground border-y border-border/60 py-2.5">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{r.email || "No email"}</span>
                    </div>
                    {r.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>+91 {r.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1">
                      <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        coursesCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                      }`}>
                        <BookOpen className="h-3 w-3" /> {coursesCount} {coursesCount === 1 ? "Course" : "Courses"}
                      </span>
                      <span className="text-[11px]">Joined {date}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedStudent(r)}
                    className="w-full min-h-[40px] text-xs font-semibold gap-1.5"
                  >
                    <Eye className="h-4 w-4" /> Manage Student Details
                  </Button>
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
                    <th className="px-5 py-3.5 text-right">Action</th>
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
                            {r.phone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <span>+91 {r.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Courses Count */}
                        <td className="px-5 py-3.5">
                          <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-bold ${
                            coursesCount > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                          }`}>
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
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                            r.role === "admin" 
                              ? "bg-purple-500/15 text-purple-600 border border-purple-500/20" 
                              : "bg-emerald-500/15 text-emerald-600"
                          }`}>
                            {r.role || "student"}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedStudent(r)}
                            className="h-8 text-xs font-semibold gap-1"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </Button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card p-6 shadow-glow max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary font-display text-lg font-bold text-primary-foreground">
                  {(selectedStudent.full_name || selectedStudent.email || "L")[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    {selectedStudent.full_name || "Learner Details"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">
                    User ID: {selectedStudent.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Profile Overview */}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-xs">
              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block font-medium">Email Address</span>
                <span className="font-semibold text-foreground text-sm">{selectedStudent.email || "N/A"}</span>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block font-medium">Mobile Number</span>
                <span className="font-semibold text-foreground text-sm">
                  {selectedStudent.phone ? `+91 ${selectedStudent.phone}` : "Not provided"}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-3">
                <span className="text-muted-foreground block font-medium">Learning Goal</span>
                <span className="font-semibold text-foreground">
                  {selectedStudent.goal || "Architecture & BIM Mastery"}
                </span>
              </div>

              <div className="rounded-xl border border-border bg-muted/20 p-3 flex items-center justify-between">
                <div>
                  <span className="text-muted-foreground block font-medium">System Role</span>
                  <span className="font-bold uppercase tracking-wider text-primary text-xs">
                    {selectedStudent.role || "student"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 cursor-pointer"
                  disabled={updateRoleMutation.isPending}
                  onClick={() => {
                    const newRole = selectedStudent.role === "admin" ? "student" : "admin";
                    confirmAction({
                      title: "Change User Role?",
                      description: `Are you sure you want to change the role of ${selectedStudent.full_name || "this user"} to ${newRole.toUpperCase()}?`,
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

            {/* Enrolled Courses Section */}
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-display text-sm font-bold flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-primary" /> Active Course Enrollments ({selectedStudent.enrollments?.length || 0})
                </h4>
              </div>

              {selectedStudent.enrollments?.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  This student is not enrolled in any courses yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {selectedStudent.enrollments.map((en: any) => (
                    <div key={en.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 shadow-xs">
                      <div className="flex-1 pr-2">
                        <span className="font-semibold text-xs text-foreground block line-clamp-1">
                          {en.course?.title || "Course"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          Enrolled on {new Date(en.enrolled_at || en.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-bold text-success uppercase">
                          {en.status}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={revokeEnrollmentMutation.isPending}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          title="Revoke course access"
                          onClick={() => {
                            confirmAction({
                              title: "Revoke Course Access?",
                              description: `Are you sure you want to remove access to "${en.course?.title || "this course"}" for ${selectedStudent.full_name || selectedStudent.email}? They will no longer be able to view course lessons.`,
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
                  ))}
                </div>
              )}

              {/* Grant Course Access */}
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <span className="text-xs font-semibold text-foreground block">Grant Instant Course Access</span>
                <div className="flex gap-2">
                  <select
                    value={enrollCourseId}
                    onChange={(e) => setEnrollCourseId(e.target.value)}
                    className="flex-1 rounded-xl border border-input bg-surface px-3 py-2 text-xs shadow-soft outline-none"
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
                          },
                        }
                      );
                    }}
                    className="bg-gradient-primary text-primary-foreground text-xs font-semibold h-9"
                  >
                    <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Enroll Student
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
