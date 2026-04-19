import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import {
  Building2,
  MapPin,
  Globe,
  Users,
  Briefcase,
  ArrowRight,
} from "lucide-react";
import Image from "next/image";
import { getPublicCompany } from "@/lib/dal/companies";
import { getTranslations } from "next-intl/server";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ employerId: string }>;
}) {
  const { employerId } = await params;
  const company = await getPublicCompany(employerId);
  if (!company) return { title: "Company not found" };
  const description =
    company.companyDescription ??
    `${company.companyName} is hiring on TalentHub.`;
  return {
    title: company.companyName,
    description,
    openGraph: {
      title: company.companyName,
      description,
      type: "website",
      images: company.logoUrl ? [company.logoUrl] : undefined,
    },
  };
}

export default async function CompanyPage({
  params,
}: {
  params: Promise<{ employerId: string }>;
}) {
  const { employerId } = await params;
  const company = await getPublicCompany(employerId);
  if (!company) notFound();

  const t = await getTranslations("companies");
  const tj = await getTranslations("jobs");

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {/* Header */}
      <section className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          {company.logoUrl ? (
            <Image
              src={company.logoUrl}
              alt={company.companyName}
              width={80}
              height={80}
              className="h-20 w-20 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
              <Building2 className="h-10 w-10 text-primary" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              {company.companyName}
            </h1>
            {company.industry && (
              <p className="mt-1 text-sm text-muted-foreground">
                {company.industry}
              </p>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
              {company.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {company.location}
                </span>
              )}
              {company.companySize && (
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4" />
                  {t("employees", { count: company.companySize })}
                </span>
              )}
              {company.companyWebsite && (
                <a
                  href={company.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {t("website")}
                </a>
              )}
            </div>
          </div>
        </div>

        {company.companyDescription && (
          <div className="mt-6 border-t border-border pt-6">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t("about")}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {company.companyDescription}
            </p>
          </div>
        )}
      </section>

      {/* Open jobs */}
      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Briefcase className="h-5 w-5" />
            {t("openJobsTitle")}
          </h2>
          <span className="text-sm text-muted-foreground">
            {t("openJobs", { count: company.openJobs.length })}
          </span>
        </div>

        {company.openJobs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("noOpenJobs")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {company.openJobs.map((job) => (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="group flex items-start justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-semibold text-foreground group-hover:text-primary">
                    {job.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {job.location && <span>{job.location}</span>}
                    {job.jobType && <span>· {tj(job.jobType)}</span>}
                    {job.experienceLevel && (
                      <span>· {tj(job.experienceLevel)}</span>
                    )}
                    {job.salaryMin != null && (
                      <span>
                        · {job.salaryMin.toLocaleString()}
                        {job.salaryMax
                          ? `–${job.salaryMax.toLocaleString()}`
                          : "+"}{" "}
                        {job.currency}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
