"use client";

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

interface AnalysisData {
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
  videoUrl?: string;
}

interface TennisAnalysisDisplayProps {
  analysisData: AnalysisData;
}

export default function TennisAnalysisDisplay({
  analysisData,
}: TennisAnalysisDisplayProps) {
  const { data: result, videoUrl } = analysisData;

  if (!analysisData.success) {
    return (
      <div className="bg-red-50 p-6 rounded-lg border-2 border-red-200">
        <h2 className="text-xl font-semibold text-red-700 mb-2">
          Analysis Failed
        </h2>
        <p className="text-red-600 mb-4">
          {analysisData.error || "Unknown error occurred"}
        </p>
        {hasError(result) && result.rawResponse && (
          <div className="bg-white p-4 rounded border">
            <h3 className="font-medium mb-2">Raw Response:</h3>
            <pre className="text-sm overflow-auto max-h-48 whitespace-pre-wrap">
              {result.rawResponse}
            </pre>
          </div>
        )}
      </div>
    );
  }

  return (
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
              analysisData={result}
              className="w-full max-w-4xl"
            />

            {/* Detailed Feedback Section Below Video */}
            {isTennisAnalysis(result) && (
              <div className="space-y-4">
                {/* Serve Feedback */}
                {result.serves && Array.isArray(result.serves) && (
                  <div className="bg-gradient-to-r from-us-open-navy/5 to-us-open-light-blue/5 p-4 rounded-lg border border-us-open-light-blue/20">
                    <h3 className="text-xl font-semibold text-us-open-navy mb-3 flex items-center">
                      🎾 Individual Serve Analysis
                    </h3>
                    <div className="space-y-3 ">
                      {result.serves.map((serve: any, index: number) => (
                        <div
                          key={index}
                          className="bg-white/70 p-4 rounded-lg border-l-4 border-us-open-light-blue shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <span className="font-semibold text-us-open-navy">
                                Serve {serve.serveNumber || index + 1}
                              </span>
                              <span className="text-us-open-light-blue font-medium">
                                {serve.estimatedSpeed}
                              </span>
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${
                                  serve.result === "Successful"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {serve.result}
                              </span>
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
                      ))}
                    </div>
                  </div>
                )}

                {/* Stroke Analysis - Only for gameplay analysis */}
                {isGameplayAnalysis(result) &&
                  result.strokes &&
                  Array.isArray(result.strokes) && (
                    <div className="bg-gradient-to-r from-tennis-yellow/10 to-us-open-green/10 p-4 rounded-lg border border-us-open-green/20">
                      <h3 className="text-xl font-semibold text-us-open-navy mb-3 flex items-center">
                        🏆 Stroke Analysis
                      </h3>
                      <div className="space-y-3">
                        {result.strokes.map((stroke: any, index: number) => (
                          <div
                            key={index}
                            className="bg-white/70 p-4 rounded-lg border-l-4 border-us-open-green shadow-sm"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <span className="font-semibold text-us-open-navy">
                                  {stroke.type || `Stroke ${index + 1}`}
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
                        ))}
                      </div>
                    </div>
                  )}

                {/* Point Analysis - Only for gameplay analysis */}
                {isGameplayAnalysis(result) &&
                  result.pointAnalysis &&
                  Array.isArray(result.pointAnalysis) && (
                    <div className="bg-gradient-to-r from-us-open-light-blue/10 to-us-open-navy/10 p-4 rounded-lg border border-us-open-navy/20">
                      <h3 className="text-xl font-semibold text-us-open-navy mb-3 flex items-center">
                        🧠 Tactical Point Analysis
                      </h3>
                      <div className="space-y-3">
                        {result.pointAnalysis.map(
                          (point: any, index: number) => (
                            <div
                              key={index}
                              className="bg-white/70 p-4 rounded-lg border-l-4 border-us-open-navy shadow-sm"
                            >
                              <div className="mb-2">
                                <span className="font-semibold text-us-open-navy">
                                  Point {point.pointNumber || index + 1}
                                </span>
                              </div>
                              <p className="text-us-open-navy/80 mb-2">
                                {point.description}
                              </p>
                              {point.suggestedImprovement && (
                                <div className="bg-tennis-yellow/20 p-2 rounded border-l-2 border-tennis-yellow">
                                  <p className="text-us-open-navy/90 text-sm font-medium">
                                    💡 Suggested Improvement:{" "}
                                    {point.suggestedImprovement}
                                  </p>
                                </div>
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
              The video analysis was completed, but the video file could not be
              loaded for overlay display. You can view the analysis results
              below.
            </p>
          </div>
        )}
      </div>

      {/* Display formatted results if it's valid tennis analysis */}
      {isTennisAnalysis(result) && (
        <div className="space-y-4">
          {result.totalServes && (
            <div className="bg-tennis-yellow/20 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-us-open-navy mb-2">
                📊 Serve Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-white/50 p-3 rounded">
                  <div className="text-2xl font-bold text-us-open-navy">
                    {result.totalServes}
                  </div>
                  <div className="text-sm text-us-open-light-blue">
                    Total Serves
                  </div>
                </div>
                <div className="bg-white/50 p-3 rounded">
                  <div className="text-2xl font-bold text-us-open-navy">
                    {result.faults || 0}
                  </div>
                  <div className="text-sm text-us-open-light-blue">Faults</div>
                </div>
              </div>
            </div>
          )}

          {result.overallFeedback && (
            <div className="bg-us-open-green/10 p-4 rounded-lg border-2 border-us-open-green/30">
              <h3 className="text-lg font-semibold text-us-open-navy mb-2">
                🎯 Overall Coach Feedback
              </h3>
              <p className="text-us-open-navy leading-relaxed">
                {result.overallFeedback}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
