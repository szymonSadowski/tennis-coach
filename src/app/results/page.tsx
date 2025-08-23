"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import TennisAnalysisDisplay from "@/components/tennis-analysis-display";
import Link from "next/link";
import { TennisAnalysis, AnalysisError } from "@/lib/schemas";
import { useVideoUrl, useAnalysisResult } from "@/contexts/video-context";

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

function ResultsContent() {
  const searchParams = useSearchParams();
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Get analysis result and video URL from context
  const analysisResult = useAnalysisResult();
  const videoUrl = useVideoUrl(videoId);

  useEffect(() => {
    const resultId = searchParams.get("id");
    console.log("Result ID from URL:", resultId);

    if (analysisResult) {
      console.log("Retrieved result from context:", analysisResult);

      // The context stores the raw result, extract the analysis data
      setResult(analysisResult.data);

      // Set video ID to get video URL from context
      if (analysisResult.videoId) {
        setVideoId(analysisResult.videoId);
        console.log("Video ID set for context lookup:", analysisResult.videoId);
      }

      setLoading(false);
    } else if (resultId) {
      // Fallback to sessionStorage if context doesn't have the result
      try {
        const storedResultString = sessionStorage.getItem(resultId);
        console.log("Fallback - Raw stored result string:", storedResultString);

        if (storedResultString && storedResultString.trim()) {
          try {
            const storedResult = JSON.parse(storedResultString);
            console.log(
              "Fallback - Retrieved result from sessionStorage:",
              storedResult
            );

            // Extract the actual analysis data
            const sessionAnalysisResult = storedResult.data;
            setResult(sessionAnalysisResult);

            // Set video ID to get video URL from context
            if (sessionAnalysisResult.data?.videoId) {
              setVideoId(sessionAnalysisResult.data.videoId);
              console.log(
                "Fallback - Video ID set for context lookup:",
                sessionAnalysisResult.data.videoId
              );
            }
          } catch (parseError) {
            console.error(
              "Fallback - Failed to parse JSON from sessionStorage:",
              parseError
            );
            setError(
              "Failed to parse analysis results. The data may be corrupted."
            );
          }
        } else {
          console.error(
            "Fallback - No result found in sessionStorage for ID:",
            resultId
          );
          setError(
            "Analysis results not found. Please try running the analysis again."
          );
        }
      } catch (err) {
        setError("Failed to load results from storage");
        console.error("Fallback - Storage read error:", err);
      }
      setLoading(false);
    } else {
      setError("No result ID provided");
      setLoading(false);
    }
  }, [searchParams, analysisResult]);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
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
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
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
    <div className="min-h-[calc(100vh-4rem)] p-8 relative">
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

        {/* Prepare analysis data for the component */}
        <TennisAnalysisDisplay
          analysisData={{
            success: result.success,
            data: result.data,
            metadata: result.metadata,
            error: result.error,
            videoUrl: videoUrl || undefined,
          }}
        />

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

function LoadingFallback() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center relative">
      {/* Tennis Court Background Lines */}
      <div className="fixed inset-0 pointer-events-none opacity-15">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-full max-w-6xl h-full max-h-[800px]">
            <div className="absolute inset-4 border-2 border-tennis-yellow/40 rounded-sm"></div>
            <div className="absolute top-1/2 left-4 right-4 h-0 border-t-2 border-tennis-yellow/40 transform -translate-y-1/2"></div>
            <div className="absolute top-4 bottom-4 left-1/2 w-0 border-l-2 border-tennis-yellow/40 transform -translate-x-1/2"></div>
          </div>
        </div>
      </div>
      <div className="text-center relative z-10">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-us-open-navy mx-auto"></div>
        <p className="mt-4 text-us-open-navy font-medium">
          Loading tennis analysis results...
        </p>
      </div>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ResultsContent />
    </Suspense>
  );
}
