import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/lib/services/admin.service";
import { courseService } from "@/lib/services/course.service";
import type { Coupon, Course } from "@/lib/database.types";
import {
  Tag,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Edit2,
  Sparkles,
  Loader2,
  Copy,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/coupons")({
  head: () => ({ meta: [{ title: "Coupons & Discounts — Admin" }] }),
  component: AdminCouponsPage,
});

const couponFormSchema = z
  .object({
    code: z
      .string()
      .min(4, "Coupon code must be at least 4 characters")
      .max(20, "Coupon code must be at most 20 characters")
      .regex(/^[A-Za-z0-9_-]+$/, "Code must be alphanumeric (letters, numbers, hyphens, underscores)"),
    discountType: z.enum(["FLAT", "PERCENT"]),
    discountValue: z.coerce.number().min(1, "Discount value must be greater than 0"),
    maxDiscount: z.coerce
      .number()
      .nullable()
      .optional()
      .transform((val) => (val && val > 0 ? val : null)),
    courseId: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
    usageLimit: z.coerce
      .number()
      .nullable()
      .optional()
      .transform((val) => (val && val > 0 ? val : null)),
    perUserLimit: z.coerce.number().min(1, "Per user limit must be at least 1").default(1),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.discountType === "PERCENT") {
      if (data.discountValue > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Percentage discount cannot exceed 100%",
          path: ["discountValue"],
        });
      }
    }
  });

type CouponFormData = z.infer<typeof couponFormSchema>;

