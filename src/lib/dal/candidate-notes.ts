import { db } from "@/db";
import { candidateNotes } from "@/db/schema";
import { and, eq, desc } from "drizzle-orm";

/**
 * Get all notes an employer has written about a specific candidate.
 * Newest first.
 */
export async function getNotesForCandidate(
  employerId: string,
  candidateId: string
) {
  return await db.query.candidateNotes.findMany({
    where: and(
      eq(candidateNotes.employerId, employerId),
      eq(candidateNotes.candidateId, candidateId)
    ),
    orderBy: [desc(candidateNotes.createdAt)],
  });
}

/**
 * Count notes per candidate for a given employer.
 * Used to show a badge on applicant cards.
 * Returns a Map<candidateId, count>.
 */
export async function getNoteCountsByEmployer(
  employerId: string
): Promise<Map<string, number>> {
  const rows = await db
    .select({
      candidateId: candidateNotes.candidateId,
    })
    .from(candidateNotes)
    .where(eq(candidateNotes.employerId, employerId));

  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.candidateId, (counts.get(row.candidateId) ?? 0) + 1);
  }
  return counts;
}

export async function getNoteById(noteId: string) {
  return await db.query.candidateNotes.findFirst({
    where: eq(candidateNotes.id, noteId),
  });
}
