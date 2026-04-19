"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { logoutAction } from "@/lib/actions/auth";
import {
  Shield,
  LayoutDashboard,
  Users,
  Briefcase,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const links = [
  { icon: LayoutDashboard, key: "overview", href: "/admin" },
  { icon: Users, key: "users", href: "/admin/users" },
  { icon: Briefcase, key: "jobs", href: "/admin/jobs" },
];

export function AdminShell({
  userName,
  children,
}: {
  userName: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <aside
        className={`fixed inset-y-0 start-0 z-50 w-64 transform border-e border-border bg-card transition-transform duration-200 lg:relative lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-error/10">
            <Shield className="h-5 w-5 text-error" />
          </div>
          <span className="text-lg font-bold text-foreground">{t("panel")}</span>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {links.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <l.icon className="h-5 w-5" />
              {t(l.key)}
            </Link>
          ))}
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <LayoutDashboard className="h-5 w-5" />
            {t("backToDashboard")}
          </Link>
        </nav>
        <div className="absolute bottom-4 start-0 end-0 px-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error hover:bg-error/10"
            >
              <LogOut className="h-5 w-5" />
              {t("logout")}
            </button>
          </form>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setOpen(!open)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border lg:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-lg font-semibold text-foreground">
            {t("hi")}, {userName}
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
