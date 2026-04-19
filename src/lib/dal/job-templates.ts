import { db } from "@/db";
import { jobTemplates } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

/**
 * Get all job templates for a given employer, newest first.
 */
export async function getTemplatesByEmployer(employerId: string) {
  return await db.query.jobTemplates.findMany({
    where: eq(jobTemplates.employerId, employerId),
    orderBy: [desc(jobTemplates.updatedAt)],
  });
}

export async function getTemplateById(templateId: string) {
  return await db.query.jobTemplates.findFirst({
    where: eq(jobTemplates.id, templateId),
  });
}

/**
 * Fetch a template, but only if it belongs to the given employer.
 * Returns undefined when missing or not owned.
 */
export async function getOwnedTemplate(
  templateId: string,
  employerId: string
) {
  return await db.query.jobTemplates.findFirst({
    where: and(
      eq(jobTemplates.id, templateId),
      eq(jobTemplates.employerId, employerId)
    ),
  });
}
