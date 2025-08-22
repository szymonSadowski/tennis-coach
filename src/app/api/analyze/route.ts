import { generateObject } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { NextRequest, NextResponse } from "next/server";
import { createServeOnlyPrompt, createGameplayPrompt } from "@/lib/prompts";
import { serveOnlySchema, gameplaySchema } from "@/lib/schemas";
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as File;
    const selectedPlayer = formData.get("selectedPlayer") as string;
    const analysisType = formData.get("analysisType") as string;
    const apiKey = formData.get("apiKey") as string;

    if (!apiKey || !selectedPlayer || !analysisType || !videoFile) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: {
            apiKey: !!apiKey,
            selectedPlayer: !!selectedPlayer,
            analysisType: !!analysisType,
            videoFile: !!videoFile,
          },
        },
        { status: 400 }
      );
    }

    // Check file size limit (similar to ML model limits)
    const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB limit (conservative for Gemini API)
    if (videoFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "File size too large",
          details: `File size (${Math.round(
            videoFile.size / 1024 / 1024
          )}MB) exceeds the maximum allowed size of ${Math.round(
            MAX_FILE_SIZE / 1024 / 1024
          )}MB. Please compress your video or use a shorter clip.`,
          maxSizeMB: Math.round(MAX_FILE_SIZE / 1024 / 1024),
          fileSizeMB: Math.round(videoFile.size / 1024 / 1024),
        },
        { status: 413 } // 413 Payload Too Large
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

    // Convert video file to base64 for Gemini
    const videoArrayBuffer = await videoFile.arrayBuffer();
    const videoBase64 = Buffer.from(videoArrayBuffer).toString("base64");

    console.log("Video base64 length:", videoBase64.length);
    console.log("About to call generateObject...");

    // Select the appropriate schema based on analysis type
    const schema =
      analysisType === "serve-only" ? serveOnlySchema : gameplaySchema;

    const { object } = await generateObject({
      model: google("models/gemini-2.5-flash"),
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
              data: videoBase64,
              mediaType: videoFile.type,
            },
          ],
        },
      ],
    });

    console.log("=== GEMINI AI RESPONSE START ===");
    console.log("Generated object:", object);
    console.log("=== GEMINI AI RESPONSE END ===");

    // The object is already parsed and validated by Zod
    const analysisResult = object;

    console.log("Analysis result:", analysisResult);
    return NextResponse.json({
      success: true,
      data: analysisResult,
      metadata: {
        player: selectedPlayer,
        analysisType: analysisType,
        videoFile: videoFile.name,
        timestamp: new Date().toISOString(),
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
