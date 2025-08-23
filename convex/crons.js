import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "cleanup unsigned user files",
  { hourUTC: 2, minuteUTC: 0 }, // Run at 2 AM UTC daily
  internal.files.cleanupUnsignedUserFiles
);

export default crons;
