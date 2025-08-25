"use client";

import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createServeOnlyPrompt, createGameplayPrompt } from "@/lib/prompts";
import { serveOnlySchema, gameplaySchema } from "@/lib/schemas";

interface AnalysisParams {
  videoUrl: string;
  selectedPlayer: string;
  analysisType: "serve-only" | "full-gameplay";
  apiKey: string;
  onProgress?: (progress: number) => void;
}

export async function analyzeVideoClientSide({
  videoUrl,
  selectedPlayer,
  analysisType,
  apiKey,
  onProgress,
}: AnalysisParams) {
  try {
    onProgress?.(10);

    // Initialize Google GenAI with the Vercel AI SDK
    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    onProgress?.(20);

    // Select the appropriate prompt based on analysis type
    const prompt =
      analysisType === "serve-only"
        ? createServeOnlyPrompt(selectedPlayer)
        : createGameplayPrompt(selectedPlayer);

    onProgress?.(30);

    // Select the appropriate schema based on analysis type
    const schema =
      analysisType === "serve-only" ? serveOnlySchema : gameplaySchema;

    onProgress?.(50);

    // Generate analysis using Vercel AI SDK - pass SAS URL directly
    const { object } = await generateObject({
      model: google("models/gemini-2.5-flash"),
      schema: schema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                prompt +
                "\n\nIMPORTANT: Analyze only key moments and provide concise feedback to optimize processing.",
            },
            {
              type: "file",
              data: videoUrl, // Use SAS URL directly
              mediaType: "video/mp4",
            },
          ],
        },
      ],
    });

    onProgress?.(90);

    // The object is already parsed and validated by Zod
    const analysisResult = object;

    onProgress?.(100);

    return {
      success: true,
      data: analysisResult,
      metadata: {
        player: selectedPlayer,
        analysisType: analysisType,
        timestamp: new Date().toISOString(),
        source: "client-side-analysis",
      },
    };
  } catch (error) {
    console.error("Client-side analysis error:", error);
    throw error;
  }
}
