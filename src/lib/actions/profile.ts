"use server";

import { z } from "zod/v4";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { candidateProfiles, employerProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ProfileState = {
  error?: string;
  success?: boolean;
};

const candidateSchema = z.object({
  headline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  skills: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0).max(50).optional(),
  education: z.string().max(500).optional(),
  location: z.string().max(200).optional(),
  linkedinUrl: z.url().optional().or(z.literal("")),
  phone: z.string().max(20).optional(),
  availabilityStatus: z.enum(["open", "not_looking", "open_to_offers"]).optional(),
});

const employerSchema = z.object({
  companyName: z.string().min(1).max(200),
  companyDescription: z.string().max(2000).optional(),
  companyWebsite: z.url().optional().or(z.literal("")),
  companySize: z
    .enum(["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"])
    .optional(),
  industry: z.string().max(200).optional(),
  location: z.string().max(200).optional(),
});

export async function updateCandidateProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = candidateSchema.safeParse({
    headline: formData.get("headline") || undefined,
    bio: formData.get("bio") || undefined,
    skills: formData.get("skills") || undefined,
    experienceYears: formData.get("experienceYears") || undefined,
    education: formData.get("education") || undefined,
    location: formData.get("location") || undefined,
    linkedinUrl: formData.get("linkedinUrl") || undefined,
    phone: formData.get("phone") || undefined,
    availabilityStatus: formData.get("availabilityStatus") || undefined,
  });

  if (!parsed.success) {
    return { error: "validationError" };
  }

  const skillsArray = parsed.data.skills
    ? parsed.data.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : undefined;

  await db
    .update(candidateProfiles)
    .set({
      headline: parsed.data.headline,
      bio: parsed.data.bio,
      skills: skillsArray,
      experienceYears: parsed.data.experienceYears,
      education: parsed.data.education,
      location: parsed.data.location,
      linkedinUrl: parsed.data.linkedinUrl || null,
      phone: parsed.data.phone,
      availabilityStatus: parsed.data.availabilityStatus,
      updatedAt: new Date(),
    })
    .where(eq(candidateProfiles.userId, user.id));

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function updateEmployerProfileAction(
  _prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const parsed = employerSchema.safeParse({
    companyName: formData.get("companyName"),
    companyDescription: formData.get("companyDescription") || undefined,
    companyWebsite: formData.get("companyWebsite") || undefined,
    companySize: formData.get("companySize") || undefined,
    industry: formData.get("industry") || undefined,
    location: formData.get("location") || undefined,
  });

  if (!parsed.success) {
    return { error: "validationError" };
  }

  await db
    .update(employerProfiles)
    .set({
      companyName: parsed.data.companyName,
      companyDescription: parsed.data.companyDescription,
      companyWebsite: parsed.data.companyWebsite || null,
      companySize: parsed.data.companySize,
      industry: parsed.data.industry,
      location: parsed.data.location,
      updatedAt: new Date(),
    })
    .where(eq(employerProfiles.userId, user.id));

  revalidatePath("/dashboard/profile");
  return { success: true };
}
