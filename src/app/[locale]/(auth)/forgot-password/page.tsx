"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { forgotPasswordAction } from "@/lib/actions/settings";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await forgotPasswordAction(email);
      if (res.success) {
        setSent(true);
      } else {
        setError(res.error ?? "Something went wrong");
      }
    });
  }

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle className="mx-auto h-12 w-12 text-success" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          {t("checkEmail")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("resetLinkSent")}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("backToLogin")}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backToLogin")}
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-foreground">
        {t("forgotPassword")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {t("forgotPasswordDesc")}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            {t("email")}
          </label>
          <div className="relative mt-1">
            <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@company.com"
              className="w-full rounded-xl border border-border bg-background py-2.5 ps-10 pe-4 text-sm text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-error">{error}</p>}

        <button
          type="submit"
          disabled={isPending || !email}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {t("sendResetLink")}
        </button>
      </form>
    </div>
  );
}
