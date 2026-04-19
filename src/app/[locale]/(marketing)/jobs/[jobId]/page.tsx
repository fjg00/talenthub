import { notFound } from "next/navigation";
import { getJobById, incrementJobViews } from "@/lib/dal/jobs";
import { getTranslations } from "next-intl/server";
import { MapPin, Building2, Clock, Coins, ArrowRight, Briefcase } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { SocialShare } from "@/components/public/social-share";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await getJobById(jobId);
  if (!job) return { title: "Job Not Found" };

  const companyName =
    job.employer.employerProfile?.companyName ?? job.employer.fullName;

  return {
    title: `${job.title} at ${companyName}`,
    description: job.description.slice(0, 160),
    openGraph: {
      title: `${job.title} at ${companyName}`,
      description: job.description.slice(0, 160),
      type: "website",
    },
  };
}

export default async function PublicJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string; locale: string }>;
}) {
  const { jobId, locale } = await params;
  const t = await getTranslations("publicJobs");
  const tj = await getTranslations("jobs");

  const job = await getJobById(jobId);
  if (!job || job.status !== "published") notFound();

  // Increment view count
  incrementJobViews(jobId);

  const companyName =
    job.employer.employerProfile?.companyName ?? job.employer.fullName;
  const industry = job.employer.employerProfile?.industry;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://talenthub.com";
  const jobUrl = `${baseUrl}/${locale}/jobs/${jobId}`;
  const shareTitle = `${job.title} at ${companyName} - TalentHub`;

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/jobs"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Briefcase className="h-3.5 w-3.5" />
        {t("backToJobs")}
      </Link>

      {/* Job header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{job.title}</h1>
        <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Building2 className="h-4 w-4" /> {companyName}
          </span>
          {job.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" /> {job.location}
            </span>
          )}
          {job.jobType && (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
              {tj(job.jobType)}
            </span>
          )}
          {job.experienceLevel && (
            <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-foreground">
              {tj(job.experienceLevel)}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Salary */}
          {job.salaryMin && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Coins className="h-4 w-4" />
                {tj("salaryRange")}
              </div>
              <div className="mt-1 text-2xl font-bold text-foreground">
                {job.salaryMin.toLocaleString()}
                {job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : "+"}{" "}
                <span className="text-base text-muted-foreground">{job.currency}</span>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="mb-3 text-lg font-semibold text-foreground">
              {tj("description")}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
              {job.description}
            </p>
          </div>

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                {tj("skills")}
              </h2>
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
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Apply CTA */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <h3 className="text-lg font-semibold text-foreground">
              {t("applyTitle")}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("applyDescription")}
            </p>
            <Link
              href="/signup"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("signUpToApply")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              {t("loginToApply")}
            </Link>
          </div>

          {/* Company info */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground">
              {tj("companyInfo")}
            </h3>
            <div className="mt-3 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 shrink-0" />
                {companyName}
              </div>
              {industry && (
                <div className="text-xs text-muted-foreground">{industry}</div>
              )}
            </div>
            <Link
              href={`/companies/${job.employer.id}`}
              className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {tj("viewCompany")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Deadline */}
          {job.deadline && (
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {tj("deadlineOn")} {new Date(job.deadline).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Social Share */}
          <SocialShare title={shareTitle} url={jobUrl} />
        </div>
      </div>
    </section>
  );
}
