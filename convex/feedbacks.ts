import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Save feedback from Gemini analysis
export const saveFeedback = mutation({
  args: {
    userId: v.optional(v.string()),
    fileId: v.id("files"),
    videoUrl: v.string(),
    selectedPlayer: v.string(),
    analysisType: v.union(v.literal("serve-only"), v.literal("full-gameplay")),
    feedback: v.any(), // The full Gemini response object
  },
  returns: v.id("feedbacks"),
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert("feedbacks", {
      userId: args.userId,
      fileId: args.fileId,
      videoUrl: args.videoUrl,
      selectedPlayer: args.selectedPlayer,
      analysisType: args.analysisType,
      feedback: args.feedback,
    });

    return feedbackId;
  },
});

// Get feedback by ID
export const getFeedbackById = query({
  args: { feedbackId: v.id("feedbacks") },
  returns: v.union(
    v.object({
      _id: v.id("feedbacks"),
      _creationTime: v.number(),
      userId: v.optional(v.string()),
      fileId: v.id("files"),
      videoUrl: v.string(),
      selectedPlayer: v.string(),
      analysisType: v.union(
        v.literal("serve-only"),
        v.literal("full-gameplay")
      ),
      feedback: v.any(),
      file: v.optional(
        v.object({
          fileName: v.string(),
          fileUrl: v.string(),
        })
      ),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const feedback = await ctx.db.get(args.feedbackId);
    if (!feedback) {
      return null;
    }

    // Get the associated file
    const file = await ctx.db.get(feedback.fileId);

    return {
      ...feedback,
      file: file
        ? {
            fileName: file.fileName,
            fileUrl: file.fileUrl,
          }
        : undefined,
    };
  },
});

// Get all feedbacks for a user (or all anonymous feedbacks if no userId)
export const getUserFeedbacks = query({
  args: { userId: v.optional(v.string()) },
  returns: v.array(
    v.object({
      _id: v.id("feedbacks"),
      _creationTime: v.number(),
      userId: v.optional(v.string()),
      fileId: v.id("files"),
      videoUrl: v.string(),
      selectedPlayer: v.string(),
      analysisType: v.union(
        v.literal("serve-only"),
        v.literal("full-gameplay")
      ),
      feedback: v.any(),
      file: v.optional(
        v.object({
          fileName: v.string(),
          fileUrl: v.string(),
        })
      ),
    })
  ),
  handler: async (ctx, args) => {
    const feedbacks = await ctx.db
      .query("feedbacks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Get the associated files
    const feedbacksWithFiles = await Promise.all(
      feedbacks.map(async (feedback) => {
        const file = await ctx.db.get(feedback.fileId);
        return {
          ...feedback,
          file: file
            ? {
                fileName: file.fileName,
                fileUrl: file.fileUrl,
              }
            : undefined,
        };
      })
    );

    return feedbacksWithFiles;
  },
});
