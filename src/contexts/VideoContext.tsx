"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface VideoData {
  id: string;
  file: File;
  url: string;
  metadata: {
    name: string;
    size: number;
    type: string;
    timestamp: number;
  };
}

interface VideoContextType {
  videoData: VideoData | null;
  setVideoData: (data: VideoData | null) => void;
  createVideoUrl: (file: File, id: string) => string;
  clearVideo: () => void;
}

const VideoContext = createContext<VideoContextType | undefined>(undefined);

export function VideoProvider({ children }: { children: ReactNode }) {
  const [videoData, setVideoDataState] = useState<VideoData | null>(null);

  const setVideoData = (data: VideoData | null) => {
    // Clean up previous video URL if it exists
    if (videoData?.url) {
      URL.revokeObjectURL(videoData.url);
    }
    setVideoDataState(data);
  };

  const createVideoUrl = (file: File, id: string): string => {
    const url = URL.createObjectURL(file);
    const data: VideoData = {
      id,
      file,
      url,
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type,
        timestamp: Date.now(),
      },
    };
    setVideoData(data);
    return url;
  };

  const clearVideo = () => {
    if (videoData?.url) {
      URL.revokeObjectURL(videoData.url);
    }
    setVideoDataState(null);
  };

  return (
    <VideoContext.Provider
      value={{
        videoData,
        setVideoData,
        createVideoUrl,
        clearVideo,
      }}
    >
      {children}
    </VideoContext.Provider>
  );
}

export function useVideo() {
  const context = useContext(VideoContext);
  if (context === undefined) {
    throw new Error("useVideo must be used within a VideoProvider");
  }
  return context;
}

// Utility hook to get video URL by ID
export function useVideoUrl(videoId: string | null): string | null {
  const { videoData } = useVideo();

  if (!videoId || !videoData || videoData.id !== videoId) {
    return null;
  }

  return videoData.url;
}
