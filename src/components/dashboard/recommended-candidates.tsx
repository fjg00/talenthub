import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import {
  User,
  MapPin,
  Briefcase,
  Sparkles,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { InviteToApplyButton } from "./invite-to-apply-button";

interface RecommendedCandidate {
  candidate: {
    userId: string;
    headline: string | null;
    location: string | null;
    experienceYears: number | null;
    skills: string[] | null;
    availabilityStatus: string | null;
    profile: {
      fullName: string;
    };
  };
  matchPct: number;
  matchedSkills: string[];
  missingSkills: string[];
}

export async function RecommendedCandidates({
  candidates,
  jobId,
}: {
  candidates: RecommendedCandidate[];
  jobId: string;
}) {
  const t = await getTranslations("jobs");

  if (candidates.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("recommendedCandidates")}
        </h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        {t("recommendedCandidatesDesc")}
      </p>

      <div className="space-y-3">
        {candidates.map(({ candidate, matchPct, matchedSkills }) => {
          const matchColor =
            matchPct >= 75
              ? "text-success bg-success/10"
              : matchPct >= 40
                ? "text-amber-600 bg-amber-500/10 dark:text-amber-400"
                : "text-muted-foreground bg-accent";

          const availabilityColor =
            candidate.availabilityStatus === "open"
              ? "text-success bg-success/10"
              : "text-amber-600 bg-amber-500/10 dark:text-amber-400";

          const availabilityLabel =
            candidate.availabilityStatus === "open"
              ? t("openToWork")
              : t("openToOffers");

          return (
            <div
              key={candidate.userId}
              className="rounded-xl border border-border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                      <User className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">
                        {candidate.profile.fullName}
                      </p>
                      {candidate.headline && (
                        <p className="truncate text-xs text-muted-foreground">
                          {candidate.headline}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {candidate.location && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="h-3 w-3" /> {candidate.location}
                      </span>
                    )}
                    {candidate.experienceYears != null && (
                      <span className="flex items-center gap-0.5">
                        <Briefcase className="h-3 w-3" />{" "}
                        {candidate.experienceYears} {t("yearsExp")}
                      </span>
                    )}
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${availabilityColor}`}
                    >
                      {availabilityLabel}
                    </span>
                  </div>
                </div>

                {matchPct > 0 && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${matchColor}`}
                  >
                    {matchPct}%
                  </span>
                )}
              </div>

              {matchedSkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {matchedSkills.slice(0, 5).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                  {matchedSkills.length > 5 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
                      +{matchedSkills.length - 5}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-3 flex items-center justify-between">
                {matchPct >= 60 && (
                  <div className="flex items-center gap-1 text-[10px] font-medium text-success">
                    <TrendingUp className="h-3 w-3" />
                    {t("strongMatch")}
                  </div>
                )}
                <div className="ms-auto">
                  <InviteToApplyButton
                    jobId={jobId}
                    candidateId={candidate.userId}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        href="/dashboard/candidates"
        className="mt-4 flex items-center justify-center gap-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {t("viewAllCandidates")}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
