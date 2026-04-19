import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { listUsers } from "@/lib/dal/admin";
import { AdminUserRow } from "@/components/admin/admin-user-row";
import { Search } from "lucide-react";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const t = await getTranslations("admin");

  const page = Number(params.page) || 1;
  const role = (params.role as "candidate" | "employer" | "admin" | undefined);
  const pageSize = 25;

  const { users, totalCount } = await listUsers({
    keyword: params.keyword,
    role,
    page,
    pageSize,
  });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{t("users")}</h1>
        <span className="text-sm text-muted-foreground">
          {totalCount} {t("total")}
        </span>
      </div>

      {/* Search + filters */}
      <form className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            name="keyword"
            defaultValue={params.keyword ?? ""}
            placeholder={t("searchUsersPlaceholder")}
            className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <select
          name="role"
          defaultValue={params.role ?? ""}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
        >
          <option value="">{t("allRoles")}</option>
          <option value="candidate">{t("candidate")}</option>
          <option value="employer">{t("employer")}</option>
          <option value="admin">{t("admin")}</option>
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
          <thead className="border-b border-border bg-accent/30 text-start">
            <tr>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("name")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("email")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("role")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("status")}
              </th>
              <th className="px-4 py-3 text-start font-medium text-muted-foreground">
                {t("joined")}
              </th>
              <th className="px-4 py-3 text-end font-medium text-muted-foreground">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <AdminUserRow key={u.id} user={u} />
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  {t("noUsers")}
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
                pathname: "/admin/users",
                query: {
                  ...(params.keyword ? { keyword: params.keyword } : {}),
                  ...(role ? { role } : {}),
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
                pathname: "/admin/users",
                query: {
                  ...(params.keyword ? { keyword: params.keyword } : {}),
                  ...(role ? { role } : {}),
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
