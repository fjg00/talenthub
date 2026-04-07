import { db } from "@/db";
import { profiles, candidateProfiles, employerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getProfile(userId: string) {
  const result = await db.query.profiles.findFirst({
    where: eq(profiles.id, userId),
    with: {
      candidateProfile: true,
      employerProfile: true,
    },
  });
  return result ?? null;
}

export async function getCandidateProfile(userId: string) {
  const result = await db.query.candidateProfiles.findFirst({
    where: eq(candidateProfiles.userId, userId),
  });
  return result ?? null;
}

export async function getEmployerProfile(userId: string) {
  const result = await db.query.employerProfiles.findFirst({
    where: eq(employerProfiles.userId, userId),
  });
  return result ?? null;
}
