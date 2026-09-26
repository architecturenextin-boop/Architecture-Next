/* SkillSpring / ArchitectureNext Secure Offline Video Service Worker */
/* Encrypted In-Memory Chunk Decryption via Web Crypto & IndexedDB */

const CACHE_NAME = "skillspring-pwa-v1";
const DB_NAME = "skillspring_offline_vault_v1";
const DB_VERSION = 1;

// Helper to open IndexedDB inside Service Worker
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function getFromStore(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Derive AES-GCM Key in Service Worker context
async function deriveWorkerKey(userId) {
  const enc = new TextEncoder();
  const rawKeyMaterial = enc.encode(`skillspring-offline-key-${userId}-vault`);

  const baseKey = await crypto.subtle.importKey(
    "raw",
    rawKeyMaterial,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const salt = enc.encode(`salt-${userId}-architecturenext-lms`);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Intercept offline stream requests: /offline-stream/:lessonId/:file
  if (url.pathname.startsWith("/offline-stream/")) {
    event.respondWith(handleOfflineStreamRequest(url.pathname));
    return;
  }
});

async function handleOfflineStreamRequest(pathname) {
  try {
    const parts = pathname.replace("/offline-stream/", "").split("/");
    const lessonId = parts[0];
    const fileName = decodeURIComponent(parts.slice(1).join("/"));

    if (!lessonId || !fileName) {
      return new Response("Invalid offline stream URL", { status: 400 });
    }

    const db = await openOfflineDB();

    // 1. Verify 7-day license validity
    const license = await getFromStore(db, "licenses", lessonId);
    if (!license) {
      return new Response("Lesson is not available offline or has not been downloaded.", { status: 404 });
    }

    if (Date.now() > license.expiresAt) {
      return new Response("Offline license expired. Please reconnect online to verify your active enrollment.", { status: 403 });
    }

    // 2. Playlist request (.m3u8)
    if (fileName.endsWith(".m3u8")) {
      const playlistRec = await getFromStore(db, "playlists", `${lessonId}:${fileName}`);
      if (!playlistRec || !playlistRec.content) {
        return new Response("Playlist not found in offline vault.", { status: 404 });
      }

      return new Response(playlistRec.content, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.apple.mpegurl",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // 3. Segment request (.ts)
    if (fileName.endsWith(".ts")) {
      const segmentRec = await getFromStore(db, "segments", `${lessonId}:${fileName}`);
      if (!segmentRec || !segmentRec.encryptedData) {
        return new Response(`Segment ${fileName} not found in offline vault.`, { status: 404 });
      }

      // Decrypt chunk in memory using AES-GCM
      const cryptoKey = await deriveWorkerKey(license.userId);
      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: segmentRec.iv },
        cryptoKey,
        segmentRec.encryptedData
      );

      // Return decrypted segment stream directly to MSE / Video Element
      // No unencrypted data is ever written to disk.
      return new Response(decryptedBuffer, {
        status: 200,
        headers: {
          "Content-Type": "video/MP2T",
          "Content-Length": String(decryptedBuffer.byteLength),
          "Cache-Control": "no-store",
          "Accept-Ranges": "bytes",
        },
      });
    }

    return new Response("Unsupported offline file format", { status: 400 });
  } catch (err) {
    console.error("[SW] Offline stream decryption error:", err);
    return new Response(`Offline streaming decryption failed: ${err.message}`, { status: 500 });
  }
}
