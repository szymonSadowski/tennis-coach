import { z } from "zod";

// Form validation schema for tennis analysis upload
export const tennisAnalysisFormSchema = z.object({
  apiKey: z.string().min(1, "API key is required"),
  selectedPlayer: z.string().min(1, "Please select a tennis player"),
  analysisType: z.enum(["serve-only", "gameplay"], {
    errorMap: () => ({ message: "Please select an analysis type" }),
  }),
  videoFile: z
    .instanceof(File, { message: "Please upload an MP4 video file" })
    .refine(
      (file) => file.type === "video/mp4",
      "Please upload an MP4 video file"
    )
    .refine(
      (file) => file.size <= 200 * 1024 * 1024,
      "File size must be less than 200MB"
    ),
});

export type TennisAnalysisFormData = z.infer<typeof tennisAnalysisFormSchema>;

// Define the shared Zod schemas for tennis analysis
export const serveOnlySchema = z.object({
  totalServes: z.number(),
  faults: z.number(),
  serves: z.array(
    z.object({
      serveNumber: z.number(),
      estimatedSpeed: z.string(),
      result: z.enum(["Successful", "Fault"]),
      feedback: z.string(),
      timestamp: z.string(),
    })
  ),
  overallFeedback: z.string(),
});

export const gameplaySchema = z.object({
  totalServes: z.number(),
  faults: z.number(),
  totalStrokes: z.number(),
  serves: z.array(
    z.object({
      serveNumber: z.number(),
      estimatedSpeed: z.string(),
      result: z.enum(["Successful", "Fault"]),
      feedback: z.string(),
      timestamp: z.string(),
    })
  ),
  strokes: z.array(
    z.object({
      strokeNumber: z.number(),
      type: z.enum(["Forehand", "Backhand", "Volley", "Other"]),
      quality: z.enum(["Excellent", "Good", "Average", "Poor"]),
      feedback: z.string(),
      timestamp: z.string(),
    })
  ),
  pointAnalysis: z.array(
    z.object({
      pointNumber: z.number(),
      description: z.string(),
      suggestedImprovement: z.string(),
    })
  ),
  overallFeedback: z.string(),
});

// Extract TypeScript types from the Zod schemas
export type ServeOnlyAnalysis = z.infer<typeof serveOnlySchema>;
export type GameplayAnalysis = z.infer<typeof gameplaySchema>;
export type TennisAnalysis = ServeOnlyAnalysis | GameplayAnalysis;

// Error response type for when parsing fails
export interface AnalysisError {
  error: string;
  rawResponse?: string;
  metadata?: {
    player: string;
    analysisType: string;
    videoFile: string;
  };
}

// Type guards for runtime type checking
export const isServeOnlyAnalysis = (data: any): data is ServeOnlyAnalysis => {
  return (
    data &&
    typeof data === "object" &&
    typeof data.totalServes === "number" &&
    typeof data.faults === "number" &&
    Array.isArray(data.serves) &&
    typeof data.overallFeedback === "string" &&
    !data.totalStrokes
  ); // ServeOnly doesn't have totalStrokes
};

export const isGameplayAnalysis = (data: any): data is GameplayAnalysis => {
  return (
    data &&
    typeof data === "object" &&
    typeof data.totalServes === "number" &&
    typeof data.faults === "number" &&
    typeof data.totalStrokes === "number" &&
    Array.isArray(data.serves) &&
    Array.isArray(data.strokes) &&
    Array.isArray(data.pointAnalysis) &&
    typeof data.overallFeedback === "string"
  );
};

export const isTennisAnalysis = (data: any): data is TennisAnalysis => {
  return isServeOnlyAnalysis(data) || isGameplayAnalysis(data);
};

export const hasError = (data: any): data is AnalysisError => {
  return data && typeof data === "object" && typeof data.error === "string";
};
