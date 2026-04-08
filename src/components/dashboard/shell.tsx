"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { logoutAction } from "@/lib/actions/auth";
import {
  Brain,
  LayoutDashboard,
  Briefcase,
  Users,
  Video,
  UserCircle,
  Settings,
  BarChart3,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";

const employerLinks = [
  { icon: LayoutDashboard, key: "overview", href: "/dashboard" },
  { icon: Briefcase, key: "jobs", href: "/dashboard/jobs" },
  { icon: Users, key: "candidates", href: "/dashboard/candidates" },
  { icon: Video, key: "interviews", href: "/dashboard/interviews" },
  { icon: BarChart3, key: "analytics", href: "/dashboard/analytics" },
  { icon: UserCircle, key: "profile", href: "/dashboard/profile" },
  { icon: Settings, key: "settings", href: "/dashboard/settings" },
];

const candidateLinks = [
  { icon: LayoutDashboard, key: "overview", href: "/dashboard" },
  { icon: Briefcase, key: "jobs", href: "/dashboard/jobs" },
  { icon: FileText, key: "applications", href: "/dashboard/applications" },
  { icon: Video, key: "interviews", href: "/dashboard/interviews" },
  { icon: UserCircle, key: "profile", href: "/dashboard/profile" },
  { icon: Settings, key: "settings", href: "/dashboard/settings" },
];

interface DashboardShellProps {
  userName: string;
  userRole: "candidate" | "employer";
  children: React.ReactNode;
}

export function DashboardShell({ userName, userRole, children }: DashboardShellProps) {
  const t = useTranslations("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const links = userRole === "employer" ? employerLinks : candidateLinks;

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 start-0 z-50 w-64 transform border-e border-border bg-card transition-transform duration-200 lg:relative lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold text-foreground">TalentHub</span>
        </div>
        <nav className="mt-4 space-y-1 px-3">
          {links.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <link.icon className="h-5 w-5" />
              {t(link.key)}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 start-0 end-0 px-3">
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-error transition-colors hover:bg-error/10"
            >
              <LogOut className="h-5 w-5" />
              {t("logout")}
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md sm:px-6">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-lg font-semibold text-foreground">
            {t("welcome")}, {userName}
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
