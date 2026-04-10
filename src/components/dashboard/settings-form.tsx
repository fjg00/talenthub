"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  User,
  Lock,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import {
  updateNameAction,
  changePasswordAction,
  deleteAccountAction,
} from "@/lib/actions/settings";

interface SettingsFormProps {
  fullName: string;
  email: string;
  role: string;
}

export function SettingsForm({ fullName, email, role }: SettingsFormProps) {
  const t = useTranslations("settings");

  return (
    <div className="space-y-6">
      <AccountSection fullName={fullName} email={email} role={role} />
      <PasswordSection />
      <DangerZone />
    </div>
  );
}

function AccountSection({
  fullName: initialName,
  email,
  role,
}: {
  fullName: string;
  email: string;
  role: string;
}) {
  const t = useTranslations("settings");
  const [name, setName] = useState(initialName);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function handleSave() {
    setStatus("idle");
    startTransition(async () => {
      const res = await updateNameAction(name);
      if (res.success) {
        setStatus("success");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setError(res.error ?? "");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-foreground">
        <User className="h-5 w-5" />
        <h2 className="text-lg font-semibold">{t("account")}</h2>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            {t("email")}
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="mt-1 w-full rounded-lg border border-border bg-accent px-3 py-2 text-sm text-muted-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">{t("emailCantChange")}</p>
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            {t("role")}
          </label>
          <input
            type="text"
            value={role === "employer" ? t("employer") : t("candidate")}
            disabled
            className="mt-1 w-full rounded-lg border border-border bg-accent px-3 py-2 text-sm text-muted-foreground capitalize"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-foreground">
            {t("fullName")}
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending || name === initialName}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "success" ? (
              <Check className="h-4 w-4" />
            ) : null}
            {status === "success" ? t("saved") : t("saveName")}
          </button>
          {status === "error" && (
            <span className="text-xs text-error">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function PasswordSection() {
  const t = useTranslations("settings");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [error, setError] = useState("");

  function handleChange() {
    if (newPw !== confirmPw) {
      setStatus("error");
      setError(t("passwordsNoMatch"));
      return;
    }
    setStatus("idle");
    startTransition(async () => {
      const res = await changePasswordAction(currentPw, newPw);
      if (res.success) {
        setStatus("success");
        setCurrentPw("");
        setNewPw("");
        setConfirmPw("");
        setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setError(res.error ?? "");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-foreground">
        <Lock className="h-5 w-5" />
        <h2 className="text-lg font-semibold">{t("changePassword")}</h2>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <label className="text-sm font-medium text-foreground">
            {t("currentPassword")}
          </label>
          <input
            type="password"
            value={currentPw}
            onChange={(e) => setCurrentPw(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">
            {t("newPassword")}
          </label>
          <input
            type="password"
            value={newPw}
            onChange={(e) => setNewPw(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground">
            {t("confirmPassword")}
          </label>
          <input
            type="password"
            value={confirmPw}
            onChange={(e) => setConfirmPw(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleChange}
            disabled={isPending || !currentPw || !newPw || !confirmPw}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : status === "success" ? (
              <Check className="h-4 w-4" />
            ) : null}
            {status === "success" ? t("passwordChanged") : t("updatePassword")}
          </button>
          {status === "error" && (
            <span className="text-xs text-error">{error}</span>
          )}
        </div>
      </div>
    </div>
  );
}

function DangerZone() {
  const t = useTranslations("settings");
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteAccountAction();
    });
  }

  return (
    <div className="rounded-2xl border border-error/20 bg-error/5 p-6">
      <div className="flex items-center gap-2 text-error">
        <AlertTriangle className="h-5 w-5" />
        <h2 className="text-lg font-semibold">{t("dangerZone")}</h2>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("deleteAccountDesc")}
      </p>
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-lg border border-error/30 px-4 py-2 text-sm font-medium text-error transition-colors hover:bg-error/10"
        >
          {t("deleteAccount")}
        </button>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("confirmDelete")}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            {t("cancel")}
          </button>
        </div>
      )}
    </div>
  );
}
