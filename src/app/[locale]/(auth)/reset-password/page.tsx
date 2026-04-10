"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Lock, Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { resetPasswordAction } from "@/lib/actions/settings";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPw !== confirmPw) {
      setError(t("passwordsNoMatch"));
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await resetPasswordAction(newPw);
      if (res.success) {
        setDone(true);
      } else {
        setError(res.error ?? "Something went wrong");
      }
    });
  }

  if (done) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-success" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {t("passwordReset")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("passwordResetDesc")}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("login")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">
        {t("resetPassword")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("resetPasswordDesc")}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            {t("newPassword")}
          </label>
          <div className="relative mt-1">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-background py-2.5 ps-10 pe-4 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            {t("confirmPassword")}
          </label>
          <div className="relative mt-1">
            <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-border bg-background py-2.5 ps-10 pe-4 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !newPw || !confirmPw}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("resetPassword")}
        </button>
      </form>
    </div>
  );
}
