import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getJobsByEmployer, getPublishedJobs } from "@/lib/dal/jobs";
import { EmployerJobList } from "@/components/dashboard/employer-job-list";
import { CandidateJobList } from "@/components/dashboard/candidate-job-list";
import { JobSearch } from "@/components/dashboard/job-search";

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile) redirect("/login");

  const params = await searchParams;

  if (profile.role === "employer") {
    const jobs = await getJobsByEmployer(user.id);
    return <EmployerJobList jobs={jobs} />;
  }

  // Candidate view
  const page = Number(params.page) || 1;
  const { jobs, totalCount } = await getPublishedJobs({
    keyword: params.keyword,
    jobType: params.jobType,
    experienceLevel: params.experienceLevel,
    page,
  });

  return (
    <div>
      <JobSearch />
      <CandidateJobList
        jobs={jobs}
        totalCount={totalCount}
        page={page}
        pageSize={10}
      />
    </div>
  );
}
