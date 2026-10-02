/**
 * SkillSpring LMS - Offline Download & License Manager
 * 
 * Supports both HLS (.m3u8 + .ts) adaptive streams and direct MP4 videos.
 * Encrypts downloaded segments in IndexedDB using WebCrypto AES-GCM.
 */

import { tokenStorage, getApiConfig } from "../api-client";
import { courseService } from "../services/course.service";

const DB_NAME = "skillspring_offline_db";
const DB_VERSION = 1;

export interface OfflineLessonRecord {
  id: string; // lessonId
  courseId: string;
  courseTitle: string;
  title: string;
  duration: string;
  quality: string;
  sizeBytes: number;
  totalSegments: number;
  downloadedSegments: number;
  progressPercent: number;
  status: "downloading" | "paused" | "completed" | "error";
  errorMessage?: string;
  downloadedAt: string;
  expiresAt: string;
}

export interface StorageEstimateInfo {
  usageBytes: number;
  quotaBytes: number;
  usageFormatted: string;
  quotaFormatted: string;
  percentUsed: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return reject(new Error("IndexedDB is not supported on this browser."));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e: any) => {
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

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

class DownloadManager {
  private activeDownloads: Map<string, AbortController> = new Map();
  private progressListeners: Set<(lessons: OfflineLessonRecord[]) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.registerServiceWorker();
      window.addEventListener("online", () => {
        this.syncOfflineProgress();
        this.revalidateLicenses();
      });
    }
  }

  public subscribe(listener: (lessons: OfflineLessonRecord[]) => void): () => void {
    this.progressListeners.add(listener);
    this.getAllDownloadedLessons().then((lessons) => listener(lessons));
    return () => this.progressListeners.delete(listener);
  }

  private notify() {
    this.getAllDownloadedLessons().then((lessons) => {
      this.progressListeners.forEach((fn) => fn(lessons));
    });
  }

  public async registerServiceWorker() {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch (err) {
        console.warn("[SW] Registration failed:", err);
      }
    }
  }

  public async getStorageUsage(): Promise<StorageEstimateInfo> {
    if (typeof navigator !== "undefined" && navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      const usageBytes = estimate.usage || 0;
      const quotaBytes = estimate.quota || 0;
      return {
        usageBytes,
        quotaBytes,
        usageFormatted: formatBytes(usageBytes),
        quotaFormatted: formatBytes(quotaBytes),
        percentUsed: quotaBytes ? Math.round((usageBytes / quotaBytes) * 100) : 0,
      };
    }
    return {
      usageBytes: 0,
      quotaBytes: 0,
      usageFormatted: "0 MB",
      quotaFormatted: "Unknown",
      percentUsed: 0,
    };
  }

  public async getAllDownloadedLessons(): Promise<OfflineLessonRecord[]> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction("lessons", "readonly");
        const store = tx.objectStore("lessons");
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch (_) {
      return [];
    }
  }

  public async getDownloadedLesson(lessonId: string): Promise<OfflineLessonRecord | null> {
    try {
      const db = await openDB();
      return new Promise((resolve) => {
        const tx = db.transaction("lessons", "readonly");
        const store = tx.objectStore("lessons");
        const req = store.get(lessonId);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
      });
    } catch (_) {
      return null;
    }
  }

  public async isLessonDownloaded(lessonId: string): Promise<boolean> {
    const lessons = await this.getAllDownloadedLessons();
    const found = lessons.find((l) => l.id === lessonId);
    return found?.status === "completed";
  }

  public async getOfflineVideoUrl(lessonId: string): Promise<string | null> {
    try {
      const db = await openDB();
      const licenseTx = db.transaction("licenses", "readonly");
      const license = await new Promise<any>((res) => {
        const req = licenseTx.objectStore("licenses").get(lessonId);
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
      });

      if (!license) return null;

      // Check if saved as direct MP4 file
      const segTx = db.transaction("segments", "readonly");
      const mp4Segment = await new Promise<any>((res) => {
        const req = segTx.objectStore("segments").get(`${lessonId}_full.mp4`);
        req.onsuccess = () => res(req.result);
        req.onerror = () => res(null);
      });

      if (mp4Segment && mp4Segment.encryptedData) {
        const binaryKey = atob(license.rawKey);
        const keyBytes = new Uint8Array(binaryKey.length);
        for (let i = 0; i < binaryKey.length; i++) keyBytes[i] = binaryKey.charCodeAt(i);
        const cryptoKey = await crypto.subtle.importKey(
          "raw",
          keyBytes,
          { name: "AES-GCM", length: 256 },
          false,
          ["decrypt"]
        );

        const decrypted = await crypto.subtle.decrypt(
          { name: "AES-GCM", iv: new Uint8Array(mp4Segment.iv) },
          cryptoKey,
          mp4Segment.encryptedData
        );

        const blob = new Blob([decrypted], { type: "video/mp4" });
        return URL.createObjectURL(blob);
      }
      return null;
    } catch (e) {
      console.warn("Could not construct offline blob url:", e);
      return null;
    }
  }

  public async downloadLesson(params: {
    lessonId: string;
    courseId: string;
    courseTitle: string;
    lessonTitle: string;
    duration: string;
    masterUrl: string;
    preferredQuality?: string;
  }) {
    const { lessonId, courseId, courseTitle, lessonTitle, duration, masterUrl, preferredQuality = "720p" } = params;

    // Disallow external YouTube embeds from offline caching
    if (masterUrl.includes("youtube.com") || masterUrl.includes("youtu.be")) {
      const db = await openDB();
      const rec: OfflineLessonRecord = {
        id: lessonId,
        courseId,
        courseTitle,
        title: lessonTitle,
        duration,
        quality: "YouTube",
        sizeBytes: 0,
        totalSegments: 0,
        downloadedSegments: 0,
        progressPercent: 0,
        status: "error",
        errorMessage: "YouTube streams cannot be downloaded offline. Direct video uploads only.",
        downloadedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
      };
      const tx = db.transaction("lessons", "readwrite");
      tx.objectStore("lessons").put(rec);
      this.notify();
      return;
    }

    const db = await openDB();
    const abortController = new AbortController();
    this.activeDownloads.set(lessonId, abortController);

    let lessonRecord: OfflineLessonRecord = {
      id: lessonId,
      courseId,
      courseTitle,
      title: lessonTitle,
      duration,
      quality: preferredQuality,
      sizeBytes: 0,
      totalSegments: 1,
      downloadedSegments: 0,
      progressPercent: 0,
      status: "downloading",
      downloadedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };

    const saveRecord = async (rec: OfflineLessonRecord) => {
      const tx = db.transaction("lessons", "readwrite");
      tx.objectStore("lessons").put(rec);
      this.notify();
    };

    await saveRecord(lessonRecord);

    try {
      // 1. Obtain License (Try backend API, or generate client WebCrypto key fallback)
      let base64Key = "";
      let key_id = "local_" + crypto.randomUUID();
      let expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      try {
        const token = tokenStorage.get();
        const { url: licenseApiUrl } = getApiConfig(`/media/offline-license/${lessonId}`);
        const licenseRes = await fetch(licenseApiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: abortController.signal,
        });

        if (licenseRes.ok) {
          const licenseData = await licenseRes.json();
          if (licenseData?.data?.key) {
            base64Key = licenseData.data.key;
            key_id = licenseData.data.key_id || key_id;
            expires_at = licenseData.data.expires_at || expires_at;
          }
        }
      } catch (_) {
        // Fallback to local secure AES-256 key
      }

      if (!base64Key) {
        const randomKeyBytes = crypto.getRandomValues(new Uint8Array(32));
        let binary = "";
        for (let i = 0; i < randomKeyBytes.byteLength; i++) {
          binary += String.fromCharCode(randomKeyBytes[i]);
        }
        base64Key = btoa(binary);
      }

      // Store license in IndexedDB
      const licTx = db.transaction("licenses", "readwrite");
      licTx.objectStore("licenses").put({
        lessonId,
        keyId: key_id,
        rawKey: base64Key,
        expiresAt: expires_at,
        revoked: false,
      });

      // Import WebCrypto Key
      const binaryKey = atob(base64Key);
      const keyBytes = new Uint8Array(binaryKey.length);
      for (let i = 0; i < binaryKey.length; i++) keyBytes[i] = binaryKey.charCodeAt(i);
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM", length: 256 },
        false,
        ["encrypt", "decrypt"]
      );

      const isHlsStream = masterUrl.includes(".m3u8") || masterUrl.includes("/hls/");

      if (!isHlsStream) {
        // --- SCENARIO A: DIRECT MP4 / VIDEO DOWNLOAD ---
        lessonRecord.totalSegments = 1;
        await saveRecord(lessonRecord);

        const response = await fetch(masterUrl, { signal: abortController.signal });
        if (!response.ok) throw new Error(`HTTP Error ${response.status} fetching video file.`);

        const contentLength = +(response.headers.get("Content-Length") || 0);
        const reader = response.body?.getReader();
        let receivedBytes = 0;
        const chunks: Uint8Array[] = [];

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            receivedBytes += value.length;

            if (contentLength > 0) {
              lessonRecord.progressPercent = Math.min(95, Math.round((receivedBytes / contentLength) * 100));
              lessonRecord.sizeBytes = receivedBytes;
              await saveRecord(lessonRecord);
            }
          }
        } else {
          const directBuffer = await response.arrayBuffer();
          chunks.push(new Uint8Array(directBuffer));
          receivedBytes = directBuffer.byteLength;
        }

        const totalBuffer = new Uint8Array(receivedBytes);
        let offset = 0;
        for (const chunk of chunks) {
          totalBuffer.set(chunk, offset);
          offset += chunk.length;
        }

        // Encrypt with AES-GCM
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          cryptoKey,
          totalBuffer
        );

        // Store in IndexedDB segments store
        const segTx = db.transaction("segments", "readwrite");
        segTx.objectStore("segments").put({
          id: `${lessonId}_full.mp4`,
          encryptedData,
          iv: Array.from(iv),
        });

        lessonRecord.downloadedSegments = 1;
        lessonRecord.sizeBytes = receivedBytes;
        lessonRecord.progressPercent = 100;
        lessonRecord.status = "completed";
        await saveRecord(lessonRecord);
        this.activeDownloads.delete(lessonId);
        return;
      }

      // --- SCENARIO B: HLS STREAM DOWNLOAD (.m3u8 + .ts) ---
      const masterRes = await fetch(masterUrl, { signal: abortController.signal });
      if (!masterRes.ok) throw new Error("Could not fetch master playlist.");
      const masterText = await masterRes.text();

      // Resolve variant playlist name (e.g. 720p.m3u8 or fallback to first)
      const lines = masterText.split("\n");
      let selectedVariant = "720p.m3u8";
      const variantLines = lines.filter((l) => l.trim().endsWith(".m3u8"));
      if (variantLines.length > 0) {
        const matched = variantLines.find((l) => l.includes(preferredQuality));
        selectedVariant = matched ? matched.trim() : variantLines[0].trim();
      }

      // Store Master Playlist in IndexedDB
      const playTx = db.transaction("playlists", "readwrite");
      playTx.objectStore("playlists").put({
        id: `${lessonId}_master.m3u8`,
        content: masterText,
      });

      // Fetch Variant Playlist
      const baseUrl = masterUrl.substring(0, masterUrl.lastIndexOf("/") + 1);
      const variantUrl = masterUrl.includes("?") 
        ? `${baseUrl}${selectedVariant}?${masterUrl.split("?")[1]}`
        : `${baseUrl}${selectedVariant}`;

      const variantRes = await fetch(variantUrl, { signal: abortController.signal });
      if (!variantRes.ok) throw new Error("Could not fetch variant playlist.");
      const variantText = await variantRes.text();

      const playTx2 = db.transaction("playlists", "readwrite");
      playTx2.objectStore("playlists").put({
        id: `${lessonId}_${selectedVariant}`,
        content: variantText,
      });

      // Parse all .ts chunk filenames
      const segmentFiles = variantText
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith("#") && l.endsWith(".ts"));

      if (segmentFiles.length === 0) {
        throw new Error("No video fragments found in playlist.");
      }

      lessonRecord.totalSegments = segmentFiles.length;
      lessonRecord.expiresAt = expires_at;
      await saveRecord(lessonRecord);

      let totalBytesAccum = 0;

      // Download and Encrypt Segments
      for (let i = 0; i < segmentFiles.length; i++) {
        if (abortController.signal.aborted) throw new Error("Download aborted");

        const segFile = segmentFiles[i];
        const segUrl = masterUrl.includes("?")
          ? `${baseUrl}${segFile}?${masterUrl.split("?")[1]}`
          : `${baseUrl}${segFile}`;

        const chunkRes = await fetch(segUrl, { signal: abortController.signal });
        if (!chunkRes.ok) throw new Error(`Failed downloading segment ${segFile}`);

        const chunkBuffer = await chunkRes.arrayBuffer();
        totalBytesAccum += chunkBuffer.byteLength;

        // AES-GCM 12-byte IV encryption
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          cryptoKey,
          chunkBuffer
        );

        // Save segment to IndexedDB
        const segTx = db.transaction("segments", "readwrite");
        segTx.objectStore("segments").put({
          id: `${lessonId}_${segFile}`,
          encryptedData,
          iv: Array.from(iv),
        });

        lessonRecord.downloadedSegments = i + 1;
        lessonRecord.sizeBytes = totalBytesAccum;
        lessonRecord.progressPercent = Math.round(((i + 1) / segmentFiles.length) * 100);
        await saveRecord(lessonRecord);
      }

      lessonRecord.status = "completed";
      lessonRecord.progressPercent = 100;
      await saveRecord(lessonRecord);
      this.activeDownloads.delete(lessonId);

      // Audit Log Download Complete (Optional)
      const token = tokenStorage.get();
      const { url: auditUrl } = getApiConfig("/media/download-audit");
      fetch(auditUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ lesson_id: lessonId, action: "DOWNLOAD_COMPLETE" }),
      }).catch(() => {});
    } catch (err: any) {
      if (err.name === "AbortError" || abortController.signal.aborted) {
        lessonRecord.status = "paused";
        await saveRecord(lessonRecord);
        return;
      }

      console.error("[Download Manager Error]", err);
      lessonRecord.status = "error";
      lessonRecord.errorMessage = err.name === "QuotaExceededError"
        ? "Storage quota exceeded. Please free up browser storage."
        : (err.message || "Download failed.");
      await saveRecord(lessonRecord);
      this.activeDownloads.delete(lessonId);
    }
  }

  public cancelDownload(lessonId: string) {
    const controller = this.activeDownloads.get(lessonId);
    if (controller) {
      controller.abort();
      this.activeDownloads.delete(lessonId);
    }
  }

  public async deleteDownloadedLesson(lessonId: string) {
    this.cancelDownload(lessonId);
    try {
      const db = await openDB();
      const tx = db.transaction(["lessons", "playlists", "segments", "licenses", "offline_progress"], "readwrite");
      
      tx.objectStore("lessons").delete(lessonId);
      tx.objectStore("licenses").delete(lessonId);
      tx.objectStore("offline_progress").delete(lessonId);

      // Delete all segments and playlists for this lesson
      const segStore = tx.objectStore("segments");
      const segReq = segStore.getAllKeys();
      segReq.onsuccess = () => {
        const keys = segReq.result as string[];
        keys.filter((k) => k.startsWith(`${lessonId}_`)).forEach((k) => segStore.delete(k));
      };

      const playStore = tx.objectStore("playlists");
      const playReq = playStore.getAllKeys();
      playReq.onsuccess = () => {
        const keys = playReq.result as string[];
        keys.filter((k) => k.startsWith(`${lessonId}_`)).forEach((k) => playStore.delete(k));
      };

      this.notify();

      const token = tokenStorage.get();
      const { url: auditUrl } = getApiConfig("/media/download-audit");
      fetch(auditUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ lesson_id: lessonId, action: "DOWNLOAD_DELETE" }),
      }).catch(() => {});
    } catch (err) {
      console.error("Failed deleting offline lesson:", err);
    }
  }

  public async recordOfflineProgress(lessonId: string, lastPosition: number) {
    try {
      const db = await openDB();
      const tx = db.transaction("offline_progress", "readwrite");
      const store = tx.objectStore("offline_progress");
      const existingReq = store.get(lessonId);
      existingReq.onsuccess = () => {
        const existing = existingReq.result;
        const furthestPos = existing ? Math.max(existing.lastPosition, lastPosition) : lastPosition;
        store.put({
          lessonId,
          lastPosition: furthestPos,
          updatedAt: new Date().toISOString(),
        });
      };
    } catch (_) {}
  }

  public async syncOfflineProgress() {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    try {
      const db = await openDB();
      const tx = db.transaction("offline_progress", "readwrite");
      const store = tx.objectStore("offline_progress");
      const req = store.getAll();
      req.onsuccess = async () => {
        const records = req.result || [];
        for (const r of records) {
          try {
            await courseService.saveLessonProgress(null, r.lessonId, {
              last_position: r.lastPosition,
              lastPosition: r.lastPosition,
              progress_seconds: Math.floor(r.lastPosition),
            });
            const delTx = db.transaction("offline_progress", "readwrite");
            delTx.objectStore("offline_progress").delete(r.lessonId);
          } catch (_) {}
        }
      };
    } catch (_) {}
  }

  public async revalidateLicenses() {
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    try {
      const db = await openDB();
      const tx = db.transaction("licenses", "readonly");
      const store = tx.objectStore("licenses");
      const req = store.getAll();
      req.onsuccess = async () => {
        const licenses = req.result || [];
        if (licenses.length === 0) return;

        const token = tokenStorage.get();
        const { url } = getApiConfig("/media/offline-revalidate");
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            licenses: licenses.map((l: any) => ({
              lesson_id: l.lessonId,
              key_id: l.keyId,
            })),
          }),
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json();
          const { revoked = [], expired = [] } = data.data || {};
          for (const invalidLessonId of [...revoked, ...expired]) {
            await this.deleteDownloadedLesson(invalidLessonId);
          }
        }
      };
    } catch (_) {}
  }
}

export const downloadManager = new DownloadManager();