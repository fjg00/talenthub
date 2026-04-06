"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  Video,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");

  const stats = [
    { label: "Active Jobs", value: "12", icon: Briefcase, change: "+3 this week" },
    { label: "Total Candidates", value: "284", icon: Users, change: "+47 this week" },
    { label: "Interviews", value: "8", icon: Video, change: "3 scheduled" },
    { label: "Hire Rate", value: "68%", icon: TrendingUp, change: "+5% vs last month" },
  ];

  const recentActivity = [
    { text: "New application from Ahmed Hassan for Senior Developer", time: "2 hours ago", icon: Users },
    { text: "Interview completed for Sara Al-Rashid", time: "5 hours ago", icon: Video },
    { text: "Job posting 'Product Manager' received 23 new applicants", time: "1 day ago", icon: Briefcase },
    { text: "Candidate Fatima K. was hired for UX Designer role", time: "2 days ago", icon: CheckCircle2 },
  ];

  return (
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-primary/10 p-2">
                <stat.icon className="h-5 w-5 text-primary" />
              </div>
              <ArrowUpRight className="h-4 w-4 text-success" />
            </div>
            <div className="mt-4 text-3xl font-bold text-foreground">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="mt-1 text-xs text-success">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity + Coming Soon */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5">
                  <item.icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{item.text}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* AI Insights placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border bg-card p-6"
        >
          <h2 className="mb-4 text-lg font-semibold text-foreground">AI Insights</h2>
          <div className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-primary/5 to-primary/10">
            <div className="text-center">
              <TrendingUp className="mx-auto h-12 w-12 text-primary/30" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">{tc("comingSoon")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                AI-powered hiring insights and recommendations
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
