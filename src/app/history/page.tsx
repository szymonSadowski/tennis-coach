"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Play, Eye } from "lucide-react";
import { Suspense } from "react";

function HistoryContent() {
  const { user, isLoaded } = useUser();

  // Query user's feedbacks
  const feedbacks = useQuery(
    api.feedbacks.getUserFeedbacks,
    user?.id ? { userId: user.id } : "skip"
  );

  // Show loading if user data or feedbacks are not loaded yet
  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-us-open-navy"></div>
          <p className="mt-4 text-us-open-navy font-medium">
            Loading authentication...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-8">
        <div className="us-open-card w-full max-w-2xl p-8 rounded-lg text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
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
            <h1 className="text-3xl font-bold text-us-open-navy">
              Authentication Required
            </h1>
          </div>
          <p className="text-us-open-navy mb-6">
            You need to be logged in to view your analysis history.
          </p>
          <div className="space-x-4">
            <Link href="/">
              <Button className="us-open-button">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state for feedbacks
  if (feedbacks === undefined) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-us-open-navy"></div>
          <p className="mt-4 text-us-open-navy font-medium">
            Loading your analysis history...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] p-8 relative">
      <div className="us-open-card w-full max-w-6xl mx-auto p-8 rounded-lg space-y-6 relative z-10">
        {/* Header */}
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
                c65.021,0,126.371,24.576,168.910,67.459c41.636-42.601,67.334-100.849,67.334-165.124
                C472.615,172.014,446.904,113.752,405.246,71.146z"
              />
            </svg>
            <h1 className="text-4xl font-bold text-us-open-navy">
              Analysis History
            </h1>
          </div>
          <p className="text-us-open-light-blue">
            View all your past tennis video analyses
          </p>
        </div>

        {/* Content */}
        {feedbacks && feedbacks.length > 0 ? (
          <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-tennis-yellow/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-us-open-navy">
                  {feedbacks.length}
                </div>
                <div className="text-sm text-us-open-light-blue">
                  Total Analyses
                </div>
              </div>
              <div className="bg-us-open-light-blue/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-us-open-navy">
                  {
                    feedbacks.filter((f) => f.analysisType === "serve-only")
                      .length
                  }
                </div>
                <div className="text-sm text-us-open-light-blue">
                  Serve Analyses
                </div>
              </div>
              <div className="bg-us-open-green/20 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-us-open-navy">
                  {
                    feedbacks.filter((f) => f.analysisType === "full-gameplay")
                      .length
                  }
                </div>
                <div className="text-sm text-us-open-light-blue">
                  Full Gameplay
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white/80 rounded-lg border-2 border-us-open-light-blue/30 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-us-open-navy text-white">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Video File
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Coach
                      </th>
                      <th className="px-6 py-4 text-left font-semibold">
                        Analysis Type
                      </th>
                      <th className="px-6 py-4 text-center font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-us-open-light-blue/20">
                    {feedbacks.map((feedback) => (
                      <tr
                        key={feedback._id}
                        className="hover:bg-us-open-light-blue/10 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="text-us-open-navy font-medium">
                            {new Date(
                              feedback._creationTime
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-us-open-light-blue text-sm">
                            {new Date(
                              feedback._creationTime
                            ).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-tennis-yellow" />
                            <div>
                              <div className="text-us-open-navy font-medium">
                                {feedback.file?.fileName || "Unknown File"}
                              </div>
                              <div className="text-us-open-light-blue text-sm">
                                Video Analysis
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-us-open-navy font-medium">
                            {feedback.selectedPlayer}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              feedback.analysisType === "serve-only"
                                ? "bg-tennis-yellow/20 text-tennis-yellow"
                                : "bg-us-open-green/20 text-us-open-green"
                            }`}
                          >
                            {feedback.analysisType === "serve-only"
                              ? "Serve Only"
                              : "Full Gameplay"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Link
                              href={`/user-results?feedbackId=${feedback._id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-us-open-navy text-white rounded-lg hover:bg-us-open-navy/80 transition-colors text-sm font-medium"
                            >
                              <Eye className="w-4 h-4" />
                              View
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-us-open-light-blue/10 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Play className="w-12 h-12 text-us-open-light-blue" />
              </div>
              <h3 className="text-xl font-semibold text-us-open-navy mb-2">
                No Analysis History Yet
              </h3>
              <p className="text-us-open-light-blue mb-6">
                You haven't analyzed any tennis videos yet. Start by uploading
                your first video!
              </p>
              <Link href="/">
                <Button className="us-open-button">
                  Analyze Your First Video
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-center pt-6 border-t border-us-open-light-blue/20">
          <Link href="/">
            <Button className="us-open-button px-8 py-3">
              Back to Analysis
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
        <p className="mt-4 text-us-open-navy font-medium">Loading history...</p>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <HistoryContent />
    </Suspense>
  );
}
