import { Link } from "@/i18n/navigation";
import { Building2, MapPin, Briefcase } from "lucide-react";
import { getCompaniesWithOpenJobs } from "@/lib/dal/companies";
import { getTranslations } from "next-intl/server";
import { CompanySearch } from "@/components/public/company-search";
import Image from "next/image";

export async function generateMetadata() {
  const t = await getTranslations("companies");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("companies");

  const page = Number(params.page) || 1;
  const pageSize = 24;

  const { companies, totalCount } = await getCompaniesWithOpenJobs({
    keyword: params.keyword,
    page,
    pageSize,
  });

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <CompanySearch defaultKeyword={params.keyword ?? ""} />

      {companies.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
          <Building2 className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">{t("noResults")}</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((c) => (
              <Link
                key={c.employerId}
                href={`/companies/${c.employerId}`}
                className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary"
              >
                <div className="flex items-start gap-3">
                  {c.logoUrl ? (
                    <Image
                      src={c.logoUrl}
                      alt={c.companyName}
                      width={48}
                      height={48}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold text-foreground group-hover:text-primary">
                      {c.companyName}
                    </h2>
                    {c.industry && (
                      <p className="truncate text-xs text-muted-foreground">
                        {c.industry}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  {c.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {c.location}
                    </span>
                  )}
                  {c.companySize && <span>· {c.companySize}</span>}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary">
                  <Briefcase className="h-3.5 w-3.5" />
                  {t("openJobs", { count: c.openJobs })}
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              {page > 1 && (
                <Link
                  href={{
                    pathname: "/companies",
                    query: {
                      ...(params.keyword ? { keyword: params.keyword } : {}),
                      page: String(page - 1),
                    },
                  }}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {t("previous")}
                </Link>
              )}
              <span className="px-2 text-sm text-muted-foreground">
                {t("pageOf", { page, total: totalPages })}
              </span>
              {page < totalPages && (
                <Link
                  href={{
                    pathname: "/companies",
                    query: {
                      ...(params.keyword ? { keyword: params.keyword } : {}),
                      page: String(page + 1),
                    },
                  }}
                  className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  {t("next")}
                </Link>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
