import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getTemplatesByEmployer } from "@/lib/dal/job-templates";
import { JobForm, type JobTemplate } from "@/components/dashboard/job-form";

export default async function NewJobPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile || profile.role !== "employer") {
    redirect("/dashboard/jobs");
  }

  const rows = await getTemplatesByEmployer(user.id);
  const templates: JobTemplate[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    title: r.title,
    description: r.description,
    location: r.location,
    jobType: r.jobType,
    experienceLevel: r.experienceLevel,
    skills: r.skills ?? [],
    salaryMin: r.salaryMin,
    salaryMax: r.salaryMax,
    currency: r.currency,
  }));

  return <JobForm templates={templates} />;
}
