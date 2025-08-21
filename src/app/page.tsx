"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart } from "lucide-react";

const tennisPlayers = [
  "Rafael Nadal",
  "Novak Djokovic",
  "Roger Federer",
  "Jannik Sinner",
  "Carlos Alcaraz",
  "Nick Kyrigos",
  "Alexander Bublik",
  "Iga Swiatek",
];

export default function Home() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [analysisType, setAnalysisType] = useState("");
  const [isApiKeySaved, setIsApiKeySaved] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  // Auto-load saved API key from localStorage on component mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem("gemini-api-key");
    if (savedApiKey && savedApiKey.trim()) {
      setApiKey(savedApiKey);
      setIsApiKeySaved(true);
    }
  }, []);

  const handleApiKeySave = () => {
    if (apiKey.trim()) {
      localStorage.setItem("gemini-api-key", apiKey);
      setIsApiKeySaved(true);
    }
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is MP4 format
      if (file.type !== "video/mp4") {
        alert("Please upload an MP4 video file");
        return;
      }

      // Check file size (limit to 200MB to match API limit)
      const maxSize = 200 * 1024 * 1024; // 200MB in bytes
      if (file.size > maxSize) {
        const fileSizeMB = Math.round(file.size / 1024 / 1024);
        alert(
          `File size (${fileSizeMB}MB) exceeds the maximum allowed size of 200MB. Please compress your video or use a shorter clip.`
        );
        return;
      }

      setVideoFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!apiKey.trim()) {
      alert("Please enter and save your Gemini API key");
      return;
    }
    if (!videoFile) {
      alert("Please upload an MP4 video file");
      return;
    }
    if (!selectedPlayer) {
      alert("Please select a tennis player");
      return;
    }
    if (!analysisType) {
      alert("Please select analysis type");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      let result;
      let videoId: string | null = null;

      // Step 1: Store video file (10% progress)
      setAnalysisProgress(10);

      if (videoFile) {
        console.log("Storing video:", {
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
        });

        try {
          // Step 2: Convert video to base64 (30% progress)
          setAnalysisProgress(30);

          const videoData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(videoFile);
          });

          videoId = `video_${Date.now()}`;

          // Step 3: Store video data (50% progress)
          setAnalysisProgress(50);

          try {
            sessionStorage.setItem(videoId, videoData);
            sessionStorage.setItem(`${videoId}_type`, videoFile.type);
            sessionStorage.setItem(`${videoId}_name`, videoFile.name);
            sessionStorage.setItem(
              `${videoId}_size`,
              videoFile.size.toString()
            );

            const testRetrieval = sessionStorage.getItem(videoId);
            if (testRetrieval) {
              console.log(
                "Video stored successfully with ID:",
                videoId,
                "- Storage verification: PASSED"
              );
            } else {
              console.error(
                "Video storage FAILED - sessionStorage.getItem returned null"
              );
              throw new Error("SessionStorage failed to store video");
            }
          } catch (storageError) {
            console.warn(
              "SessionStorage full, trying alternative approach:",
              storageError
            );

            if (typeof window !== "undefined") {
              (window as any)._tennisVideoData = {
                [videoId]: {
                  data: videoData,
                  type: videoFile.type,
                  name: videoFile.name,
                  size: videoFile.size,
                },
              };
              console.log("Video stored in global variable as fallback");
            }
          }
        } catch (fileReadError) {
          console.error("Failed to read video file:", fileReadError);
        }
      }

      console.log("About to analyze - videoId:", videoId);

      if (videoFile) {
        // Step 4: Call API for analysis data (70% progress)
        setAnalysisProgress(70);

        console.log("Calling API for tennis analysis for videoId:", videoId);

        // Create FormData for API call
        const formData = new FormData();
        formData.append("video", videoFile);
        formData.append("selectedPlayer", selectedPlayer);
        formData.append("analysisType", analysisType);
        formData.append("apiKey", apiKey);

        // Step 5: Make API request (80% progress)
        setAnalysisProgress(80);

        const response = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        // Step 6: Process API response (90% progress)
        setAnalysisProgress(90);

        if (!response.ok) {
          // Handle specific error responses
          if (response.status === 413) {
            const errorData = await response.json();
            throw new Error(
              errorData.details ||
                `File size too large. Please use a video file smaller than ${
                  errorData.maxSizeMB || 200
                }MB.`
            );
          }
          throw new Error(
            `API request failed: ${response.status} ${response.statusText}`
          );
        }

        const apiResult = await response.json();

        if (!apiResult.success) {
          // Handle API-level errors with more detail
          const errorMessage =
            apiResult.details ||
            apiResult.error ||
            "API returned unsuccessful result";
          throw new Error(errorMessage);
        }

        // Create result in expected format for results page
        result = {
          success: true,
          data: {
            ...apiResult.data,
            videoId: videoId,
          },
          metadata: {
            ...apiResult.metadata,
            analysisMethod: "ai-api",
          },
        };

        // Complete (100% progress)
        setAnalysisProgress(100);
      }

      // Brief delay to show 100% completion
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Navigate to results page with the data
      console.log("Final result before navigation:", result);

      // Final validation - check if videoId made it into the result
      if (videoId && result) {
        if (result.data?.videoId) {
          console.log(
            "✅ SUCCESS: videoId properly included in result:",
            result.data.videoId
          );
        } else {
          console.error(
            "❌ ERROR: videoId generated but NOT found in result.data"
          );
          console.error("videoId variable:", videoId);
          console.error("result.data:", result.data);
        }
      }

      // Store analysis result in sessionStorage with unique key
      const resultId = `tennis_result_${Date.now()}`;
      const sessionResult = {
        id: resultId,
        data: result || {},
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem(resultId, JSON.stringify(sessionResult));

      console.log("Stored result in sessionStorage with ID:", resultId);
      console.log("Stored result data:", sessionResult);

      // Navigate with just the result ID
      router.push(`/results?id=${resultId}`);
    } catch (error) {
      console.error("Analysis error:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to analyze video. Please try again.";
      alert(errorMessage);
      setAnalysisProgress(0); // Reset progress on error
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative">
      {/* Background elements */}

      <div className="us-open-card w-full max-w-2xl p-8 rounded-lg space-y-8 relative z-10">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <svg
              className="w-10 h-10 text-tennis-yellow"
              fill="currentColor"
              viewBox="0 0 472.615 472.615"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M236.308,0C177.21,0,123.225,21.744,81.79,57.603c38.847,38.956,94.88,61.345,154.515,61.345
                c59.623,0,115.662-22.388,154.52-61.346C349.39,21.744,295.404,0,236.308,0z"
              />
              <path
                d="M236.372,353.665c-59.649,0-115.697,22.4-154.545,61.379c41.43,35.84,95.401,57.571,154.481,57.571
                c59.113,0,113.111-21.755,154.55-57.631C352.01,376.042,295.978,353.665,236.372,353.665z"
              />
              <path
                d="M405.246,71.146c-42.54,42.904-103.899,67.494-168.941,67.494c-65.055,0-126.407-24.587-168.944-67.486
                C25.707,113.76,0,172.018,0,236.308c0,64.307,25.721,122.581,67.395,165.188c42.539-42.923,103.904-67.523,168.977-67.523
                c65.021,0,126.371,24.576,168.91,67.459c41.636-42.601,67.334-100.849,67.334-165.124
                C472.615,172.014,446.904,113.752,405.246,71.146z"
              />
            </svg>
            <h1 className="text-4xl font-bold text-us-open-navy">
              Tennis Coach AI
            </h1>
          </div>
          <p className="text-lg text-us-open-light-blue">
            Analyze your tennis technique with AI
          </p>
        </div>
        {/* API Key Section */}
        <div className="space-y-4">
          <Label
            htmlFor="api-key"
            className="text-lg font-semibold text-us-open-navy"
          >
            Google AI API Key
          </Label>
          <div className="flex gap-3 flex-wrap">
            <Input
              id="api-key"
              type="password"
              placeholder="Enter your Gemini API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 border-2 border-us-open-light-blue/50 focus:border-us-open-light-blue focus:ring-us-open-light-blue"
            />
            <Button
              onClick={handleApiKeySave}
              className={`us-open-button px-6 ${
                isApiKeySaved ? "bg-green-600 border-green-400" : ""
              }`}
            >
              {isApiKeySaved ? "Saved" : "Save"}
            </Button>
            <Button
              onClick={() => setApiKey("")}
              variant="outline"
              className="px-6 border-2 border-us-open-light-blue/50 hover:border-us-open-light-blue hover:bg-us-open-light-blue/10 text-us-open-navy"
            >
              Clear
            </Button>
          </div>
        </div>
        {/* Video Upload Section */}
        <div className="space-y-4">
          <Label
            htmlFor="video-upload"
            className="text-lg font-semibold text-us-open-navy"
          >
            Upload Tennis Video
          </Label>

          {/* File size info */}
          <div className="bg-us-open-light-blue/10 border border-us-open-light-blue/30 rounded-lg p-3">
            <p className="text-sm text-us-open-navy">
              <span className="font-medium">📁 File Requirements:</span>
              <br />
              • Format: MP4 video files only
              <br />• Maximum size: 200MB
            </p>
          </div>

          <div className="space-y-3">
            {/* Hidden file input */}
            <input
              id="video-upload"
              type="file"
              accept=".mp4,video/mp4"
              onChange={handleVideoUpload}
              className="hidden"
            />

            {/* Custom Button for file upload */}
            <div className="flex flex-col items-center space-y-3">
              <Button
                onClick={() => document.getElementById("video-upload")?.click()}
                variant="outline"
                className="w-full max-w-md h-16 border-2 border-us-open-light-blue/50 hover:border-us-open-light-blue hover:bg-us-open-light-blue/10 text-us-open-navy font-medium"
              >
                {videoFile
                  ? "Change Video File"
                  : "Choose MP4 Video File (max 200MB)"}
              </Button>

              {/* File status */}
              <div className="text-center">
                {videoFile ? (
                  <p className="text-sm text-us-open-navy bg-tennis-yellow/20 px-4 py-2 rounded-md">
                    Selected: {videoFile.name} (
                    {(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                  </p>
                ) : (
                  <p className="text-sm text-us-open-navy/60">
                    No file selected
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Tennis Player Selection */}
        <div className="space-y-4">
          <Label
            htmlFor="player-select"
            className="text-lg font-semibold text-us-open-navy"
          >
            Select Tennis Player for Comparison
          </Label>
          <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
            <SelectTrigger className="w-full border-2 border-us-open-light-blue/50 focus:border-us-open-light-blue focus:ring-us-open-light-blue">
              <SelectValue placeholder="Choose a tennis player..." />
            </SelectTrigger>
            <SelectContent>
              {tennisPlayers.map((player) => (
                <SelectItem key={player} value={player}>
                  {player}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Analysis Type Selection */}
        <div className="space-y-4">
          <Label
            htmlFor="analysis-type"
            className="text-lg font-semibold text-us-open-navy"
          >
            Analysis Type
          </Label>
          <Select value={analysisType} onValueChange={setAnalysisType}>
            <SelectTrigger className="w-full border-2 border-us-open-light-blue/50 focus:border-us-open-light-blue focus:ring-us-open-light-blue">
              <SelectValue placeholder="Choose analysis type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-gameplay">Full Gameplay</SelectItem>
              <SelectItem value="serve-only">Serve Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* Video Analysis Toggle */}
        {/* Action Buttons */} {/* Submit Button */}
        <div className="pt-6 space-y-4">
          <Button
            onClick={handleSubmit}
            disabled={
              !apiKey ||
              !videoFile ||
              !selectedPlayer ||
              !analysisType ||
              isAnalyzing
            }
            className="us-open-button w-full py-4 text-lg font-semibold hover:bg-us-open-light-blue transition-all transform hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isAnalyzing ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>
                  {analysisProgress < 15
                    ? "Preparing Video..."
                    : analysisProgress < 35
                    ? "Converting Video..."
                    : analysisProgress < 55
                    ? "Storing Video Data..."
                    : analysisProgress < 75
                    ? "AI Analyzing Technique..."
                    : analysisProgress < 95
                    ? "Generating Feedback..."
                    : "Finalizing Results..."}
                </span>
              </>
            ) : (
              <>
                <BarChart size={20} />
                <span>Analyze Tennis Technique</span>
              </>
            )}
          </Button>

          {/* Enhanced Progress Bar with Animation */}
          {isAnalyzing && (
            <div className="space-y-3">
              <div className="w-full bg-slate-200 rounded-full h-3 relative overflow-hidden">
                <div
                  className="bg-gradient-to-r from-us-open-navy to-us-open-light-blue h-3 rounded-full transition-all duration-700 ease-out relative"
                  style={{ width: `${Math.min(analysisProgress, 100)}%` }}
                >
                  {/* Animated shimmer effect */}
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">
                  {analysisProgress < 15
                    ? "🎾 Initializing video processing pipeline..."
                    : analysisProgress < 35
                    ? "� Converting video to optimal format for analysis..."
                    : analysisProgress < 55
                    ? "💾 Securely storing video data for playback..."
                    : analysisProgress < 75
                    ? "🤖 AI analyzing your tennis technique and form..."
                    : analysisProgress < 95
                    ? "💡 Generating personalized coaching feedback..."
                    : "✅ Analysis complete! Preparing your results..."}
                </span>
                <span className="text-us-open-navy font-semibold">
                  {Math.round(analysisProgress)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
