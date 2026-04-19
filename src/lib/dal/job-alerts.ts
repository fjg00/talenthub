import { db } from "@/db";
import { jobAlerts } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export async function getAlertsByCandidate(candidateId: string) {
  return await db.query.jobAlerts.findMany({
    where: eq(jobAlerts.candidateId, candidateId),
    orderBy: [desc(jobAlerts.createdAt)],
  });
}

export async function getAlertById(alertId: string) {
  return await db.query.jobAlerts.findFirst({
    where: eq(jobAlerts.id, alertId),
  });
}
