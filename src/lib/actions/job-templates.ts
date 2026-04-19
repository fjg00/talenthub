"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { jobTemplates } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export type TemplateActionState = {
  error?: string;
  success?: boolean;
  templateId?: string;
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

const saveTemplateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10000),
  location: z.string().trim().max(200).optional().nullable(),
  jobType: z.enum(jobTypeValues).optional().nullable(),
  experienceLevel: z.enum(experienceLevelValues).optional().nullable(),
  skills: z.array(z.string().trim().min(1)).max(50).optional(),
  salaryMin: z.number().int().min(0).optional().nullable(),
  salaryMax: z.number().int().min(0).optional().nullable(),
  currency: z.enum(currencyValues).optional().nullable(),
});

export type TemplateInput = z.input<typeof saveTemplateSchema>;

/**
 * Save a new job template for the current employer.
 */
export async function createTemplateAction(
  input: TemplateInput
): Promise<TemplateActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = saveTemplateSchema.safeParse(input);
  if (!parsed.success) return { error: "validationError" };

  const d = parsed.data;

  const [inserted] = await db
    .insert(jobTemplates)
    .values({
      employerId: user.id,
      name: d.name,
      title: d.title,
      description: d.description,
      location: d.location ?? null,
      jobType: d.jobType ?? null,
      experienceLevel: d.experienceLevel ?? null,
      skills: d.skills ?? [],
      salaryMin: d.salaryMin ?? null,
      salaryMax: d.salaryMax ?? null,
      currency: d.currency ?? "USD",
    })
    .returning({ id: jobTemplates.id });

  revalidatePath("/dashboard/jobs/new");
  revalidatePath("/dashboard/jobs");

  return { success: true, templateId: inserted.id };
}

export async function deleteTemplateAction(
  templateId: string
): Promise<TemplateActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  if (!z.string().uuid().safeParse(templateId).success) {
    return { error: "validationError" };
  }

  const existing = await db.query.jobTemplates.findFirst({
    where: and(
      eq(jobTemplates.id, templateId),
      eq(jobTemplates.employerId, user.id)
    ),
  });

  if (!existing) return { error: "Unauthorized" };

  await db.delete(jobTemplates).where(eq(jobTemplates.id, templateId));

  revalidatePath("/dashboard/jobs/new");
  revalidatePath("/dashboard/jobs");

  return { success: true };
}
