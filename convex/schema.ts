import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Files table - userId is now optional to allow anonymous uploads
  files: defineTable({
    userId: v.optional(v.string()),
    fileName: v.string(),
    fileUrl: v.string(),
  }).index("by_userId", ["userId"]),

  // Feedbacks table - stores Gemini analysis results
  feedbacks: defineTable({
    userId: v.optional(v.string()), // Optional for anonymous users
    fileId: v.id("files"),
    videoUrl: v.string(),
    selectedPlayer: v.string(),
    analysisType: v.union(v.literal("serve-only"), v.literal("full-gameplay")),
    // Store the full Gemini response as any since structure can vary
    feedback: v.any(),
  })
    .index("by_userId", ["userId"])
    .index("by_fileId", ["fileId"]),
});
