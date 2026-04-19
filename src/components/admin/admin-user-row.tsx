"use client";

import { useState, useTransition } from "react";
import { useTranslations, useFormatter } from "next-intl";
import { ShieldOff, ShieldCheck, ArrowUpCircle, Check, X } from "lucide-react";
import {
  promoteToAdminAction,
  setUserSuspendedAction,
} from "@/lib/actions/admin";

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  role: "candidate" | "employer" | "admin";
  suspended: boolean;
  createdAt: Date;
  companyName: string | null;
};

export function AdminUserRow({ user }: { user: AdminUser }) {
  const t = useTranslations("admin");
  const fmt = useFormatter();
  const [pending, start] = useTransition();
  const [confirmPromote, setConfirmPromote] = useState(false);

  const roleColor =
    user.role === "admin"
      ? "bg-error/10 text-error"
      : user.role === "employer"
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
        : "bg-primary/10 text-primary";

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{user.fullName}</div>
        {user.companyName && (
          <div className="text-xs text-muted-foreground">{user.companyName}</div>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColor}`}>
          {t(user.role)}
        </span>
      </td>
      <td className="px-4 py-3">
        {user.suspended ? (
          <span className="rounded-full bg-error/10 px-2.5 py-0.5 text-xs font-medium text-error">
            {t("suspended")}
          </span>
        ) : (
          <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
            {t("active")}
          </span>
        )}
      </td>
      <td className="px-4 py-3 text-muted-foreground">
        {fmt.dateTime(new Date(user.createdAt), { dateStyle: "medium" })}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end gap-2">
          {user.role !== "admin" && !confirmPromote && (
            <button
              disabled={pending}
              onClick={() => setConfirmPromote(true)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-60"
            >
              <ArrowUpCircle className="h-3.5 w-3.5" />
              {t("makeAdmin")}
            </button>
          )}
          {user.role !== "admin" && confirmPromote && (
            <div
              role="group"
              aria-label={t("promoteConfirm")}
              className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5 text-xs"
            >
              <span className="px-1 text-foreground">{t("promoteConfirm")}</span>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  start(async () => {
                    await promoteToAdminAction(user.id);
                    setConfirmPromote(false);
                  })
                }
                aria-label={t("confirm")}
                className="inline-flex items-center rounded bg-amber-500 px-1.5 py-0.5 text-white hover:bg-amber-600 disabled:opacity-60"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => setConfirmPromote(false)}
                aria-label={t("cancel")}
                className="inline-flex items-center rounded border border-border bg-background px-1.5 py-0.5 hover:bg-accent disabled:opacity-60"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          <button
            disabled={pending}
            onClick={() =>
              start(async () => {
                await setUserSuspendedAction(user.id, !user.suspended);
              })
            }
            className={`inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-60 ${
              user.suspended ? "text-success" : "text-error"
            }`}
          >
            {user.suspended ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" />
                {t("unsuspend")}
              </>
            ) : (
              <>
                <ShieldOff className="h-3.5 w-3.5" />
                {t("suspend")}
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
