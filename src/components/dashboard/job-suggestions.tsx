import { Link } from "@/i18n/navigation";
import { getTranslations } from "next-intl/server";
import { MapPin, Building2, Sparkles, TrendingUp, ChevronRight } from "lucide-react";

interface SuggestedJob {
  job: {
    id: string;
    title: string;
    location: string | null;
    jobType: string | null;
    skills: string[] | null;
    employer: {
      fullName: string;
      employerProfile: { companyName: string | null } | null;
    };
  };
  matchPct: number;
  matchedSkills: string[];
}

export async function JobSuggestionsSidebar({
  suggestions,
}: {
  suggestions: SuggestedJob[];
}) {
  const t = await getTranslations("jobs");

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {t("suggestedForYou")}
        </h2>
      </div>

      <div className="space-y-3">
        {suggestions.map(({ job, matchPct, matchedSkills }) => {
          const companyName =
            job.employer.employerProfile?.companyName ?? job.employer.fullName;

          const matchColor =
            matchPct >= 75
              ? "text-success bg-success/10"
              : matchPct >= 40
                ? "text-amber-600 bg-amber-500/10 dark:text-amber-400"
                : "text-muted-foreground bg-accent";

          return (
            <Link
              key={job.id}
              href={`/dashboard/jobs/${job.id}`}
              className="group block rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-foreground group-hover:text-primary">
                    {job.title}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" />
                    {companyName}
                  </p>
                  {job.location && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {job.location}
                    </p>
                  )}
                </div>
                {matchPct > 0 && (
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${matchColor}`}
                  >
                    {matchPct}%
                  </span>
                )}
              </div>

              {matchedSkills.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {matchedSkills.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary"
                    >
                      {skill}
                    </span>
                  ))}
                  {matchedSkills.length > 4 && (
                    <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] text-muted-foreground">
                      +{matchedSkills.length - 4}
                    </span>
                  )}
                </div>
              )}

              {matchPct >= 60 && (
                <div className="mt-2 flex items-center gap-1 text-[10px] font-medium text-success">
                  <TrendingUp className="h-3 w-3" />
                  {t("strongMatch")}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <Link
        href="/dashboard/jobs"
        className="flex items-center justify-center gap-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        {t("exploreMore")}
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
