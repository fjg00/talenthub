import { db } from "@/db";
import { resumes, EMPTY_RESUME, type ResumeData } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getResumeByUser(userId: string): Promise<ResumeData> {
  const row = await db.query.resumes.findFirst({
    where: eq(resumes.userId, userId),
  });
  return row?.data ?? EMPTY_RESUME;
}
