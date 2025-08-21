"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import TennisVideoPlayerWithOverlay from "@/components/tennis-video-player-with-overlay";
import Link from "next/link";
import {
  TennisAnalysis,
  AnalysisError,
  isGameplayAnalysis,
  isTennisAnalysis,
  hasError,
} from "@/lib/schemas";

interface AnalysisResult {
  success: boolean;
  data: TennisAnalysis | AnalysisError;
  metadata?: {
    player: string;
    analysisType: string;
    videoFile: string;
    timestamp: string;
    analysisMethod?: string;
  };
  error?: string;
}

export default function ResultsPage() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");

  useEffect(() => {
    const resultId = searchParams.get("id");
    console.log("Result ID from URL:", resultId);

    if (resultId) {
      try {
        // Get the stored result from sessionStorage
        const storedResultString = sessionStorage.getItem(resultId);
        if (storedResultString) {
          const storedResult = JSON.parse(storedResultString);
          console.log("Retrieved result from sessionStorage:", storedResult);

          // Extract the actual analysis data
          const analysisResult = storedResult.data;
          setResult(analysisResult);

          // Retrieve video from sessionStorage or global fallback
          if (analysisResult.data?.videoId) {
            const videoId = analysisResult.data.videoId;
            let storedVideo = sessionStorage.getItem(videoId);
            let storedType = sessionStorage.getItem(`${videoId}_type`);

            // Try global fallback if sessionStorage is empty
            if (
              !storedVideo &&
              typeof window !== "undefined" &&
              (window as any)._tennisVideoData?.[videoId]
            ) {
              const globalData = (window as any)._tennisVideoData[videoId];
              storedVideo = globalData.data;
              storedType = globalData.type;
              console.log("Retrieved video from global fallback");
            }

            if (storedVideo && storedType) {
              // Convert base64 back to blob and create URL
              fetch(storedVideo)
                .then((res) => res.blob())
                .then((blob) => {
                  const url = URL.createObjectURL(
                    new Blob([blob], { type: storedType })
                  );
                  setVideoUrl(url);
                  console.log("Video URL created:", url);
                })
                .catch((err) => {
                  console.error("Failed to create video URL:", err);
                });
            } else {
              console.log("No stored video found for ID:", videoId);
            }
          }
        } else {
          console.error("No result found in sessionStorage for ID:", resultId);
          setError(
            "Analysis results not found. Please try running the analysis again."
          );
        }
      } catch (err) {
        setError("Failed to load results from storage");
        console.error("Storage read error:", err);
      }
    } else {
      setError("No result ID provided");
    }
    setLoading(false);
  }, [searchParams]);

  // Clean up video URL when component unmounts
  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl]);

  // Handle manual video upload if video wasn't stored
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-us-open-navy"></div>
          <p className="mt-4 text-us-open-navy font-medium">
            Loading your tennis analysis results...
          </p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="us-open-card w-full max-w-2xl p-8 rounded-lg text-center">
          <h1 className="text-2xl font-bold text-us-open-navy mb-4">Error</h1>
          <p className="text-us-open-navy mb-6">
            {error || "Failed to load results"}
          </p>
          <Link href="/">
            <Button className="us-open-button">Return to Analysis</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 relative">
      <div className="us-open-card w-full max-w-4xl mx-auto p-8 rounded-lg space-y-6 relative z-10">
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
              Tennis Analysis Results
            </h1>
          </div>
          {result.metadata && (
            <div className="text-sm text-us-open-light-blue space-y-1">
              <p>
                <strong>Coach:</strong> {result.metadata.player}
              </p>
              <p>
                <strong>Analysis Type:</strong>{" "}
                {result.metadata.analysisType === "serve-only"
                  ? "Serve Only"
                  : "Full Gameplay"}
              </p>
              <p>
                <strong>Video:</strong> {result.metadata.videoFile}
              </p>
              <p>
                <strong>Analyzed:</strong>{" "}
                {new Date(result.metadata.timestamp).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {result.success ? (
          <div className="space-y-6">
            {/* Tennis Video Player with Analysis */}
            <div className="bg-white/80 p-6 rounded-lg border-2 border-us-open-light-blue/30">
              <h2 className="text-2xl font-semibold text-us-open-navy mb-4">
                🎾 Tennis Video Analysis with AI Overlay
              </h2>

              {videoUrl ? (
                <div className="space-y-6">
                  <TennisVideoPlayerWithOverlay
                    videoSrc={videoUrl}
                    analysisData={result.data}
                    className="w-full max-w-4xl"
                  />

                  {/* Detailed Feedback Section Below Video */}
                  {isTennisAnalysis(result.data) && (
                    <div className="space-y-4">
                      {/* Serve Feedback */}
                      {result.data.serves &&
                        Array.isArray(result.data.serves) && (
                          <div className="bg-gradient-to-r from-us-open-navy/5 to-us-open-light-blue/5 p-4 rounded-lg border border-us-open-light-blue/20">
                            <h3 className="text-xl font-semibold text-us-open-navy mb-3 flex items-center">
                              🎾 Individual Serve Analysis
                            </h3>
                            <div className="space-y-3 ">
                              {result.data.serves.map(
                                (serve: any, index: number) => (
                                  <div
                                    key={index}
                                    className="bg-white/70 p-4 rounded-lg border-l-4 border-us-open-light-blue shadow-sm"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center space-x-3">
                                        <span className="font-semibold text-us-open-navy">
                                          Serve {serve.serveNumber || index + 1}
                                        </span>
                                        <span
                                          className={`px-2 py-1 rounded text-sm font-medium ${
                                            serve.result === "Successful"
                                              ? "bg-green-100 text-green-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {serve.result}
                                        </span>
                                        {serve.estimatedSpeed && (
                                          <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
                                            {serve.estimatedSpeed}
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-us-open-light-blue font-mono">
                                        @ {serve.timestamp}
                                      </span>
                                    </div>
                                    {serve.feedback && (
                                      <p className="text-us-open-navy/80 italic leading-relaxed">
                                        "{serve.feedback}"
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Stroke Feedback - Only for gameplay analysis */}
                      {isGameplayAnalysis(result.data) &&
                        result.data.strokes &&
                        Array.isArray(result.data.strokes) && (
                          <div className="bg-gradient-to-r from-tennis-yellow/5 to-us-open-green/5 p-4 rounded-lg border border-us-open-green/20">
                            <h3 className="text-xl font-semibold text-us-open-navy mb-3 flex items-center">
                              🏸 Individual Stroke Analysis
                            </h3>
                            <div className="space-y-3">
                              {result.data.strokes.map(
                                (stroke: any, index: number) => (
                                  <div
                                    key={index}
                                    className="bg-white/70 p-4 rounded-lg border-l-4 border-us-open-green shadow-sm"
                                  >
                                    <div className="flex items-start justify-between mb-2">
                                      <div className="flex items-center space-x-3">
                                        <span className="font-semibold text-us-open-navy">
                                          {stroke.type || "Stroke"} {index + 1}
                                        </span>
                                        <span
                                          className={`px-2 py-1 rounded text-sm font-medium ${
                                            ["Excellent", "Good"].includes(
                                              stroke.quality
                                            )
                                              ? "bg-green-100 text-green-800"
                                              : stroke.quality === "Average"
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "bg-red-100 text-red-800"
                                          }`}
                                        >
                                          {stroke.quality}
                                        </span>
                                      </div>
                                      <span className="text-xs text-us-open-light-blue font-mono">
                                        @ {stroke.timestamp}
                                      </span>
                                    </div>
                                    {stroke.feedback && (
                                      <p className="text-us-open-navy/80 italic leading-relaxed">
                                        "{stroke.feedback}"
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}

                      {/* Point Analysis - Only for gameplay analysis */}
                      {isGameplayAnalysis(result.data) &&
                        result.data.pointAnalysis &&
                        Array.isArray(result.data.pointAnalysis) && (
                          <div className="bg-gradient-to-r from-us-open-green/5 to-tennis-yellow/5 p-4 rounded-lg border border-tennis-yellow/20">
                            <h3 className="text-xl font-semibold text-us-open-navy mb-3 flex items-center">
                              🎯 Point Analysis
                            </h3>
                            <div className="space-y-3">
                              {result.data.pointAnalysis.map(
                                (point: any, index: number) => (
                                  <div
                                    key={index}
                                    className="bg-white/70 p-4 rounded-lg border-l-4 border-tennis-yellow shadow-sm"
                                  >
                                    <div className="mb-2">
                                      <span className="font-semibold text-us-open-navy">
                                        Point {point.pointNumber || index + 1}
                                      </span>
                                      <span className="ml-3 text-us-open-navy/70">
                                        {point.description}
                                      </span>
                                    </div>
                                    {point.suggestedImprovement && (
                                      <p className="text-us-open-navy/80 italic leading-relaxed">
                                        💡 "{point.suggestedImprovement}"
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-8 border-2 border-dashed border-us-open-light-blue/30 rounded-lg">
                  <p className="text-us-open-navy mb-2">
                    Video not available for overlay display
                  </p>
                  <p className="text-us-open-navy/70 text-sm">
                    The video analysis was completed, but the video file could
                    not be loaded for overlay display. You can view the analysis
                    results below.
                  </p>
                </div>
              )}
            </div>

            {/* Analysis Results Raw Data */}
            {/* <div className="bg-white/80 p-6 rounded-lg border-2 border-us-open-light-blue/30">
              <h2 className="text-2xl font-semibold text-us-open-navy mb-4">
                Analysis Results
              </h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <pre className="text-sm overflow-auto max-h-96 whitespace-pre-wrap">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div> */}

            {/* Display formatted results if it's valid tennis analysis */}
            {isTennisAnalysis(result.data) && (
              <div className="space-y-4">
                {result.data.totalServes && (
                  <div className="bg-tennis-yellow/20 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-us-open-navy mb-2">
                      Serve Summary
                    </h3>
                    <p>
                      <strong>Total Serves:</strong> {result.data.totalServes}
                    </p>
                    <p>
                      <strong>Faults:</strong> {result.data.faults}
                    </p>
                    <p>
                      <strong>Success Rate:</strong>{" "}
                      {(
                        ((result.data.totalServes - result.data.faults) /
                          result.data.totalServes) *
                        100
                      ).toFixed(1)}
                      %
                    </p>
                  </div>
                )}

                {result.data.overallFeedback && (
                  <div className="bg-us-open-green/10 p-4 rounded-lg border-2 border-us-open-green/30">
                    <h3 className="text-lg font-semibold text-us-open-navy mb-2">
                      Overall Feedback
                    </h3>
                    <p className="text-us-open-navy italic">
                      "{result.data.overallFeedback}"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
            <h2 className="text-xl font-semibold text-red-700 mb-2">
              Analysis Failed
            </h2>
            <p className="text-red-600 mb-4">
              {result.error || "Unknown error occurred"}
            </p>
            {hasError(result.data) && result.data.rawResponse && (
              <div className="bg-white p-4 rounded border">
                <h3 className="font-medium mb-2">Raw Response:</h3>
                <pre className="text-sm overflow-auto max-h-48 whitespace-pre-wrap">
                  {result.data.rawResponse}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-center pt-6">
          <Link href="/">
            <Button className="us-open-button px-8 py-3">
              Analyze Another Video
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
