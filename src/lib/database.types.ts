export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          full_name: string | null
          username: string | null
          email: string | null
          phone: string | null
          goal: string | null
          role: 'admin' | 'student'
          is_verified: boolean
          onboarded: boolean
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          username?: string | null
          email?: string | null
          phone?: string | null
          goal?: string | null
          role?: 'admin' | 'student'
          is_verified?: boolean
          onboarded?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          full_name?: string | null
          username?: string | null
          email?: string | null
          phone?: string | null
          goal?: string | null
          role?: 'admin' | 'student'
          onboarded?: boolean
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedSource: "auth"
          }
        ]
      }
      courses: {
        Row: {
          id: string
          slug: string
          title: string
          tagline: string | null
          description: string | null
          cover_url: string | null
          thumbnail_url: string | null
          price: number
          original_price: number
          currency: string
          total_duration: string | null
          total_lessons: number
          level: string | null
          language: string | null
          rating: number | null
          review_count: number
          preview_video_url: string | null
          what_you_will_learn: string[]
          tools_covered: string[]
          highlights: string[]
          requirements: string[]
          target_audience: string[]
          published: boolean
          status: 'draft' | 'published' | 'archived'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          slug: string
          title: string
          tagline?: string | null
          description?: string | null
          cover_url?: string | null
          thumbnail_url?: string | null
          price?: number
          original_price?: number
          currency?: string
          total_duration?: string | null
          total_lessons?: number
          level?: string | null
          language?: string | null
          rating?: number | null
          review_count?: number
          preview_video_url?: string | null
          what_you_will_learn?: string[]
          tools_covered?: string[]
          highlights?: string[]
          requirements?: string[]
          target_audience?: string[]
          published?: boolean
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          tagline?: string | null
          description?: string | null
          cover_url?: string | null
          thumbnail_url?: string | null
          price?: number
          original_price?: number
          currency?: string
          total_duration?: string | null
          total_lessons?: number
          level?: string | null
          language?: string | null
          rating?: number | null
          review_count?: number
          preview_video_url?: string | null
          what_you_will_learn?: string[]
          tools_covered?: string[]
          highlights?: string[]
          requirements?: string[]
          target_audience?: string[]
          published?: boolean
          status?: 'draft' | 'published' | 'archived'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          id: string
          course_id: string
          title: string
          description: string | null
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          course_id: string
          title: string
          description?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          title?: string
          description?: string | null
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedSource: "public"
          }
        ]
      }
      course_lessons: {
        Row: {
          id: string
          module_id: string
          title: string
          description: string | null
          duration: string | null
          video_url: string | null
          video_path: string | null
          pdf_url: string | null
          pdf_path: string | null
          is_free: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          module_id: string
          title: string
          description?: string | null
          duration?: string | null
          video_url?: string | null
          video_path?: string | null
          pdf_url?: string | null
          pdf_path?: string | null
          is_free?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          module_id?: string
          title?: string
          description?: string | null
          duration?: string | null
          video_url?: string | null
          video_path?: string | null
          pdf_url?: string | null
          pdf_path?: string | null
          is_free?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "course_modules"
            referencedSource: "public"
          }
        ]
      }
      payments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          amount: number
          currency: string
          gateway: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          status: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          amount?: number
          currency?: string
          gateway?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          amount?: number
          currency?: string
          gateway?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          status?: 'pending' | 'completed' | 'failed' | 'refunded'
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedSource: "public"
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedSource: "auth"
          }
        ]
      }
      enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          payment_id: string | null
          status: 'active' | 'expired' | 'cancelled'
          enrolled_at: string
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          payment_id?: string | null
          status?: 'active' | 'expired' | 'cancelled'
          enrolled_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          payment_id?: string | null
          status?: 'active' | 'expired' | 'cancelled'
          enrolled_at?: string
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedSource: "public"
          },
          {
            foreignKeyName: "enrollments_payment_id_fkey"
            columns: ["payment_id"]
            referencedRelation: "payments"
            referencedSource: "public"
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedSource: "auth"
          }
        ]
      }
      lesson_progress: {
        Row: {
          id: string
          user_id: string
          course_id: string
          lesson_id: string
          progress_seconds: number
          completed: boolean
          last_watched_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          lesson_id: string
          progress_seconds?: number
          completed?: boolean
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          lesson_id?: string
          progress_seconds?: number
          completed?: boolean
          last_watched_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            referencedRelation: "courses"
            referencedSource: "public"
          },
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            referencedRelation: "course_lessons"
            referencedSource: "public"
          },
          {
            foreignKeyName: "lesson_progress_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedSource: "auth"
          }
        ]
      }
    }
    Views: {
      lessons_safe: {
        Row: {
          id: string | null
          module_id: string | null
          title: string | null
          description: string | null
          duration: string | null
          sort_order: number | null
          is_free: boolean | null
          created_at: string | null
          updated_at: string | null
          video_path: string | null
          video_url: string | null
          pdf_url: string | null
          pdf_path: string | null
        }
        Insert: {
          id?: string | null
          module_id?: string | null
          title?: string | null
          description?: string | null
          duration?: string | null
          sort_order?: number | null
          is_free?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          video_path?: string | null
          video_url?: string | null
          pdf_url?: string | null
          pdf_path?: string | null
        }
        Update: {
          id?: string | null
          module_id?: string | null
          title?: string | null
          description?: string | null
          duration?: string | null
          sort_order?: number | null
          is_free?: boolean | null
          created_at?: string | null
          updated_at?: string | null
          video_path?: string | null
          video_url?: string | null
          pdf_url?: string | null
          pdf_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_lessons_module_id_fkey"
            columns: ["module_id"]
            referencedRelation: "course_modules"
            referencedSource: "public"
          }
        ]
      }
    }
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      my_courses_with_progress: {
        Args: Record<PropertyKey, never>
        Returns: {
          course_id: string
          slug: string
          title: string
          tagline: string
          cover_url: string
          total_lessons: number
          total_duration: string
          level: string
          currency: string
          price: number
          progress_count: number
          last_watched_lesson_id: string | null
          last_watched_lesson_title: string | null
        }[]
      }
      upsert_course_with_content: {
        Args: {
          p_course: Json
          p_modules: Json
        }
        Returns: string
      }
    }
  }
}

