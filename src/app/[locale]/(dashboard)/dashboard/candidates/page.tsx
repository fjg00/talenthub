import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";
import { getAllApplicantsByEmployer } from "@/lib/dal/applications";
import { getInterviewsByEmployer } from "@/lib/dal/interviews";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import {
  Users,
  MapPin,
  Briefcase,
  Sparkles,
  Video,
  ChevronRight,
} from "lucide-react";
import { ApplicationStatusBadge } from "@/components/dashboard/status-badge";
import { CandidateFilters } from "@/components/dashboard/candidate-filters";
import { ScheduleInterviewButton } from "@/components/dashboard/schedule-interview-button";
import { Suspense } from "react";

export default async function CandidatesPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const searchParams = await searchParamsPromise;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const profile = await getProfile(user.id);
  if (!profile || profile.role !== "employer") redirect("/dashboard");

  const [applicants, interviews] = await Promise.all([
    getAllApplicantsByEmployer(user.id),
    getInterviewsByEmployer(user.id),
  ]);
  const t = await getTranslations("candidates");

  // Build interview lookup: candidateId → interview
  const interviewMap = new Map<string, typeof interviews[number]>();
  for (const iv of interviews) {
    interviewMap.set(iv.candidateId, iv);
  }

  // Deduplicate by candidate (show latest application per candidate)
  const candidateMap = new Map<
    string,
    { candidate: typeof applicants[number]["candidate"]; apps: typeof applicants }
  >();
  for (const app of applicants) {
    const existing = candidateMap.get(app.candidateId);
    if (existing) {
      existing.apps.push(app);
    } else {
      candidateMap.set(app.candidateId, {
        candidate: app.candidate,
        apps: [app],
      });
    }
  }

  let candidates = Array.from(candidateMap.entries());

  // Apply filters
  const nameFilter = searchParams.name?.toLowerCase();
  if (nameFilter) {
    candidates = candidates.filter(([, { candidate }]) =>
      candidate.fullName.toLowerCase().includes(nameFilter)
    );
  }

  const skillFilter = searchParams.skill?.toLowerCase();
  if (skillFilter) {
    candidates = candidates.filter(([, { candidate }]) =>
      candidate.candidateProfile?.skills?.some((s) =>
        s.toLowerCase().includes(skillFilter)
      )
    );
  }

  const locationFilter = searchParams.location?.toLowerCase();
  if (locationFilter) {
    candidates = candidates.filter(([, { candidate }]) =>
      candidate.candidateProfile?.location?.toLowerCase().includes(locationFilter)
    );
  }

  const expMin = searchParams.expMin ? parseInt(searchParams.expMin) : null;
  const expMax = searchParams.expMax ? parseInt(searchParams.expMax) : null;
  if (expMin != null && !isNaN(expMin)) {
    candidates = candidates.filter(
      ([, { candidate }]) =>
        (candidate.candidateProfile?.experienceYears ?? 0) >= expMin
    );
  }
  if (expMax != null && !isNaN(expMax)) {
    candidates = candidates.filter(
      ([, { candidate }]) =>
        (candidate.candidateProfile?.experienceYears ?? 0) <= expMax
    );
  }

  // Apply sort
  const sortKey = searchParams.sort ?? "name";
  candidates.sort((a, b) => {
    switch (sortKey) {
      case "experience":
        return (
          (b[1].candidate.candidateProfile?.experienceYears ?? 0) -
          (a[1].candidate.candidateProfile?.experienceYears ?? 0)
        );
      case "applications":
        return b[1].apps.length - a[1].apps.length;
      default:
        return a[1].candidate.fullName.localeCompare(b[1].candidate.fullName);
    }
  });

  if (candidates.length === 0 && !nameFilter && !skillFilter && !locationFilter && expMin == null && expMax == null) {
    return (
      <div className="py-16 text-center">
        <Users className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {t("noCandidates")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("noCandidatesDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <span className="text-sm text-muted-foreground">
          {candidates.length} {t("totalCandidates")}
        </span>
      </div>

      <Suspense>
        <CandidateFilters />
      </Suspense>

      {candidates.length === 0 ? (
        <div className="py-12 text-center">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-2 text-sm text-muted-foreground">{t("noResults")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {candidates.map(([candidateId, { candidate, apps }]) => {
            const cp = candidate.candidateProfile;
            const interview = interviewMap.get(candidateId);

            return (
              <div
                key={candidateId}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {/* Name and headline */}
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {candidate.fullName}
                      </h3>
                      {interview?.overallScore != null && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                            interview.overallScore >= 75
                              ? "bg-success/10 text-success"
                              : interview.overallScore >= 50
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-error/10 text-error"
                          }`}
                        >
                          {t("interviewScore")}: {interview.overallScore}%
                        </span>
                      )}
                    </div>
                    {cp?.headline && (
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {cp.headline}
                      </p>
                    )}

                    {/* Meta */}
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {cp?.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {cp.location}
                        </span>
                      )}
                      {cp?.experienceYears != null && (
                        <span>{cp.experienceYears} {t("yearsExp")}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {t("appliedTo")} {apps.length} {apps.length === 1 ? t("job") : t("jobsPlural")}
                      </span>
                    </div>

                    {/* Skills */}
                    {cp?.skills && cp.skills.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {cp.skills.slice(0, 6).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary"
                          >
                            {skill}
                          </span>
                        ))}
                        {cp.skills.length > 6 && (
                          <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
                            +{cp.skills.length - 6}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Applications breakdown */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {apps.map((app) => (
                        <Link
                          key={app.id}
                          href={`/dashboard/jobs/${app.jobId}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-2.5 py-1 text-xs transition-colors hover:bg-accent/80"
                        >
                          <span className="text-muted-foreground">{app.job.title}</span>
                          <ApplicationStatusBadge status={app.status} />
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Right side actions */}
                  <div className="flex flex-col items-end gap-2">
                    {interview ? (
                      <Link
                        href={`/dashboard/interviews/${interview.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-600 transition-colors hover:bg-violet-500/20 dark:text-violet-400"
                      >
                        <Video className="h-3.5 w-3.5" />
                        {interview.status === "evaluated"
                          ? `${t("viewResults")} (${interview.overallScore}%)`
                          : t("viewInterview")}
                      </Link>
                    ) : null}
                    <ScheduleInterviewButton
                      applicationId={apps[0].id}
                      candidateName={candidate.fullName}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
