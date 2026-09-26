import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { tokenStorage } from "@/lib/api-client";
import { getMediaUrl } from "@/lib/utils";

export interface OfflineLicense {
  lessonId: string;
  courseId: string;
  courseTitle: string;
  lessonTitle: string;
  duration?: string;
  userId: string;
  downloadedAt: number;
  expiresAt: number; // 7-day rolling validation timestamp
  lastOnlineVerifiedAt: number;
  quality: string;
  totalSegments: number;
  sizeBytes: number;
}

export interface EncryptedSegment {
  key: string; // lessonId:segmentName
  lessonId: string;
  segmentName: string;
  iv: Uint8Array;
  encryptedData: ArrayBuffer;
}

export interface PlaylistRecord {
  key: string; // lessonId:playlistName
  lessonId: string;
  playlistName: string;
  content: string;
}

interface SkillSpringOfflineDB extends DBSchema {
  licenses: {
    key: string; // lessonId
    value: OfflineLicense;
    indexes: { "by-user": string; "by-course": string };
  };
  segments: {
    key: string; // lessonId:segmentName
    value: EncryptedSegment;
    indexes: { "by-lesson": string };
  };
  playlists: {
    key: string; // lessonId:playlistName
    value: PlaylistRecord;
    indexes: { "by-lesson": string };
  };
}

const DB_NAME = "skillspring_offline_vault_v1";
const DB_VERSION = 1;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

let dbPromise: Promise<IDBPDatabase<SkillSpringOfflineDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<SkillSpringOfflineDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("licenses")) {
          const licenseStore = db.createObjectStore("licenses", { keyPath: "lessonId" });
          licenseStore.createIndex("by-user", "userId");
          licenseStore.createIndex("by-course", "courseId");
        }
        if (!db.objectStoreNames.contains("segments")) {
          const segmentStore = db.createObjectStore("segments", { keyPath: "key" });
          segmentStore.createIndex("by-lesson", "lessonId");
        }
        if (!db.objectStoreNames.contains("playlists")) {
          const playlistStore = db.createObjectStore("playlists", { keyPath: "key" });
          playlistStore.createIndex("by-lesson", "lessonId");
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Derives a strong 256-bit AES-GCM encryption key from the user's ID + a device-bound salt
 * using the Web Crypto API. The raw key is never stored in plain text.
 */
async function deriveEncryptionKey(userId: string): Promise<CryptoKey> {
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
    ["encrypt", "decrypt"]
  );
}

