import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getJobById } from "@/lib/dal/jobs";
import { JobForm } from "@/components/dashboard/job-form";

export default async function EditJobPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile || profile.role !== "employer") {
    redirect("/dashboard/jobs");
  }

  const job = await getJobById(jobId);
  if (!job || job.employerId !== user.id) notFound();

  return <JobForm job={job} />;
}
