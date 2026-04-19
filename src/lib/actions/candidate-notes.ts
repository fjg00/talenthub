"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { candidateNotes, applications, jobs } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type NoteActionState = {
  error?: string;
  success?: boolean;
  noteId?: string;
};

const createNoteSchema = z.object({
  candidateId: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
});

/**
 * Create a new note about a candidate.
 * Requires the employer to have at least one application from this candidate
 * on one of their jobs — prevents writing notes about arbitrary users.
 */
export async function createCandidateNoteAction(
  candidateId: string,
  content: string
): Promise<NoteActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = createNoteSchema.safeParse({ candidateId, content });
  if (!parsed.success) return { error: "validationError" };

  // Verify there's an application from this candidate to one of the employer's jobs
  const hasApplication = await db
    .select({ id: applications.id })
    .from(applications)
    .innerJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        eq(applications.candidateId, parsed.data.candidateId),
        eq(jobs.employerId, user.id)
      )
    )
    .limit(1);

  if (hasApplication.length === 0) {
    return { error: "Unauthorized" };
  }

  const [inserted] = await db
    .insert(candidateNotes)
    .values({
      employerId: user.id,
      candidateId: parsed.data.candidateId,
      content: parsed.data.content,
    })
    .returning({ id: candidateNotes.id });

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/candidates");

  return { success: true, noteId: inserted.id };
}

const updateNoteSchema = z.object({
  noteId: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
});

export async function updateCandidateNoteAction(
  noteId: string,
  content: string
): Promise<NoteActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = updateNoteSchema.safeParse({ noteId, content });
  if (!parsed.success) return { error: "validationError" };

  // Verify ownership
  const existing = await db.query.candidateNotes.findFirst({
    where: eq(candidateNotes.id, parsed.data.noteId),
  });

  if (!existing || existing.employerId !== user.id) {
    return { error: "Unauthorized" };
  }

  await db
    .update(candidateNotes)
    .set({
      content: parsed.data.content,
      updatedAt: new Date(),
    })
    .where(eq(candidateNotes.id, parsed.data.noteId));

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/candidates");

  return { success: true };
}

export async function deleteCandidateNoteAction(
  noteId: string
): Promise<NoteActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const existing = await db.query.candidateNotes.findFirst({
    where: eq(candidateNotes.id, noteId),
  });

  if (!existing || existing.employerId !== user.id) {
    return { error: "Unauthorized" };
  }

  await db.delete(candidateNotes).where(eq(candidateNotes.id, noteId));

  revalidatePath("/dashboard/jobs");
  revalidatePath("/dashboard/candidates");

  return { success: true };
}

/**
 * Fetch notes for the current employer about a specific candidate.
 * Used from the client component via `useTransition` when the modal opens.
 */
export async function getMyNotesForCandidateAction(candidateId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" as const, notes: [] };

  const notes = await db.query.candidateNotes.findMany({
    where: and(
      eq(candidateNotes.employerId, user.id),
      eq(candidateNotes.candidateId, candidateId)
    ),
    orderBy: (t, { desc }) => [desc(t.createdAt)],
  });

  return { notes };
}
