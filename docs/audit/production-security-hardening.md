# Production & Security Hardening Audit Report

**Date:** September 17, 2026  
**Project:** ArchitectureNext LMS  
**Status:** Complete & Verified  

---

## 1. Executive Summary
This document records the security, access-control, secrets management, and repository hardening changes performed across the ArchitectureNext codebase.

---

## 2. Changes Made

| File | Change Description |
|---|---|
| [`backend/src/controllers/media.controller.js`](file:///e:/willowy/skillspring-app/backend/src/controllers/media.controller.js) | **[NEW]** Created `MediaController` to authenticate and authorize video/document streams with full HTTP 206 Range headers and path traversal prevention. |
| [`backend/src/routes/media.routes.js`](file:///e:/willowy/skillspring-app/backend/src/routes/media.routes.js) | **[NEW]** Mounted authenticated media endpoints: `/api/v1/media/video/:filename` and `/api/v1/media/document/:filename`. |
| [`backend/src/routes/index.js`](file:///e:/willowy/skillspring-app/backend/src/routes/index.js) | Connected `mediaRoutes` into API v1 router. |
| [`backend/src/app.js`](file:///e:/willowy/skillspring-app/backend/src/app.js) | Restricted `express.static` to `uploads/images/` only; blocked direct unauthenticated static access to `uploads/videos/` and `uploads/documents/`. |
| [`backend/src/middlewares/auth.middleware.js`](file:///e:/willowy/skillspring-app/backend/src/middlewares/auth.middleware.js) | Supported token extraction from query parameter (`?token=...`) alongside `Authorization: Bearer` and cookies for HTML5 `<video>` and download stream compatibility. |
| [`backend/src/config/env.js`](file:///e:/willowy/skillspring-app/backend/src/config/env.js) | Removed fallback JWT secret string. Enforced fail-fast startup if `JWT_SECRET` is missing in environment variables. |
| [`backend/src/middlewares/error.middleware.js`](file:///e:/willowy/skillspring-app/backend/src/middlewares/error.middleware.js) | Added structured error logging with automatic redaction of sensitive keys (`password`, `token`, `jwt`, `secret`, `otp`, `razorpay_signature`) and production error masking. |
| [`backend/.env.example`](file:///e:/willowy/skillspring-app/backend/.env.example) | **[NEW]** Created environment variable template documenting active backend configuration. |
| [`.gitignore`](file:///e:/willowy/skillspring-app/.gitignore) | Updated root `.gitignore` to exclude `.playwright-mcp/`, `backend/node_modules/`, `backend/uploads/`, and `.env` files. |
| [`backend/.gitignore`](file:///e:/willowy/skillspring-app/backend/.gitignore) | **[NEW]** Created backend `.gitignore` ignoring uploads, dependencies, and environment files. |
| [`src/lib/utils.ts`](file:///e:/willowy/skillspring-app/src/lib/utils.ts) | Updated `getMediaUrl` to route lesson videos and documents through authenticated `/api/v1/media/` endpoints while maintaining public image paths. |
| [`src/routes/learn.$courseId.lazy.tsx`](file:///e:/willowy/skillspring-app/src/routes/learn.$courseId.lazy.tsx) | Updated Plyr video player and document download links to authenticate via session token. |

---

## 3. Files Deleted (Dead / Legacy Code)

| File | Reason for Removal |
|---|---|
| `src/lib/supabase.ts` | Dead legacy Supabase client containing hardcoded project URL and Anon JWT key. |
| `src/lib/api/fakePaymentCompat.ts` | Unused legacy payment mock referencing Supabase. |
| `src/components/pricing-course-card.tsx` | Unused duplicate component (`src/components/course-card.tsx` is the active component). |
| `backend/test-otp-flow.js` | One-off scratch test script. |

---

## 4. Media Security & Access Control

### Previous Vulnerability
`backend/src/app.js` exposed the entire `uploads/` directory directly via `app.use("/uploads", express.static(uploadDir))`. Anyone could inspect or guess video/document filenames and access private course content without authentication or enrollment.

### Hardened Implementation
1. **Direct Access Blocked:** Direct GET requests to `http://localhost:5000/uploads/videos/*` and `http://localhost:5000/uploads/documents/*` return `403 Forbidden`. Only public assets under `uploads/images/` remain statically served.
2. **Authenticated Media Gateway (`/api/v1/media/*`):**
   - Requires a valid JWT token via `Authorization: Bearer` or `?token=<jwt>`.
   - Resolves owning lesson in PostgreSQL via Prisma (`prisma.courseLesson`).
   - Grants access if:
     - The user is an **`ADMIN`**, OR
     - The lesson is marked as **`is_free`** (free preview), OR
     - The user has an **`ACTIVE`** enrollment for the owning course.
   - Non-enrolled users attempting to access paid media receive **`403 Forbidden`**.
3. **HTTP Range Streaming:** Full support for `206 Partial Content`, `Content-Range`, and `Accept-Ranges: bytes` headers allowing video timeline seeking in browser video players.
4. **Path Traversal Protection:** Filenames are sanitized with `path.basename` and resolved against strictly bounded directory roots.

---

## 5. Secrets Management

- **Hardcoded Secret Fallback Removed:** `backend/src/config/env.js` no longer contains a hardcoded fallback JWT secret string. If `JWT_SECRET` is missing during server boot, the application terminates immediately with a clear configuration error.
- **Legacy Supabase Credentials Removed:** `src/lib/supabase.ts` was deleted.
- **Credential Rotation Advisory:**
  > [!NOTE]
  > Because legacy Supabase project URL and anon keys existed in repository files historically, if the Supabase project `fiisbcdkppzjtcymmiov` is still active, its API keys should be rotated or the project paused in the Supabase console.

---

## 6. Verification Results

| Test Item | Verification Command / Scenario | Result |
|---|---|:---:|
| Direct static video access | `GET /uploads/videos/lesson-video.mp4` ➔ Expected `403` | **PASS** |
| Unauthenticated media API | `GET /api/v1/media/video/lesson-video.mp4` ➔ Expected `401` | **PASS** |
| Non-enrolled student access | `GET /api/v1/media/video/lesson-video.mp4` with student token ➔ Expected `403` | **PASS** |
| Admin video stream | `GET /api/v1/media/video/lesson-video.mp4` with `Range: bytes=0-1023` ➔ Expected `206` | **PASS** |
| Path traversal attempt | `GET /api/v1/media/video/..%2F..%2Fconfig%2Fenv.js` ➔ Expected `404` | **PASS** |
| Fail-fast missing JWT_SECRET | Boot without `JWT_SECRET` ➔ Expected immediate process exit with error | **PASS** |
| Frontend Production Build | `npm run build` | **PASS (1922 modules transformed, zero errors)** |

---

## 7. Remaining Risks & Manual Actions
- **Database Backups:** Ensure scheduled PostgreSQL database backups are enabled in production.
- **External CDN (Future Scaling):** When scaling beyond a single server instance, consider streaming private videos via presigned S3/Cloudflare R2 URLs.
