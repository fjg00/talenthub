import { getPublishedJobs } from "@/lib/dal/jobs";
import { PublicJobSearch } from "@/components/public/public-job-search";
import { PublicJobCard } from "@/components/public/public-job-card";
import { Link } from "@/i18n/navigation";
import { Briefcase } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/dal/profiles";

export async function generateMetadata() {
  const t = await getTranslations("publicJobs");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PublicJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("publicJobs");

  const page = Number(params.page) || 1;
  const pageSize = 12;
  const skillsParam = params.skills?.split(",").filter(Boolean);

  // Hide already-applied jobs for signed-in candidates
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let excludeAppliedByCandidateId: string | undefined;
  if (user) {
    const profile = await getProfile(user.id);
    if (profile?.role === "candidate") excludeAppliedByCandidateId = user.id;
  }

  const { jobs, totalCount } = await getPublishedJobs({
    keyword: params.keyword,
    jobType: params.jobType,
    experienceLevel: params.experienceLevel,
    location: params.location,
    salaryMin: params.salaryMin ? Number(params.salaryMin) : undefined,
    salaryMax: params.salaryMax ? Number(params.salaryMax) : undefined,
    currency: params.currency,
    skills: skillsParam,
    excludeAppliedByCandidateId,
    page,
    pageSize,
  });

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Page header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("subtitle", { count: totalCount })}
        </p>
      </div>

      {/* Search & Filters */}
      <PublicJobSearch />

      {/* Results */}
      {jobs.length === 0 ? (
        <div className="py-16 text-center">
          <Briefcase className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <h2 className="mt-4 text-lg font-semibold text-foreground">
            {t("noResults")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noResultsDesc")}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <PublicJobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {page > 1 && (
            <PaginationLink page={page - 1} params={params} label={t("previous")} />
          )}
          <span className="text-sm text-muted-foreground">
            {t("page")} {page} {t("of")} {totalPages}
          </span>
          {page < totalPages && (
            <PaginationLink page={page + 1} params={params} label={t("next")} />
          )}
        </div>
      )}

      {/* CTA */}
      <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center">
        <h3 className="text-xl font-bold text-foreground">{t("ctaTitle")}</h3>
        <p className="mt-2 text-muted-foreground">{t("ctaSubtitle")}</p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("ctaSignUp")}
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            {t("ctaLogin")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function PaginationLink({
  page,
  params,
  label,
}: {
  page: number;
  params: Record<string, string | undefined>;
  label: string;
}) {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && key !== "page") searchParams.set(key, value);
  }
  searchParams.set("page", String(page));

  return (
    <a
      href={`?${searchParams.toString()}`}
      className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-accent"
    >
      {label}
    </a>
  );
}
