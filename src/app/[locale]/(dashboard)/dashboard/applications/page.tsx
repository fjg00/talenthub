import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getApplicationsByCandidate } from "@/lib/dal/applications";
import { CandidateApplications } from "@/components/dashboard/candidate-applications";

export default async function ApplicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  // Only candidates see this page
  if (profile.role === "employer") {
    redirect("/dashboard/jobs");
  }

  const applications = await getApplicationsByCandidate(user.id);

  return <CandidateApplications applications={applications} />;
}
