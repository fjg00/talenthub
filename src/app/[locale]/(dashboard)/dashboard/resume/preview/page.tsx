import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getResumeByUser } from "@/lib/dal/resumes";
import { ResumePreview } from "@/components/dashboard/resume-preview";

export default async function ResumePreviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");
  if (profile.role === "employer") redirect("/dashboard/jobs");

  const resume = await getResumeByUser(user.id);
  return <ResumePreview data={resume} />;
}
