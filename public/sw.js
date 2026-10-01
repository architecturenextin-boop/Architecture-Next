/**
 * ArchitectureNext Service Worker (PWA Offline HLS Decryption & Playback)
 * Transparently intercepts .m3u8 and .ts requests and serves decrypted segments from IndexedDB.
 */

const DB_NAME = "skillspring_offline_db";
const DB_VERSION = 1;

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
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

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const isHls = url.pathname.endsWith(".m3u8") || url.pathname.endsWith(".ts") || url.pathname.includes("/hls/");

  if (!isHls) {
    return; // Pass through non-video requests
  }

  // Extract lesson ID and file name
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

  if (!lessonId || !fileName) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const db = await openDatabase();

        // 1. Check if playlist exists in local storage
        if (fileName.endsWith(".m3u8")) {
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

        // 2. Check if .ts segment exists in local storage
        if (fileName.endsWith(".ts")) {
          const segmentId = `${lessonId}_${fileName}`;
          const segmentRecord = await getFromStore(db, "segments", segmentId);

          if (segmentRecord && segmentRecord.encryptedData) {
            // Check license validity
            const license = await getFromStore(db, "licenses", lessonId);
            if (!license) {
              return new Response(
                JSON.stringify({ error: "No offline license found for this lesson." }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }

            if (license.revoked) {
              return new Response(
                JSON.stringify({ error: "Offline license has been revoked. Please reconnect online." }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }

            if (license.expiresAt && new Date(license.expiresAt) < new Date()) {
              return new Response(
                JSON.stringify({ error: "Offline playback license expired. Please reconnect to revalidate." }),
                { status: 403, headers: { "Content-Type": "application/json" } }
              );
            }

            // Decrypt segment with AES-GCM
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
      } catch (err) {
        console.warn("[SW Offline Intercept Error]", err);
      }

      // Fallback: network fetch with graceful offline/network failure catch
      try {
        return await fetch(event.request);
      } catch (networkErr) {
        return new Response("Media stream unreachable. Check internet connection or stream server status.", {
          status: 503,
          statusText: "Service Unavailable",
          headers: { "Content-Type": "text/plain" },
        });
      }
    })()
  );
});