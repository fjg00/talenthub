import { db } from "@/db";
import { applicationStatusHistory } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

export type StatusHistoryEntry = {
  id: string;
  status: string;
  note: string | null;
  createdAt: Date;
};

/**
 * Fetch full status history for a single application, oldest → newest.
 */
export async function getStatusHistory(
  applicationId: string
): Promise<StatusHistoryEntry[]> {
  return await db
    .select({
      id: applicationStatusHistory.id,
      status: applicationStatusHistory.status,
      note: applicationStatusHistory.note,
      createdAt: applicationStatusHistory.createdAt,
    })
    .from(applicationStatusHistory)
    .where(eq(applicationStatusHistory.applicationId, applicationId))
    .orderBy(asc(applicationStatusHistory.createdAt));
}

/**
 * Fetch history for many applications in one query. Returns a Map<applicationId, entries[]>.
 */
export async function getStatusHistoryForApplications(
  applicationIds: string[]
): Promise<Map<string, StatusHistoryEntry[]>> {
  const map = new Map<string, StatusHistoryEntry[]>();
  if (applicationIds.length === 0) return map;

  const rows = await db
    .select({
      applicationId: applicationStatusHistory.applicationId,
      id: applicationStatusHistory.id,
      status: applicationStatusHistory.status,
      note: applicationStatusHistory.note,
      createdAt: applicationStatusHistory.createdAt,
    })
    .from(applicationStatusHistory)
    .where(inArray(applicationStatusHistory.applicationId, applicationIds))
    .orderBy(asc(applicationStatusHistory.createdAt));

  for (const r of rows) {
    const list = map.get(r.applicationId) ?? [];
    list.push({
      id: r.id,
      status: r.status,
      note: r.note,
      createdAt: r.createdAt,
    });
    map.set(r.applicationId, list);
  }
  return map;
}