// Convenience Type Aliases
export type Course = Database['public']['Tables']['courses']['Row']
export type Module = Database['public']['Tables']['course_modules']['Row']
export type Lesson = Database['public']['Tables']['course_lessons']['Row']
export type LessonSafe = Database['public']['Views']['lessons_safe']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Payment = Database['public']['Tables']['payments']['Row'] & {
  original_amount?: number | null
  originalAmount?: number | null
  discount_amount?: number
  discountAmount?: number
  final_amount?: number | null
  finalAmount?: number | null
  coupon_id?: string | null
  couponId?: string | null
  coupon_code?: string | null
  couponCode?: string | null
}
export type Enrollment = Database['public']['Tables']['enrollments']['Row']
export type Progress = Database['public']['Tables']['lesson_progress']['Row']

export type DiscountType = 'FLAT' | 'PERCENT'

export interface Coupon {
  id: string
  code: string
  discountType: DiscountType
  discountValue: number
  maxDiscount?: number | null
  courseId?: string | null
  expiresAt?: string | null
  usageLimit?: number | null
  perUserLimit: number
  usedCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  course?: {
    id: string
    title: string
    slug: string
  } | null
  _count?: {
    redemptions: number
  }
}

export interface CouponRedemption {
  id: string
  couponId: string
  userId: string
  paymentId?: string | null
  orderId?: string | null
  discountAmount: number
  createdAt: string
}

// Compound relationships used in the app
export type CourseWithContent = Course & {
  modules: (Module & {
    lessons_safe: LessonSafe[]
  })[]
}

export type TestimonialStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface PublicTestimonial {
  id: string
  name: string
  role: string
  quote: string
  rating: number
  course: string | null
  courseSlug: string | null
  avatarUrl?: string | null
  createdAt: string
}

export interface StudentTestimonial {
  id: string
  quote: string
  rating: number
  status: TestimonialStatus
  adminNote?: string | null
  courseId?: string | null
  courseTitle?: string | null
  courseSlug?: string | null
  createdAt: string
  approvedAt?: string | null
  rejectedAt?: string | null
}

export interface AdminTestimonialItem {
  id: string
  quote: string
  rating: number
  status: TestimonialStatus
  adminNote?: string | null
  createdAt: string
  approvedAt?: string | null
  rejectedAt?: string | null
  user: {
    id: string
    name: string
    email: string
    avatarUrl?: string | null
  }
  course: {
    id: string
    title: string
    slug: string
  } | null
}

export interface AdminTestimonialsResponse {
  items: AdminTestimonialItem[]
  counts: {
    all: number
    pending: number
    approved: number
    rejected: number
  }
}


