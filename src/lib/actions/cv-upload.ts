"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/db";
import { candidateProfiles } from "@/db/schema";
import { eq } from "drizzle-orm";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export type CvUploadState = {
  error?: string;
  success?: boolean;
};

export async function uploadCvAction(
  _prevState: CvUploadState,
  formData: FormData
): Promise<CvUploadState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const file = formData.get("cv") as File | null;

  if (!file || file.size === 0) {
    return { error: "No file selected" };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return { error: "Invalid file type. Please upload PDF, DOC, or DOCX." };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { error: "File too large. Maximum size is 10MB." };
  }

  const ext = file.name.split(".").pop();
  const filePath = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("cv-uploads")
    .upload(filePath, file, {
      upsert: false,
    });

  if (uploadError) {
    return { error: "Upload failed. Please try again." };
  }

  await db
    .update(candidateProfiles)
    .set({ cvUrl: filePath, updatedAt: new Date() })
    .where(eq(candidateProfiles.userId, user.id));

  revalidatePath("/dashboard/profile");
  return { success: true };
}

export async function getCvSignedUrl(filePath: string): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase.storage
    .from("cv-uploads")
    .createSignedUrl(filePath, 3600); // 1 hour

  if (error || !data) return null;
  return data.signedUrl;
}
