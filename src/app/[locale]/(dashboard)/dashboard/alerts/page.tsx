import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getAlertsByCandidate } from "@/lib/dal/job-alerts";
import { JobAlertsPage } from "@/components/dashboard/job-alerts";

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");
  if (profile.role === "employer") redirect("/dashboard/jobs");

  const alerts = await getAlertsByCandidate(user.id);

  // Plain serializable shape
  const alertsData = alerts.map((a) => ({
    id: a.id,
    name: a.name,
    keyword: a.keyword,
    location: a.location,
    jobType: a.jobType,
    experienceLevel: a.experienceLevel,
    skills: a.skills ?? [],
    salaryMin: a.salaryMin,
    currency: a.currency,
    frequency: a.frequency,
    enabled: a.enabled,
    lastSentAt: a.lastSentAt,
  }));

  return <JobAlertsPage alerts={alertsData} />;
}
