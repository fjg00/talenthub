"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { resumes, type ResumeData } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ResumeActionState = {
  error?: string;
  success?: boolean;
};

const experienceSchema = z.object({
  id: z.string(),
  title: z.string().trim().max(200),
  company: z.string().trim().max(200),
  location: z.string().trim().max(200),
  start: z.string().trim().max(20),
  end: z.string().trim().max(20),
  description: z.string().trim().max(3000),
});

const educationSchema = z.object({
  id: z.string(),
  school: z.string().trim().max(200),
  degree: z.string().trim().max(200),
  field: z.string().trim().max(200),
  start: z.string().trim().max(20),
  end: z.string().trim().max(20),
});

const languageSchema = z.object({
  id: z.string(),
  name: z.string().trim().max(80),
  proficiency: z.string().trim().max(80),
});

const certificationSchema = z.object({
  id: z.string(),
  name: z.string().trim().max(200),
  issuer: z.string().trim().max(200),
  year: z.string().trim().max(20),
});

const linkSchema = z.object({
  id: z.string(),
  label: z.string().trim().max(80),
  url: z.string().trim().max(500),
});

const resumeSchema = z.object({
  fullName: z.string().trim().max(120),
  headline: z.string().trim().max(200),
  email: z.string().trim().max(200),
  phone: z.string().trim().max(60),
  location: z.string().trim().max(200),
  summary: z.string().trim().max(3000),
  experience: z.array(experienceSchema).max(30),
  education: z.array(educationSchema).max(20),
  skills: z.array(z.string().trim().min(1).max(60)).max(100),
  languages: z.array(languageSchema).max(20),
  certifications: z.array(certificationSchema).max(40),
  links: z.array(linkSchema).max(20),
});

export async function saveResumeAction(
  data: ResumeData
): Promise<ResumeActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  const parsed = resumeSchema.safeParse(data);
  if (!parsed.success) return { error: "validationError" };

  const existing = await db.query.resumes.findFirst({
    where: eq(resumes.userId, user.id),
  });

  if (existing) {
    await db
      .update(resumes)
      .set({ data: parsed.data, updatedAt: new Date() })
      .where(eq(resumes.userId, user.id));
  } else {
    await db.insert(resumes).values({
      userId: user.id,
      data: parsed.data,
    });
  }

  revalidatePath("/dashboard/resume");
  revalidatePath("/dashboard/resume/preview");
  return { success: true };
}
