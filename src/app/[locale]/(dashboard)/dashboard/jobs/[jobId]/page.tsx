import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getJobById, getJobWithApplications, hasApplied, incrementJobViews } from "@/lib/dal/jobs";
import { ApplicantList } from "@/components/dashboard/applicant-list";
import { ApplyForm } from "@/components/dashboard/apply-form";
import { JobStatusBadge } from "@/components/dashboard/status-badge";
import { AIJobOptimizer } from "@/components/dashboard/ai-job-optimizer";
import { getTranslations } from "next-intl/server";
import { MapPin, Building2, Clock, Coins, Eye } from "lucide-react";
import { formatViews } from "@/lib/utils/format-views";

export default async function JobDetailPage({
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
  if (!profile) redirect("/login");

  const t = await getTranslations("jobs");

  if (profile.role === "employer") {
    // Employer: show job + applicants
    const job = await getJobWithApplications(jobId, user.id);
    if (!job) notFound();

    return (
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
            <JobStatusBadge status={job.status} />
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
            )}
            {job.jobType && <span>{t(job.jobType)}</span>}
            {job.experienceLevel && <span>{t(job.experienceLevel)}</span>}
            {job.salaryMin && (
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5" />
                {job.salaryMin.toLocaleString()}
                {job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : "+"}{" "}
                {job.currency}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatViews(job.views)} {t("views")}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            {t("description")}
          </h2>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
            {job.description}
          </p>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        <AIJobOptimizer jobId={jobId} />

        <ApplicantList applicants={job.applications} jobId={jobId} />
      </div>
    );
  }

  // Candidate view
  const job = await getJobById(jobId);
  if (!job || job.status !== "published") notFound();

  // Increment view count (fire-and-forget)
  incrementJobViews(jobId);

  const alreadyApplied = await hasApplied(jobId, user.id);
  const companyName =
    job.employer.employerProfile?.companyName ?? job.employer.fullName;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
        <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5" /> {companyName}
          </span>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {job.location}
            </span>
          )}
          {job.jobType && <span>{t(job.jobType)}</span>}
          {job.experienceLevel && <span>{t(job.experienceLevel)}</span>}
          {job.salaryMin && (
            <span className="flex items-center gap-1">
              <Coins className="h-3.5 w-3.5" />
              {job.salaryMin.toLocaleString()}
              {job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : "+"}{" "}
              {job.currency}
            </span>
          )}
          {job.deadline && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t("deadlineOn")} {new Date(job.deadline).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-3 text-lg font-semibold text-foreground">
          {t("description")}
        </h2>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {job.description}
        </p>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {job.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <ApplyForm jobId={jobId} hasApplied={alreadyApplied} />
    </div>
  );
}
