/**
 * ArchitectureNext / SkillSpring Service Worker
 * 
 * 1. App Shell & Static Asset Caching (Zero-Dinosaur Offline Navigation)
 * 2. API Course/Lesson metadata caching for offline learning
 * 3. Transparent AES-GCM Encrypted Video/HLS Interception & Stream Decryption
 */

const CACHE_VERSION = "architecturenext-v2";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const STATIC_ASSETS_CACHE = `static-assets-${CACHE_VERSION}`;
const API_CACHE = `api-data-${CACHE_VERSION}`;

const DB_NAME = "skillspring_offline_db";
const DB_VERSION = 1;

// Core shell routes to pre-cache on install
const PRECACHE_URLS = [
  "/",
  "/index.html",
  "/dashboard",
  "/downloads",
  "/styles.css",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      try {
        await cache.addAll(PRECACHE_URLS);
      } catch (err) {
        console.warn("[SW] Pre-caching partial failure (ok during initial boot):", err);
      }
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter((k) => !k.includes(CACHE_VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// Helper: Open IndexedDB in Service Worker
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("lessons")) {
        db.createObjectStore("lessons", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("playlists")) {
        db.createObjectStore("playlists", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("segments")) {
        db.createObjectStore("segments", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("licenses")) {
        db.createObjectStore("licenses", { keyPath: "lessonId" });
      }
      if (!db.objectStoreNames.contains("offline_progress")) {
        db.createObjectStore("offline_progress", { keyPath: "lessonId" });
      }
    };
  });
}

function getFromStore(db, storeName, key) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(storeName, "readonly");
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    } catch (_) {
      resolve(null);
    }
  });
}

// Convert Base64 key to WebCrypto CryptoKey
async function importRawKey(base64Key) {
  const binary = atob(base64Key);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return await crypto.subtle.importKey(
    "raw",
    bytes,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // NEVER intercept non-GET requests (uploads, PUT, POST, DELETE, etc.)
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  // NEVER intercept admin API endpoints, uploads, or direct Cloudflare R2 uploads
  if (
    url.pathname.includes("/admin/") ||
    url.pathname.includes("/upload") ||
    url.pathname.includes("/presigned") ||
    url.hostname.includes("r2.cloudflarestorage.com")
  ) {
    return;
  }

  // 1. VIDEO & HLS OFFLINE INTERCEPTION (GET only)
  const isVideoOrStream =
    url.pathname.endsWith(".m3u8") ||
    url.pathname.endsWith(".ts") ||
    url.pathname.endsWith(".mp4") ||
    url.pathname.includes("/hls/") ||
    url.pathname.includes("/media/");

  if (isVideoOrStream) {
    event.respondWith(handleOfflineMedia(event, url));
    return;
  }

  // 2. SPA PAGE NAVIGATION (e.g. /learn/:courseId, /dashboard, /downloads)
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(APP_SHELL_CACHE);
            cache.put(request, networkResponse.clone());
            cache.put("/index.html", networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Offline fallback to cached HTML shell
          const cached = await caches.match(request);
          if (cached) return cached;
          const indexFallback = await caches.match("/index.html");
          if (indexFallback) return indexFallback;
          const rootFallback = await caches.match("/");
          if (rootFallback) return rootFallback;
          return new Response("Offline - Please reconnect to the internet.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        }
      })()
    );
    return;
  }

  // 3. STATIC ASSETS (JS, CSS, FONTS, IMAGES) - Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith("/assets/") ||
    url.pathname.endsWith(".js") ||
    url.pathname.endsWith(".css") ||
    url.pathname.endsWith(".png") ||
    url.pathname.endsWith(".jpg") ||
    url.pathname.endsWith(".jpeg") ||
    url.pathname.endsWith(".webp") ||
    url.pathname.endsWith(".svg") ||
    url.pathname.endsWith(".woff2") ||
    url.hostname.includes("fonts.googleapis.com") ||
    url.hostname.includes("fonts.gstatic.com") ||
    url.hostname.includes("unpkg.com");

  if (isStaticAsset && request.method === "GET") {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const fetchPromise = fetch(request)
          .then(async (networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const cache = await caches.open(STATIC_ASSETS_CACHE);
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => null);

        return cached || (await fetchPromise) || new Response("", { status: 404 });
      })()
    );
    return;
  }

  // 4. API GET REQUESTS (Courses, Profile, Progress) - Network-first with cache fallback
  if (url.pathname.startsWith("/api/v1/") && request.method === "GET") {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (_) {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: "Offline - cached data not available." }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }
      })()
    );
    return;
  }
});

