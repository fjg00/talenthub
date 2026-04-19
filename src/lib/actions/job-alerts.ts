"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { jobAlerts } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type AlertActionState = {
  error?: string;
  success?: boolean;
  alertId?: string;
};

const jobTypeValues = ["full_time", "part_time", "contract", "remote"] as const;
const experienceLevelValues = ["entry", "mid", "senior", "lead"] as const;
const currencyValues = [
  "USD",
  "SAR",
  "AED",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "EGP",
] as const;
const frequencyValues = ["daily", "weekly"] as const;

const alertSchema = z.object({
  name: z.string().trim().min(1).max(120),
  keyword: z.string().trim().max(200).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  jobType: z.enum(jobTypeValues).optional().nullable(),
  experienceLevel: z.enum(experienceLevelValues).optional().nullable(),
  skills: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  salaryMin: z.number().int().min(0).optional().nullable(),
  currency: z.enum(currencyValues).optional().nullable(),
  frequency: z.enum(frequencyValues).default("daily"),
});

export type AlertInput = z.input<typeof alertSchema>;

export async function createAlertAction(
  input: AlertInput
): Promise<AlertActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const parsed = alertSchema.safeParse(input);
  if (!parsed.success) return { error: "validationError" };

  const d = parsed.data;
  const [inserted] = await db
    .insert(jobAlerts)
    .values({
      candidateId: user.id,
      name: d.name,
      keyword: d.keyword ?? null,
      location: d.location ?? null,
      jobType: d.jobType ?? null,
      experienceLevel: d.experienceLevel ?? null,
      skills: d.skills ?? [],
      salaryMin: d.salaryMin ?? null,
      currency: d.currency ?? null,
      frequency: d.frequency,
      enabled: true,
    })
    .returning({ id: jobAlerts.id });

  revalidatePath("/dashboard/alerts");
  return { success: true, alertId: inserted.id };
}

export async function updateAlertAction(
  alertId: string,
  input: AlertInput
): Promise<AlertActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  if (!z.string().uuid().safeParse(alertId).success) {
    return { error: "validationError" };
  }

  const parsed = alertSchema.safeParse(input);
  if (!parsed.success) return { error: "validationError" };

  const existing = await db.query.jobAlerts.findFirst({
    where: and(
      eq(jobAlerts.id, alertId),
      eq(jobAlerts.candidateId, user.id)
    ),
  });
  if (!existing) return { error: "Unauthorized" };

  const d = parsed.data;
  await db
    .update(jobAlerts)
    .set({
      name: d.name,
      keyword: d.keyword ?? null,
      location: d.location ?? null,
      jobType: d.jobType ?? null,
      experienceLevel: d.experienceLevel ?? null,
      skills: d.skills ?? [],
      salaryMin: d.salaryMin ?? null,
      currency: d.currency ?? null,
      frequency: d.frequency,
      updatedAt: new Date(),
    })
    .where(eq(jobAlerts.id, alertId));

  revalidatePath("/dashboard/alerts");
  return { success: true };
}

export async function toggleAlertAction(
  alertId: string,
  enabled: boolean
): Promise<AlertActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await db.query.jobAlerts.findFirst({
    where: and(
      eq(jobAlerts.id, alertId),
      eq(jobAlerts.candidateId, user.id)
    ),
  });
  if (!existing) return { error: "Unauthorized" };

  await db
    .update(jobAlerts)
    .set({ enabled, updatedAt: new Date() })
    .where(eq(jobAlerts.id, alertId));

  revalidatePath("/dashboard/alerts");
  return { success: true };
}

export async function deleteAlertAction(
  alertId: string
): Promise<AlertActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const existing = await db.query.jobAlerts.findFirst({
    where: and(
      eq(jobAlerts.id, alertId),
      eq(jobAlerts.candidateId, user.id)
    ),
  });
  if (!existing) return { error: "Unauthorized" };

  await db.delete(jobAlerts).where(eq(jobAlerts.id, alertId));

  revalidatePath("/dashboard/alerts");
  return { success: true };
}
