import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getJobsByEmployer, getPublishedJobs } from "@/lib/dal/jobs";
import { getSavedJobIds } from "@/lib/dal/saved-jobs";
import { EmployerJobList } from "@/components/dashboard/employer-job-list";
import { CandidateJobList } from "@/components/dashboard/candidate-job-list";
import { JobSearch } from "@/components/dashboard/job-search";
import { computeSkillMatch } from "@/lib/utils/skill-match";

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
  const pageSize = 10;
  const sort = params.sort; // "match" or undefined (default: date)
  const candidateSkills = profile.candidateProfile?.skills ?? [];

  const skillsParam = params.skills?.split(",").filter(Boolean);

  const [{ jobs, totalCount }, savedJobIds] = await Promise.all([
    getPublishedJobs({
      keyword: params.keyword,
      jobType: params.jobType,
      experienceLevel: params.experienceLevel,
      location: params.location,
      salaryMin: params.salaryMin ? Number(params.salaryMin) : undefined,
      salaryMax: params.salaryMax ? Number(params.salaryMax) : undefined,
      currency: params.currency,
      skills: skillsParam,
      excludeAppliedByCandidateId: user.id,
      page: sort === "match" ? 1 : page,
      pageSize: sort === "match" ? 200 : pageSize,
    }),
    getSavedJobIds(user.id),
  ]);

  let displayJobs = jobs;
  let displayTotal = totalCount;

  // When sorting by match, compute scores and re-sort
  if (sort === "match" && candidateSkills.length > 0) {
    const scored = jobs.map((job) => ({
      job,
      matchPct: computeSkillMatch(job.skills ?? [], candidateSkills).matchPct,
    }));
    scored.sort((a, b) => b.matchPct - a.matchPct);
    displayTotal = scored.length;
    const offset = (page - 1) * pageSize;
    displayJobs = scored.slice(offset, offset + pageSize).map((s) => s.job);
  }

  return (
    <div>
      <JobSearch showSortByMatch />
      <CandidateJobList
        jobs={displayJobs}
        totalCount={displayTotal}
        page={page}
        pageSize={pageSize}
        savedJobIds={[...savedJobIds]}
      />
    </div>
  );
}
