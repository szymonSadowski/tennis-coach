import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveFile = mutation({
  args: {
    storageId: v.id("_storage"),
    userId: v.optional(v.string()), // Make userId optional
    fileName: v.string(),
  },
  handler: async (ctx, args) => {
    const fileUrl = await ctx.storage.getUrl(args.storageId);

    const fileId = await ctx.db.insert("files", {
      userId: args.userId,
      fileName: args.fileName,
      fileUrl: fileUrl!,
    });

    return { fileId, fileUrl };
  },
});

export const getFileUrl = query({
  args: {
    fileId: v.id("files"),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db.get(args.fileId);
    if (!file) {
      return null;
    }

    // Generate a new temporary URL (15 minutes)
    const storageId = file.fileUrl.split("/").pop(); // Extract storage ID from URL
    return await ctx.storage.getUrl(storageId as any);
  },
});

export const getUserFiles = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("files")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const deleteById = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    return await ctx.storage.delete(args.storageId);
  },
});

export const cleanupUnsignedUserFiles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    console.log(
      `Starting cleanup for files older than: ${new Date(twentyFourHoursAgo).toISOString()}`
    );

    // Find all files without userId (unsigned users) that are older than 24 hours
    const unsignedFiles = await ctx.db
      .query("files")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();

    console.log(`Found ${unsignedFiles.length} unsigned user files total`);

    const filesToDelete = unsignedFiles.filter(
      (file) => file._creationTime < twentyFourHoursAgo
    );

    console.log(
      `Found ${filesToDelete.length} files older than 24 hours to delete`
    );

    let deletedCount = 0;
    let errorCount = 0;

    for (const file of filesToDelete) {
      try {
        console.log(
          `Processing file: ${file._id}, URL: ${file.fileUrl}, created: ${new Date(file._creationTime).toISOString()}`
        );

        // Extract storage ID from the file URL
        // Convex URLs typically look like: https://domain.convex.cloud/api/storage/storageId
        const urlParts = file.fileUrl.split("/");
        const storageId = urlParts[urlParts.length - 1];

        console.log(`Extracted storage ID: ${storageId}`);

        // Delete any associated feedbacks first
        const feedbacks = await ctx.db
          .query("feedbacks")
          .withIndex("by_fileId", (q) => q.eq("fileId", file._id))
          .collect();

        console.log(
          `Found ${feedbacks.length} feedbacks to delete for file ${file._id}`
        );

        for (const feedback of feedbacks) {
          await ctx.db.delete(feedback._id);
        }

        // Delete the storage file
        if (storageId && storageId.length > 0) {
          console.log(`Attempting to delete storage file: ${storageId}`);
          await ctx.storage.delete(storageId as any);
          console.log(`Successfully deleted storage file: ${storageId}`);
        } else {
          console.warn(`Invalid storage ID for file ${file._id}: ${storageId}`);
        }

        // Delete the database record
        console.log(`Deleting database record: ${file._id}`);
        await ctx.db.delete(file._id);
        console.log(`Successfully deleted database record: ${file._id}`);

        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete file ${file._id}:`, error);
        errorCount++;
      }
    }

    const result = {
      totalFilesFound: filesToDelete.length,
      deletedCount,
      errorCount,
      timestamp: new Date().toISOString(),
    };

    console.log(`Cleanup completed:`, result);

    return result;
  },
});
