import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Search } from "lucide-react";
import { listJobsAdmin } from "@/lib/dal/admin";
import { AdminJobRow } from "@/components/admin/admin-job-row";

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("admin");

  const page = Number(params.page) || 1;
  const status = params.status as "draft" | "published" | "closed" | undefined;
  const pageSize = 25;

  const { jobs, totalCount } = await listJobsAdmin({
    keyword: params.keyword,
    status,
    page,
    pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("jobs")}</h1>
        <span className="text-sm text-muted-foreground">
          {totalCount} {t("total")}
        </span>
      </div>

      <form className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="keyword"
            defaultValue={params.keyword ?? ""}
            placeholder={t("searchJobsPlaceholder")}
            className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t("allStatuses")}</option>
          <option value="draft">{t("draft")}</option>
          <option value="published">{t("published")}</option>
          <option value="closed">{t("closed")}</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {t("filter")}
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-accent/30">
            <tr>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("jobTitle")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("employer")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("status")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("applicants")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("posted")}
              </th>
              <th className="px-4 py-3 text-end font-medium text-muted-foreground">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((j) => (
              <AdminJobRow key={j.id} job={j} />
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("noJobs")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          {page > 1 && (
            <Link
              href={{
                pathname: "/admin/jobs",
                query: {
                  ...(params.keyword ? { keyword: params.keyword } : {}),
                  ...(status ? { status } : {}),
                  page: String(page - 1),
                },
              }}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
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
                pathname: "/admin/jobs",
                query: {
                  ...(params.keyword ? { keyword: params.keyword } : {}),
                  ...(status ? { status } : {}),
                  page: String(page + 1),
                },
              }}
              className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
            >
              {t("next")}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
