"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { MapPin, Clock, Building2 } from "lucide-react";

interface PublicJobCardProps {
  job: {
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
  };
}

export function PublicJobCard({ job }: PublicJobCardProps) {
  const t = useTranslations("jobs");

  const companyName =
    job.employer.employerProfile?.companyName ?? job.employer.fullName;

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/30 hover:shadow-lg"
    >
      <div className="flex-1">
        <h3 className="text-base font-semibold text-foreground line-clamp-1">
          {job.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{companyName}</span>
        </div>

        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
          {job.description}
        </p>

        {job.salaryMin && (
          <div className="mt-3 text-sm font-medium text-foreground">
            {job.salaryMin.toLocaleString()}
            {job.salaryMax ? `–${job.salaryMax.toLocaleString()}` : "+"}
            <span className="ms-1 text-xs text-muted-foreground">
              {job.currency}
            </span>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {job.location && (
          <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-0.5 text-xs text-foreground">
            <MapPin className="h-3 w-3" />
            {job.location}
          </span>
        )}
        {job.jobType && (
          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary">
            {t(job.jobType)}
          </span>
        )}
        {job.experienceLevel && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs text-foreground">
            {t(job.experienceLevel)}
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          {new Date(job.createdAt).toLocaleDateString("en-CA")}
        </span>
      </div>

      {job.skills && job.skills.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {job.skills.slice(0, 4).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              +{job.skills.length - 4}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}