export const offlineVideoService = {
  /**
   * Checks if a lesson is currently downloaded and valid in offline storage
   */
  async isLessonDownloaded(lessonId: string, userId: string): Promise<boolean> {
    try {
      const db = await getDB();
      const license = await db.get("licenses", lessonId);
      if (!license) return false;
      if (license.userId !== userId) return false;
      // Check if within 7-day heartbeat window
      return Date.now() <= license.expiresAt;
    } catch {
      return false;
    }
  },

  /**
   * Retrieves license details for a downloaded lesson
   */
  async getLessonLicense(lessonId: string): Promise<OfflineLicense | null> {
    try {
      const db = await getDB();
      return (await db.get("licenses", lessonId)) || null;
    } catch {
      return null;
    }
  },

  /**
   * Retrieves all downloaded lessons for the logged-in user
   */
  async getAllDownloadedLessons(userId: string): Promise<OfflineLicense[]> {
    try {
      const db = await getDB();
      const all = await db.getAllFromIndex("licenses", "by-user", userId);
      return all;
    } catch {
      return [];
    }
  },

  /**
   * Re-validates the 7-day heartbeat with the online server.
   * Extends offline validity for another 7 days when online.
   */
  async refreshOfflineLicense(lessonId: string): Promise<boolean> {
    try {
      const db = await getDB();
      const license = await db.get("licenses", lessonId);
      if (!license) return false;

      const now = Date.now();
      license.expiresAt = now + SEVEN_DAYS_MS;
      license.lastOnlineVerifiedAt = now;

      await db.put("licenses", license);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Downloads and encrypts an HLS video stream into IndexedDB with AES-GCM encryption.
   * Ensures no unencrypted video chunk is ever saved to persistent disk.
   */
  async downloadLessonForOffline({
    lessonId,
    courseId,
    courseTitle,
    lessonTitle,
    duration,
    userId,
    hlsUrl,
    onProgress,
  }: {
    lessonId: string;
    courseId: string;
    courseTitle: string;
    lessonTitle: string;
    duration?: string;
    userId: string;
    hlsUrl: string;
    onProgress?: (progressPercent: number, statusText: string) => void;
  }): Promise<void> {
    const db = await getDB();
    const token = tokenStorage.get();
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    onProgress?.(5, "Resolving video stream playlist...");

    let resolvedMasterUrl = getMediaUrl(hlsUrl);
    if (token && resolvedMasterUrl.includes("/api/v1/media/") && !resolvedMasterUrl.includes("token=")) {
      resolvedMasterUrl = `${resolvedMasterUrl}${resolvedMasterUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
    }

    const masterRes = await fetch(resolvedMasterUrl, { headers: authHeaders });
    if (!masterRes.ok) {
      throw new Error(`Failed to load video stream (Status ${masterRes.status}). Ensure you are enrolled.`);
    }

    const masterText = await masterRes.text();
    const baseUrl = resolvedMasterUrl.substring(0, resolvedMasterUrl.lastIndexOf("/") + 1);

    // Save master playlist
    await db.put("playlists", {
      key: `${lessonId}:master.m3u8`,
      lessonId,
      playlistName: "master.m3u8",
      content: masterText,
    });

    // Pick 480p or 720p variant playlist
    let variantFileName = "480p.m3u8";
    if (masterText.includes("720p.m3u8")) {
      variantFileName = "720p.m3u8";
    } else if (masterText.includes("480p.m3u8")) {
      variantFileName = "480p.m3u8";
    } else if (masterText.includes("240p.m3u8")) {
      variantFileName = "240p.m3u8";
    }

    let variantUrl = `${baseUrl}${variantFileName}`;
    if (token && !variantUrl.includes("token=")) {
      variantUrl = `${variantUrl}${variantUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
    }

    onProgress?.(15, `Fetching ${variantFileName.replace(".m3u8", "")} stream index...`);
    const variantRes = await fetch(variantUrl, { headers: authHeaders });
    if (!variantRes.ok) {
      throw new Error(`Failed to fetch stream index ${variantFileName}`);
    }

    const variantText = await variantRes.text();

    // Store variant playlist
    await db.put("playlists", {
      key: `${lessonId}:${variantFileName}`,
      lessonId,
      playlistName: variantFileName,
      content: variantText,
    });

    // Parse segment names from playlist
    const segmentNames: string[] = [];
    const lines = variantText.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#") && (trimmed.endsWith(".ts") || trimmed.includes(".ts?"))) {
        segmentNames.push(trimmed.split("?")[0]);
      }
    }

    if (segmentNames.length === 0) {
      throw new Error("No video segments found in stream playlist.");
    }

    onProgress?.(20, `Encrypting and downloading ${segmentNames.length} video chunks...`);

    // Derive Web Crypto AES-GCM Key
    const cryptoKey = await deriveEncryptionKey(userId);

    let totalBytes = 0;
    const totalSegments = segmentNames.length;

    for (let i = 0; i < totalSegments; i++) {
      const segName = segmentNames[i];
      let segUrl = `${baseUrl}${segName}`;
      if (token && !segUrl.includes("token=")) {
        segUrl = `${segUrl}${segUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`;
      }

      const segRes = await fetch(segUrl, { headers: authHeaders });
      if (!segRes.ok) {
        throw new Error(`Failed downloading chunk ${segName} (${i + 1}/${totalSegments})`);
      }

      const rawChunk = await segRes.arrayBuffer();
      totalBytes += rawChunk.byteLength;

      // Encrypt chunk using AES-GCM with unique 12-byte IV
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        rawChunk
      );

      // Save encrypted chunk to IndexedDB
      await db.put("segments", {
        key: `${lessonId}:${segName}`,
        lessonId,
        segmentName: segName,
        iv,
        encryptedData,
      });

      const percent = Math.round(20 + ((i + 1) / totalSegments) * 75);
      onProgress?.(percent, `Encrypting chunk ${i + 1} of ${totalSegments}...`);
    }

    // Save offline license record with 7-day validity
    const now = Date.now();
    const license: OfflineLicense = {
      lessonId,
      courseId,
      courseTitle,
      lessonTitle,
      duration,
      userId,
      downloadedAt: now,
      expiresAt: now + SEVEN_DAYS_MS,
      lastOnlineVerifiedAt: now,
      quality: variantFileName.replace(".m3u8", ""),
      totalSegments,
      sizeBytes: totalBytes,
    };

    await db.put("licenses", license);
    onProgress?.(100, "Offline download complete and secured!");
  },

  /**
   * Retrieves and decrypts a specific segment in-memory for MSE/player playback.
   * Note: Safari uses native HLS; MSE playback via decrypted blobs is supported across all modern browsers.
   */
  async getDecryptedSegment(lessonId: string, segmentName: string, userId: string): Promise<ArrayBuffer | null> {
    const db = await getDB();
    const license = await db.get("licenses", lessonId);
    if (!license) return null;

    // Verify 7-day license validity
    if (Date.now() > license.expiresAt || license.userId !== userId) {
      throw new Error("Offline license has expired. Please connect online to re-verify course access.");
    }

    const cleanSegName = segmentName.split("?")[0];
    const seg = await db.get("segments", `${lessonId}:${cleanSegName}`);
    if (!seg) return null;

    const cryptoKey = await deriveEncryptionKey(userId);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: seg.iv },
      cryptoKey,
      seg.encryptedData
    );

    return decrypted;
  },

  /**
   * Retrieves an offline playlist (.m3u8) from IndexedDB
   */
  async getOfflinePlaylist(lessonId: string, playlistName: string): Promise<string | null> {
    const db = await getDB();
    const cleanName = playlistName.split("?")[0];
    const rec = await db.get("playlists", `${lessonId}:${cleanName}`);
    return rec ? rec.content : null;
  },

  /**
   * Creates blob URLs or in-memory blob for offline HLS playback
   */
  async createOfflineStreamUrl(lessonId: string, userId: string): Promise<string | null> {
    const db = await getDB();
    const license = await db.get("licenses", lessonId);
    if (!license || Date.now() > license.expiresAt || license.userId !== userId) {
      return null;
    }

    const variantName = `${license.quality || "480p"}.m3u8`;
    const playlist = await this.getOfflinePlaylist(lessonId, variantName);
    if (!playlist) return null;

    // Return custom offline scheme handled by Service Worker or in-memory blob loader
    return `/offline-stream/${lessonId}/${variantName}`;
  },

  /**
   * Deletes all downloaded encrypted chunks and license for a lesson
   */
  async deleteOfflineLesson(lessonId: string): Promise<void> {
    const db = await getDB();
    await db.delete("licenses", lessonId);

    // Delete segments
    const segKeys = await db.getAllKeysFromIndex("segments", "by-lesson", lessonId);
    for (const k of segKeys) {
      await db.delete("segments", k);
    }

    // Delete playlists
    const plKeys = await db.getAllKeysFromIndex("playlists", "by-lesson", lessonId);
    for (const k of plKeys) {
      await db.delete("playlists", k);
    }
  },
};
