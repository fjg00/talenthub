import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getApplicationsByCandidate } from "@/lib/dal/applications";
import { getStatusHistoryForApplications } from "@/lib/dal/application-status-history";
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

  const historyMap = await getStatusHistoryForApplications(
    applications.map((a) => a.id)
  );
  // Plain object for client serialization
  const histories: Record<
    string,
    { id: string; status: string; note: string | null; createdAt: Date }[]
  > = {};
  for (const [appId, entries] of historyMap) {
    histories[appId] = entries;
  }

  return (
    <CandidateApplications applications={applications} histories={histories} />
  );
}
