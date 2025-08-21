// IndexedDB utility for storing large video files
const DB_NAME = "TennisCoachDB";
const DB_VERSION = 1;
const VIDEO_STORE = "videos";

interface VideoData {
  id: string;
  file: File;
  type: string;
  name: string;
  size: number;
  timestamp: number;
}

class IndexedDBVideoStorage {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains(VIDEO_STORE)) {
          const store = db.createObjectStore(VIDEO_STORE, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
        }
      };
    });
  }

  async storeVideo(videoId: string, videoFile: File): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB not initialized");
    }

    const videoData: VideoData = {
      id: videoId,
      file: videoFile,
      type: videoFile.type,
      name: videoFile.name,
      size: videoFile.size,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], "readwrite");
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.put(videoData);

      request.onerror = () => {
        reject(new Error("Failed to store video in IndexedDB"));
      };

      request.onsuccess = () => {
        console.log(
          `Video stored successfully in IndexedDB with ID: ${videoId}`
        );
        resolve();
      };
    });
  }

  async getVideo(videoId: string): Promise<VideoData | null> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], "readonly");
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.get(videoId);

      request.onerror = () => {
        reject(new Error("Failed to retrieve video from IndexedDB"));
      };

      request.onsuccess = () => {
        resolve(request.result || null);
      };
    });
  }

  async deleteVideo(videoId: string): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB not initialized");
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], "readwrite");
      const store = transaction.objectStore(VIDEO_STORE);
      const request = store.delete(videoId);

      request.onerror = () => {
        reject(new Error("Failed to delete video from IndexedDB"));
      };

      request.onsuccess = () => {
        console.log(`Video deleted from IndexedDB: ${videoId}`);
        resolve();
      };
    });
  }

  async createVideoUrl(videoId: string): Promise<string | null> {
    try {
      const videoData = await this.getVideo(videoId);
      if (videoData) {
        return URL.createObjectURL(videoData.file);
      }
      return null;
    } catch (error) {
      console.error("Failed to create video URL from IndexedDB:", error);
      return null;
    }
  }

  async cleanupOldVideos(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.init();

    if (!this.db) {
      throw new Error("IndexedDB not initialized");
    }

    const cutoffTime = Date.now() - maxAge;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([VIDEO_STORE], "readwrite");
      const store = transaction.objectStore(VIDEO_STORE);
      const index = store.index("timestamp");
      const request = index.openCursor(IDBKeyRange.upperBound(cutoffTime));

      request.onerror = () => {
        reject(new Error("Failed to cleanup old videos"));
      };

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log("Cleanup of old videos completed");
          resolve();
        }
      };
    });
  }
}

// Create singleton instance
export const videoStorage = new IndexedDBVideoStorage();

// Utility functions for easy use
export const storeVideo = (videoId: string, videoFile: File) =>
  videoStorage.storeVideo(videoId, videoFile);

export const getVideo = (videoId: string) => videoStorage.getVideo(videoId);

export const createVideoUrl = (videoId: string) =>
  videoStorage.createVideoUrl(videoId);

export const deleteVideo = (videoId: string) =>
  videoStorage.deleteVideo(videoId);

export const cleanupOldVideos = () => videoStorage.cleanupOldVideos();
