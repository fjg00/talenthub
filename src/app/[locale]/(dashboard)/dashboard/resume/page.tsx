import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getResumeByUser } from "@/lib/dal/resumes";
import { ResumeBuilder } from "@/components/dashboard/resume-builder";

export default async function ResumePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");
  if (profile.role === "employer") redirect("/dashboard/jobs");

  const resume = await getResumeByUser(user.id);

  return <ResumeBuilder initialData={resume} />;
}
