"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";
import { usePathname } from "@/i18n/navigation";
import { Briefcase } from "lucide-react";
import { JobCard } from "./job-card";

interface Job {
  id: string;
  title: string;
  description: string;
  location: string | null;
  jobType: string | null;
  experienceLevel: string | null;
  skills: string[] | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  createdAt: Date;
  employer: {
    fullName: string;
    employerProfile: {
      companyName: string | null;
      industry: string | null;
    } | null;
  };
}

interface CandidateJobListProps {
  jobs: Job[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export function CandidateJobList({
  jobs,
  totalCount,
  page,
  pageSize,
}: CandidateJobListProps) {
  const t = useTranslations("jobs");
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const totalPages = Math.ceil(totalCount / pageSize);

  function pageUrl(p: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    return `${pathname}?${params.toString()}`;
  }

  if (jobs.length === 0) {
    return (
      <div className="py-16 text-center">
        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/30" />
        <h2 className="mt-4 text-lg font-semibold text-foreground">
          {t("noResults")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("noResultsDesc")}
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-4">
        {jobs.map((job, i) => (
          <JobCard key={job.id} job={job} index={i} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={pageUrl(page - 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              {t("previous")}
            </Link>
          )}
          <span className="text-sm text-muted-foreground">
            {t("page")} {page} {t("of")} {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={pageUrl(page + 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
            >
              {t("next")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
