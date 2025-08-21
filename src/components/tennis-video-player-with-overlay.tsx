"use client";

import React, {
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw } from "lucide-react";

interface TennisVideoPlayerWithOverlayProps {
  videoSrc: string;
  analysisData?: any;
  className?: string;
}

export default function TennisVideoPlayerWithOverlay({
  videoSrc,
  analysisData,
  className = "",
}: TennisVideoPlayerWithOverlayProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Always show overlay
  const showOverlay = true;

  // Helper function to parse timestamp string to seconds
  const parseTimestamp = (timestamp: string): number => {
    const parts = timestamp.split(":");
    const minutes = parseInt(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  };

  // Transform analysis data into overlay format with live stats calculation
  const overlayData = useMemo(() => {
    if (!analysisData) return null;

    // Handle new prompt-based structure
    if (analysisData.serves || analysisData.strokes) {
      const serves = (analysisData.serves || []).map(
        (serve: any, index: number) => ({
          timestamp: serve.timestamp,
          timestamp_of_outcome: serve.timestamp,
          result: serve.result === "Successful" ? "successful" : "fault",
          shotType: "serve",
          feedback: serve.feedback,
          serveNumber: serve.serveNumber || index + 1,
          estimatedSpeed: serve.estimatedSpeed,
        })
      );

      const strokes = (analysisData.strokes || []).map(
        (stroke: any, index: number) => ({
          timestamp: stroke.timestamp,
          timestamp_of_outcome: stroke.timestamp,
          result: ["Excellent", "Good"].includes(stroke.quality)
            ? "successful"
            : "fault",
          shotType: stroke.type?.toLowerCase() || "other",
          feedback: stroke.feedback,
          strokeNumber: index + 1,
        })
      );

      const allShots = [...serves, ...strokes].sort((a, b) => {
        const timeA = parseTimestamp(a.timestamp);
        const timeB = parseTimestamp(b.timestamp);
        return timeA - timeB;
      });

      return {
        totalShots:
          (analysisData.totalServes || 0) + (analysisData.totalStrokes || 0),
        totalServes: analysisData.totalServes || 0,
        totalFaults: analysisData.faults || 0,
        shots: allShots,
      };
    }

    // Handle old mock structure (fallback)
    return {
      totalShots: analysisData.totalShots || 0,
      totalServes: analysisData.totalServes || 0,
      totalFaults: analysisData.faults || 0,
      shots: analysisData.shots || [],
    };
  }, [analysisData]);

  // Calculate live stats based on current video time
  const liveStats = useMemo(() => {
    if (!overlayData)
      return { totalShots: 0, successfulShots: 0, faults: 0, successRate: 0 };

    // Find all shots that have occurred up to current time
    const shotsSoFar = overlayData.shots.filter((shot: any) => {
      const shotTime = parseTimestamp(
        shot.timestamp || shot.timestamp_of_outcome
      );
      return shotTime <= currentTime;
    });

    const totalShots = shotsSoFar.length;
    const faults = shotsSoFar.filter(
      (shot: any) => shot.result === "fault"
    ).length;
    const successfulShots = totalShots - faults;
    const successRate =
      totalShots > 0 ? Math.round((successfulShots / totalShots) * 100) : 0;

    return { totalShots, successfulShots, faults, successRate };
  }, [overlayData, currentTime]);

  // Draw overlay on canvas
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || !overlayData || !showOverlay) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size to match video display size
    const rect = video.getBoundingClientRect();
    if (canvas.width !== rect.width || canvas.height !== rect.height) {
      canvas.width = rect.width;
      canvas.height = rect.height;
    }

    // Get current video time
    const currentTime = video.currentTime;
    const duration = video.duration || 1;

    // Draw live statistics (top left)
    const stats = [
      `Total Shots: ${liveStats.totalShots}`,
      `Successful: ${liveStats.successfulShots}`,
      `Faults: ${liveStats.faults}`,
      `Success Rate: ${liveStats.successRate}%`,
    ];

    ctx.font = "bold 17px Arial";
    ctx.textAlign = "left";

    stats.forEach((stat, index) => {
      const y = 30 + index * 28;

      // Background with rounded rectangle effect
      ctx.fillStyle = "rgba(0, 32, 91, 0.85)"; // US Open navy
      ctx.fillRect(20, y - 20, 200, 25);

      // Text
      ctx.fillStyle = "white";
      ctx.fillText(stat, 25, y);
    });

    // Draw timeline with shot markers (bottom of video)
    const timelineY = canvas.height - 40;
    const timelineWidth = canvas.width - 40;
    const timelineX = 20;

    // Timeline background
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(timelineX, timelineY, timelineWidth, 20);

    // Current time indicator
    const currentPos = (currentTime / duration) * timelineWidth;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillRect(timelineX + currentPos - 1, timelineY - 5, 2, 30);

    // Shot markers on timeline
    overlayData.shots.forEach((shot: any) => {
      const shotTime = parseTimestamp(
        shot.timestamp || shot.timestamp_of_outcome
      );
      const shotPos = (shotTime / duration) * timelineWidth;
      const markerColor =
        shot.result === "successful"
          ? "rgba(34, 139, 34, 0.8)"
          : "rgba(220, 20, 60, 0.8)";

      ctx.fillStyle = markerColor;
      ctx.fillRect(timelineX + shotPos - 2, timelineY - 2, 4, 24);
    });

    // Find current shot based on timestamp for shot type indicator
    const currentShot = overlayData.shots.find((shot: any) => {
      const shotTime = parseTimestamp(
        shot.timestamp || shot.timestamp_of_outcome
      );
      const timeDiff = Math.abs(shotTime - currentTime);
      return timeDiff < 2.0; // Show for 2 seconds around the shot time
    });

    // Show current shot indicator (top right corner) - minimal display
    if (currentShot) {
      const indicatorText = `${currentShot.shotType.toUpperCase()}: ${currentShot.result.toUpperCase()}`;

      ctx.font = "bold 16px Arial";
      ctx.textAlign = "right";

      // Background
      const bgColor =
        currentShot.result === "successful"
          ? "rgba(34, 139, 34, 0.9)" // Green for successful
          : "rgba(220, 20, 60, 0.9)"; // Red for fault

      ctx.fillStyle = bgColor;
      ctx.fillRect(canvas.width - 220, 20, 200, 30);

      // Text
      ctx.fillStyle = "white";
      ctx.fillText(indicatorText, canvas.width - 30, 40);

      // Show speed for serves
      if (currentShot.shotType === "serve" && currentShot.estimatedSpeed) {
        ctx.font = "12px Arial";
        ctx.fillStyle = "yellow";
        ctx.fillText(
          `Speed: ${currentShot.estimatedSpeed}`,
          canvas.width - 30,
          25
        );
      }
    }
  }, [overlayData, showOverlay, liveStats]);

  // Update overlay when video plays
  useEffect(() => {
    const updateOverlay = () => {
      drawOverlay();
    };

    if (isPlaying) {
      const interval = setInterval(updateOverlay, 100); // Update overlay 10 times per second
      return () => clearInterval(interval);
    } else {
      // Still update overlay when paused (for seeking)
      updateOverlay();
    }
  }, [isPlaying, drawOverlay, currentTime]); // Add currentTime as dependency

  // Initial draw and resize handling
  useEffect(() => {
    const handleResize = () => {
      drawOverlay();
    };

    window.addEventListener("resize", handleResize);
    drawOverlay(); // Initial draw

    return () => window.removeEventListener("resize", handleResize);
  }, [drawOverlay]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
      setDimensions({ width: video.videoWidth, height: video.videoHeight });
      setTimeout(drawOverlay, 100); // Draw after video is ready
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      drawOverlay(); // Update overlay when paused
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [drawOverlay]);

  // Control handlers
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleRestart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className={`tennis-video-player-with-overlay ${className}`}>
      <div
        ref={containerRef}
        className="relative bg-black rounded-lg overflow-hidden"
      >
        {/* Video element with 16:9 aspect ratio */}
        <div
          className="relative w-full"
          style={{ paddingBottom: "56.25%" /* 16:9 aspect ratio */ }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            className="absolute top-0 left-0 w-full h-full object-contain"
            playsInline
            preload="metadata"
          />

          {/* Overlay Canvas */}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 w-full h-full pointer-events-none"
            style={{ zIndex: 10 }}
          />
        </div>
      </div>

      {/* Video Controls */}
      <div className="mt-4 p-4 bg-slate-100 rounded-lg space-y-4">
        {/* Play/Pause and Progress */}
        <div className="flex items-center space-x-4 flex-wrap">
          <Button
            onClick={handlePlayPause}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            <span>{isPlaying ? "Pause" : "Play"}</span>
          </Button>

          <Button
            onClick={handleRestart}
            variant="outline"
            size="sm"
            className="flex items-center space-x-2"
          >
            <RotateCcw size={16} />
            <span>Restart</span>
          </Button>

          <div className="flex-1 flex items-center space-x-3">
            <span className="text-sm text-slate-600 min-w-[50px]">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-slate-300 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm text-slate-600 min-w-[50px]">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Analysis Info */}
        {overlayData && (
          <div className="bg-white rounded-lg p-3 border">
            <h4 className="font-semibold text-us-open-navy mb-2">
              🎾 Live Analysis {showOverlay ? "(Active)" : "(Hidden)"}
            </h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-600">Total Shots:</span>
                <span className="ml-2 font-medium">{liveStats.totalShots}</span>
              </div>
              <div>
                <span className="text-slate-600">Faults:</span>
                <span className="ml-2 font-medium">{liveStats.faults}</span>
              </div>
              <div>
                <span className="text-slate-600">Success Rate:</span>
                <span className="ml-2 font-medium">
                  {liveStats.successRate}%
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              ✨ Real-time overlay showing live player stats as shots occur!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
