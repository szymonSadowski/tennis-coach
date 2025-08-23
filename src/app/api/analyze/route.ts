import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";
import { createServeOnlyPrompt, createGameplayPrompt } from "@/lib/prompts";
import { serveOnlySchema, gameplaySchema } from "@/lib/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { videoUrl, selectedPlayer, analysisType, apiKey } = body;

    if (!apiKey || !selectedPlayer || !analysisType || !videoUrl) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            apiKey: !!apiKey,
            selectedPlayer: !!selectedPlayer,
            analysisType: !!analysisType,
            videoUrl: !!videoUrl,
          },
        },
        { status: 400 }
      );
    }

    // Select the appropriate prompt based on analysis type
    const prompt =
      analysisType === "serve-only"
        ? createServeOnlyPrompt(selectedPlayer)
        : createGameplayPrompt(selectedPlayer);

    // Generate analysis using Gemini with the user's API key
    const google = createGoogleGenerativeAI({
      apiKey: apiKey,
    });

    // Select the appropriate schema based on analysis type
    const schema =
      analysisType === "serve-only" ? serveOnlySchema : gameplaySchema;

    const { object } = await generateObject({
      model: google("models/gemini-1.5-flash"), // Fixed model name
      schema: schema,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            {
              type: "file",
              data: videoUrl, // Use URL directly instead of base64
              mediaType: "video/mp4",
            },
          ],
        },
      ],
    });

    // The object is already parsed and validated by Zod
    const analysisResult = object;
    return NextResponse.json({
      success: true,
      data: analysisResult,
      metadata: {
        player: selectedPlayer,
        analysisType: analysisType,
        timestamp: new Date().toISOString(),
        source: "convex-storage",
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);

    return NextResponse.json(
      {
        error: "Failed to analyze video",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
