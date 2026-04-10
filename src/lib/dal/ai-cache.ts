import { db } from "@/db";
import { aiCache } from "@/db/schema";
import { eq, and } from "drizzle-orm";

export async function getCachedResult(
  type: "match_score" | "candidate_summary" | "job_optimization",
  entityId: string
) {
  const row = await db.query.aiCache.findFirst({
    where: and(eq(aiCache.type, type), eq(aiCache.entityId, entityId)),
  });
  return row?.result ?? null;
}

export async function setCachedResult(
  type: "match_score" | "candidate_summary" | "job_optimization",
  entityId: string,
  result: unknown
) {
  // Upsert: delete old + insert new
  await db
    .delete(aiCache)
    .where(and(eq(aiCache.type, type), eq(aiCache.entityId, entityId)));

  await db.insert(aiCache).values({ type, entityId, result });
}