// Video / HLS Stream decryptor and server
async function handleOfflineMedia(event, url) {
  const pathParts = url.pathname.split("/").filter(Boolean);
  let lessonId = "";
  let fileName = "";

  const hlsIdx = pathParts.findIndex((p) => p === "hls");
  if (hlsIdx !== -1 && pathParts[hlsIdx + 1]) {
    lessonId = pathParts[hlsIdx + 1];
    fileName = pathParts.slice(hlsIdx + 2).join("/") || "master.m3u8";
  } else if (pathParts.length >= 2) {
    lessonId = pathParts[pathParts.length - 2];
    fileName = pathParts[pathParts.length - 1];
  }

  // If query has lessonId param
  if (!lessonId && url.searchParams.get("lessonId")) {
    lessonId = url.searchParams.get("lessonId");
  }

  try {
    const db = await openDatabase();

    // 1. Direct MP4 check
    if (lessonId) {
      const mp4Record = await getFromStore(db, "segments", `${lessonId}_full.mp4`);
      if (mp4Record && mp4Record.encryptedData) {
        const license = await getFromStore(db, "licenses", lessonId);
        if (license && !license.revoked) {
          const key = await importRawKey(license.rawKey);
          const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(mp4Record.iv) },
            key,
            mp4Record.encryptedData
          );

          return new Response(decryptedBuffer, {
            status: 200,
            headers: {
              "Content-Type": "video/mp4",
              "Accept-Ranges": "bytes",
              "Content-Length": decryptedBuffer.byteLength.toString(),
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-SkillSpring-Offline": "true",
            },
          });
        }
      }
    }

    // 2. HLS Playlist check (.m3u8)
    if (fileName.endsWith(".m3u8") && lessonId) {
      const playlistId = `${lessonId}_${fileName}`;
      let playlistRecord = await getFromStore(db, "playlists", playlistId);
      if (!playlistRecord && fileName === "master.m3u8") {
        playlistRecord = await getFromStore(db, "playlists", `${lessonId}_master.m3u8`);
      }

      if (playlistRecord && playlistRecord.content) {
        return new Response(playlistRecord.content, {
          status: 200,
          headers: {
            "Content-Type": "application/vnd.apple.mpegurl; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-SkillSpring-Offline": "true",
          },
        });
      }
    }

    // 3. HLS Segment check (.ts)
    if (fileName.endsWith(".ts") && lessonId) {
      const segmentId = `${lessonId}_${fileName}`;
      const segmentRecord = await getFromStore(db, "segments", segmentId);

      if (segmentRecord && segmentRecord.encryptedData) {
        const license = await getFromStore(db, "licenses", lessonId);
        if (license && !license.revoked) {
          const key = await importRawKey(license.rawKey);
          const decryptedBuffer = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv: new Uint8Array(segmentRecord.iv) },
            key,
            segmentRecord.encryptedData
          );

          return new Response(decryptedBuffer, {
            status: 200,
            headers: {
              "Content-Type": "video/mp2t",
              "Accept-Ranges": "bytes",
              "Content-Length": decryptedBuffer.byteLength.toString(),
              "Cache-Control": "public, max-age=31536000, immutable",
              "X-SkillSpring-Offline": "true",
            },
          });
        }
      }
    }
  } catch (err) {
    console.warn("[SW Offline Media Error]", err);
  }

  // Network fetch fallback with graceful offline catch
  try {
    return await fetch(event.request);
  } catch (_) {
    return new Response("Media stream unreachable offline.", {
      status: 503,
      statusText: "Service Unavailable",
      headers: { "Content-Type": "text/plain" },
    });
  }
}