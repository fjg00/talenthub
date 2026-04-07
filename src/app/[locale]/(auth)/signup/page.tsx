"use client";

import { useState, useActionState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, User, Building2, Loader2, CheckCircle } from "lucide-react";
import { signupAction, oauthAction, type AuthState } from "@/lib/actions/auth";

export default function SignupPage() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const [role, setRole] = useState<"candidate" | "employer">("candidate");

  const [state, formAction, isPending] = useActionState<AuthState, FormData>(
    signupAction,
    {}
  );

  if (state.success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-border bg-card p-8 shadow-lg text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-success" />
          <h2 className="mt-4 text-xl font-bold text-foreground">{t("checkEmail")}</h2>
          <Link
            href="/login"
            className="mt-6 inline-block rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {tc("login")}
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="rounded-2xl border border-border bg-card p-8 shadow-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">{t("signupTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("signupSubtitle")}</p>
        </div>

        {state.error && (
          <div className="mb-4 rounded-xl border border-error/20 bg-error/10 p-3 text-center text-sm text-error">
            {t(state.error)}
          </div>
        )}

        {/* Role Toggle */}
        <div className="mb-6 flex rounded-xl border border-border bg-background p-1">
          <button
            type="button"
            onClick={() => setRole("candidate")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              role === "candidate"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("iAmCandidate")}
          </button>
          <button
            type="button"
            onClick={() => setRole("employer")}
            className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${
              role === "employer"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("iAmEmployer")}
          </button>
        </div>

        {/* Social Logins */}
        <button
          onClick={() => oauthAction("linkedin_oidc")}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-background py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
        >
          <svg className="h-5 w-5 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          {t("continueWithLinkedIn")}
        </button>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-sm text-muted-foreground">{tc("or")}</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {/* Form */}
        <form className="space-y-4" action={formAction}>
          <input type="hidden" name="role" value={role} />

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("fullName")}
            </label>
            <div className="relative">
              <User className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="fullName"
                type="text"
                required
                className="w-full rounded-xl border border-border bg-background py-3 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {role === "employer" && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                {t("companyName")}
              </label>
              <div className="relative">
                <Building2 className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  name="companyName"
                  type="text"
                  className="w-full rounded-xl border border-border bg-background py-3 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">{t("email")}</label>
            <div className="relative">
              <Mail className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="email"
                type="email"
                placeholder="name@company.com"
                required
                className="w-full rounded-xl border border-border bg-background py-3 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">
              {t("password")}
            </label>
            <div className="relative">
              <Lock className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full rounded-xl border border-border bg-background py-3 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex items-start gap-2">
            <input
              type="checkbox"
              id="terms"
              name="terms"
              required
              className="mt-1 h-4 w-4 rounded border-border"
            />
            <label htmlFor="terms" className="text-sm text-muted-foreground">
              {t("agreeTerms")}
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("loading") : tc("signup")}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            {tc("login")}
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