function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "FLAT" | "PERCENT">("ALL");
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE" | "EXPIRED">("ALL");

  // Modal dialog states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // 1. Fetch Coupons
  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      return adminService.getAllCoupons();
    },
  });

  // 2. Fetch Courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ["admin-courses-dropdown"],
    queryFn: async () => {
      return courseService.getCourses();
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (payload: any) => adminService.createCoupon(payload),
    onSuccess: (newCoupon) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(`Coupon ${newCoupon.code} created successfully`);
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create coupon");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      adminService.updateCoupon(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(`Coupon ${updated.code} updated successfully`);
      setEditingCoupon(null);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update coupon");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => adminService.toggleCoupon(id),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(`Coupon ${updated.code} is now ${updated.isActive ? "active" : "inactive"}`);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to toggle coupon status");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteCoupon(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success(res.message || "Coupon processed successfully");
      setDeletingCoupon(null);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to delete coupon");
    },
  });

  // React Hook Form
  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CouponFormData>({
    resolver: zodResolver(couponFormSchema),
    defaultValues: {
      code: "",
      discountType: "FLAT",
      discountValue: 400,
      maxDiscount: null,
      courseId: "",
      expiresAt: "",
      usageLimit: null,
      perUserLimit: 1,
      isActive: true,
    },
  });

  const watchDiscountType = watch("discountType");

  const resetForm = () => {
    reset({
      code: "",
      discountType: "FLAT",
      discountValue: 400,
      maxDiscount: null,
      courseId: "",
      expiresAt: "",
      usageLimit: null,
      perUserLimit: 1,
      isActive: true,
    });
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    reset({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount || null,
      courseId: coupon.courseId || "",
      expiresAt: coupon.expiresAt ? new Date(coupon.expiresAt).toISOString().split("T")[0] : "",
      usageLimit: coupon.usageLimit || null,
      perUserLimit: coupon.perUserLimit || 1,
      isActive: coupon.isActive,
    });
  };

  const generateRandomCode = () => {
    const prefixes = ["PROMO", "SAVE", "OFFER", "ARCH", "SPECIAL"];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setValue("code", `${prefix}${randomNum}`, { shouldValidate: true });
  };

  const onSubmit = (data: CouponFormData) => {
    const payload = {
      ...data,
      code: data.code.trim().toUpperCase(),
      courseId: data.courseId && data.courseId !== "ALL" && data.courseId !== "" ? data.courseId : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
      maxDiscount: data.discountType === "PERCENT" ? data.maxDiscount : null,
    };

    if (editingCoupon) {
      updateMutation.mutate({ id: editingCoupon.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    toast.success(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter & Search coupons
  const filteredCoupons = useMemo(() => {
    const now = new Date();
    return coupons.filter((coupon) => {
      const matchSearch =
        !search.trim() ||
        coupon.code.toLowerCase().includes(search.toLowerCase()) ||
        (coupon.course?.title || "").toLowerCase().includes(search.toLowerCase());

      const matchType = filterType === "ALL" || coupon.discountType === filterType;

      const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < now;
      let matchStatus = true;
      if (filterStatus === "ACTIVE") {
        matchStatus = coupon.isActive && !isExpired;
      } else if (filterStatus === "INACTIVE") {
        matchStatus = !coupon.isActive;
      } else if (filterStatus === "EXPIRED") {
        matchStatus = !!isExpired;
      }

      return matchSearch && matchType && matchStatus;
    });
  }, [coupons, search, filterType, filterStatus]);

  // Metric aggregates
  const totalCoupons = coupons.length;
  const activeCoupons = coupons.filter(
    (c) => c.isActive && (!c.expiresAt || new Date(c.expiresAt) >= new Date())
  ).length;
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
            Coupons & Discounts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create coupon codes, manage flat & percentage discounts, usage limits, and course rules.
          </p>
        </div>
        <Button
          onClick={handleOpenCreate}
          className="bg-gradient-primary text-primary-foreground font-bold shadow-soft hover:brightness-110 shrink-0"
        >
          <Plus className="mr-1.5 h-4 w-4" /> Create Coupon
        </Button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Coupons
            </span>
            <Tag className="h-4 w-4 text-primary" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{totalCoupons}</p>
          <p className="mt-1 text-xs text-muted-foreground">All time created coupons</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Active Coupons
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {activeCoupons}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Currently valid and redeemable</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Redemptions
            </span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{totalRedemptions}</p>
          <p className="mt-1 text-xs text-muted-foreground">Successful checkouts with coupon</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or course..."
            className="pl-9.5 h-10 rounded-xl bg-card text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex rounded-xl border border-border bg-card p-1 text-xs font-medium">
            {(["ALL", "ACTIVE", "INACTIVE", "EXPIRED"] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`rounded-lg px-2.5 py-1 transition-colors capitalize ${
                  filterStatus === st
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {st.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Type Filter */}
          <div className="flex rounded-xl border border-border bg-card p-1 text-xs font-medium">
            {(["ALL", "FLAT", "PERCENT"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`rounded-lg px-2.5 py-1 transition-colors ${
                  filterType === t
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "ALL" ? "All Types" : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Tag className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <h3 className="font-display text-base font-bold text-foreground">No coupons found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {search || filterStatus !== "ALL" || filterType !== "ALL"
                ? "Try adjusting your search terms or active filters."
                : "Create your first discount coupon to boost course enrollments."}
            </p>
            {!search && filterStatus === "ALL" && filterType === "ALL" && (
              <Button onClick={handleOpenCreate} size="sm" className="mt-4 bg-primary text-primary-foreground">
                <Plus className="mr-1 h-3.5 w-3.5" /> Create Coupon
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border/80 bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-5 py-3.5">Code</th>
                  <th className="px-5 py-3.5">Discount</th>
                  <th className="px-5 py-3.5">Course</th>
                  <th className="px-5 py-3.5">Used / Limit</th>
                  <th className="px-5 py-3.5">Per User</th>
                  <th className="px-5 py-3.5">Expiry</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCoupons.map((coupon) => {
                  const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
                  const isLimitReached =
                    coupon.usageLimit !== null &&
                    coupon.usageLimit !== undefined &&
                    coupon.usedCount >= coupon.usageLimit;

                  return (
                    <tr key={coupon.id} className="transition-colors hover:bg-muted/30">
                      {/* Code */}
                      <td className="px-5 py-4 font-mono font-bold">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs text-primary">
                            {coupon.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(coupon.code)}
                            title="Copy code"
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                          >
                            {copiedCode === coupon.code ? (
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Discount Value */}
                      <td className="px-5 py-4">
                        {coupon.discountType === "FLAT" ? (
                          <div className="font-semibold text-foreground">
                            ₹{coupon.discountValue.toLocaleString()} off
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-foreground">
                              {coupon.discountValue}% off
                            </span>
                            {coupon.maxDiscount && (
                              <span className="block text-[11px] text-muted-foreground">
                                capped at ₹{coupon.maxDiscount.toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Course */}
                      <td className="px-5 py-4">
                        {coupon.course ? (
                          <span className="line-clamp-1 max-w-[180px] font-medium text-foreground text-xs" title={coupon.course.title}>
                            {coupon.course.title}
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            All Courses
                          </span>
                        )}
                      </td>

                      {/* Used / Limit */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">
                            {coupon.usedCount}
                          </span>
                          <span className="text-muted-foreground">
                            / {coupon.usageLimit !== null && coupon.usageLimit !== undefined ? coupon.usageLimit : "∞"}
                          </span>
                          {isLimitReached && (
                            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
                              Full
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Per User */}
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {coupon.perUserLimit || 1} {coupon.perUserLimit === 1 ? "use/user" : "uses/user"}
                      </td>

                      {/* Expiry */}
                      <td className="px-5 py-4 text-xs">
                        {coupon.expiresAt ? (
                          <span className={isExpired ? "text-destructive font-semibold" : "text-muted-foreground"}>
                            {new Date(coupon.expiresAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                            {isExpired && " (Expired)"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(coupon.id)}
                          disabled={toggleMutation.isPending}
                          className="inline-flex items-center gap-2 text-xs font-semibold focus:outline-none"
                        >
                          <span
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                              coupon.isActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                coupon.isActive ? "translate-x-4" : "translate-x-0"
                              }`}
                            />
                          </span>
                          <span
                            className={
                              coupon.isActive && !isExpired
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground"
                            }
                          >
                            {coupon.isActive ? "Active" : "Off"}
                          </span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(coupon)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                            title="Edit coupon"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingCoupon(coupon)}
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                            title="Delete or deactivate coupon"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal Dialog */}
      {(isCreateOpen || !!editingCoupon) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border/70 pb-3">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Create New Coupon"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Define discount rules, target course, duration, and redemption limits.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingCoupon(null);
                  resetForm();
                }}
                className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Coupon Code + Auto-generate */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Coupon Code <span className="text-destructive">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
                  >
                    <Sparkles className="h-3 w-3" /> Auto-generate
                  </button>
                </div>
                <Input
                  id="coupon-code"
                  {...register("code")}
                  placeholder="e.g. LAUNCH50, WELCOME400"
                  className="h-10 rounded-xl font-mono uppercase text-sm"
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-destructive">{errors.code.message}</p>
                )}
              </div>

              {/* Discount Type & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Discount Type <span className="text-destructive">*</span>
                  </label>
                  <Controller
                    name="discountType"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-1 rounded-xl border border-border p-1 bg-muted/30">
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("FLAT");
                            if (watch("discountValue") <= 100) setValue("discountValue", 400);
                          }}
                          className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                            field.value === "FLAT"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          FLAT (₹ Off)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            field.onChange("PERCENT");
                            if (watch("discountValue") > 100) setValue("discountValue", 20);
                          }}
                          className={`rounded-lg py-1.5 text-xs font-semibold transition-all ${
                            field.value === "PERCENT"
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          PERCENT (%)
                        </button>
                      </div>
                    )}
                  />
                </div>

                <div>
                  <label htmlFor="coupon-discount-value" className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    {watchDiscountType === "FLAT" ? "Rupees Off (₹)" : "Percent Off (%)"}{" "}
                    <span className="text-destructive">*</span>
                  </label>
                  <Input
                    id="coupon-discount-value"
                    type="number"
                    {...register("discountValue")}
                    placeholder={watchDiscountType === "FLAT" ? "400" : "20"}
                    className="h-10 rounded-xl text-sm"
                    min={1}
                    max={watchDiscountType === "PERCENT" ? 100 : undefined}
                  />
                  {errors.discountValue && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.discountValue.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Max Discount (Only for PERCENT) */}
              {watchDiscountType === "PERCENT" && (
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Max Discount Cap in ₹ (Optional)
                  </label>
                  <Input
                    type="number"
                    {...register("maxDiscount")}
                    placeholder="e.g. 1000 (leave blank for no cap)"
                    className="h-10 rounded-xl text-sm"
                    min={1}
                  />
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Limits the maximum discount amount in rupees when percentage is applied.
                  </p>
                </div>
              )}

              {/* Course restriction dropdown */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                  Eligible Course (Optional)
                </label>
                <Controller
                  name="courseId"
                  control={control}
                  render={({ field }) => (
                    <select
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs sm:text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">All Courses (Global Coupon)</option>
                      {courses.map((c: Course) => (
                        <option key={c.id} value={c.id}>
                          {c.title} (₹{c.price.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  )}
                />
              </div>

              {/* Limits & Expiry */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Expiry Date (Optional)
                  </label>
                  <Input
                    type="date"
                    {...register("expiresAt")}
                    className="h-10 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Total Usage Limit
                  </label>
                  <Input
                    type="number"
                    {...register("usageLimit")}
                    placeholder="∞ Unlimited"
                    className="h-10 rounded-xl text-xs"
                    min={1}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
                    Per-User Limit
                  </label>
                  <Input
                    type="number"
                    {...register("perUserLimit")}
                    defaultValue={1}
                    className="h-10 rounded-xl text-xs"
                    min={1}
                  />
                </div>
              </div>

              {/* Active Status Switch */}
              <div className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/30 p-3">
                <div>
                  <span className="text-xs font-semibold text-foreground block">Active Status</span>
                  <span className="text-[11px] text-muted-foreground">
                    Active coupons can be redeemed immediately by students at checkout.
                  </span>
                </div>
                <Controller
                  name="isActive"
                  control={control}
                  render={({ field }) => (
                    <button
                      type="button"
                      onClick={() => field.onChange(!field.value)}
                      className="focus:outline-none"
                    >
                      <span
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          field.value ? "bg-emerald-500" : "bg-muted-foreground/30"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            field.value ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </span>
                    </button>
                  )}
                />
              </div>

              {/* Dialog Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setEditingCoupon(null);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-primary text-primary-foreground font-bold shadow-soft"
                >
                  {isSubmitting || createMutation.isPending || updateMutation.isPending ? (
                    <span className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </span>
                  ) : editingCoupon ? (
                    "Update Coupon"
                  ) : (
                    "Create Coupon"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete / Deactivate Confirmation Modal */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-destructive/15 text-destructive shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Delete or Deactivate Coupon?
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Are you sure you want to remove coupon <strong>{deletingCoupon.code}</strong>?
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  If this coupon has already been redeemed by students, it will be <strong>deactivated</strong> instead of deleted to preserve student transaction records.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDeletingCoupon(null)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => deleteMutation.mutate(deletingCoupon.id)}
                disabled={deleteMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending ? "Processing..." : "Confirm Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
