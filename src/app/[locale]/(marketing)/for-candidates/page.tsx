"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  FileText,
  Brain,
  Target,
  Eye,
  Sparkles,
  Trophy,
  ArrowRight,
  Upload,
  CheckCircle2,
} from "lucide-react";

export default function ForCandidatesPage() {
  const t = useTranslations("forCandidates");

  const benefits = [
    { icon: FileText, title: t("benefit1Title"), desc: t("benefit1Desc") },
    { icon: Brain, title: t("benefit2Title"), desc: t("benefit2Desc") },
    { icon: Target, title: t("benefit3Title"), desc: t("benefit3Desc") },
    { icon: Eye, title: t("benefit4Title"), desc: t("benefit4Desc") },
    { icon: Sparkles, title: t("benefit5Title"), desc: t("benefit5Desc") },
    { icon: Trophy, title: t("benefit6Title"), desc: t("benefit6Desc") },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-transparent py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">{t("subtitle")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
              >
                {t("ctaTitle")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-8 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <b.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{b.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{b.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How to get started */}
      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 rounded-2xl border border-border bg-background p-8 lg:order-1"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4">
                  <Upload className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Upload CV</div>
                    <div className="text-sm text-muted-foreground">PDF, DOCX supported</div>
                  </div>
                  <CheckCircle2 className="ms-auto h-5 w-5 text-success" />
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4">
                  <Brain className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">AI Analysis</div>
                    <div className="text-sm text-muted-foreground">Skills extracted automatically</div>
                  </div>
                  <CheckCircle2 className="ms-auto h-5 w-5 text-success" />
                </div>
                <div className="flex items-center gap-4 rounded-xl bg-primary/5 p-4">
                  <Target className="h-8 w-8 text-primary" />
                  <div>
                    <div className="font-semibold text-foreground">Matched!</div>
                    <div className="text-sm text-muted-foreground">3 jobs match your profile</div>
                  </div>
                  <CheckCircle2 className="ms-auto h-5 w-5 text-success" />
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <h2 className="text-3xl font-bold text-foreground">
                From CV upload to matched in minutes
              </h2>
              <p className="mt-4 text-muted-foreground">
                No more endless job searching. Upload your CV once, and our AI does the rest —
                finding opportunities that match your skills and career goals.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "AI extracts your skills automatically",
                  "Get matched with relevant opportunities",
                  "Track every application in real-time",
                  "Improve your profile with AI suggestions",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-foreground">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold text-foreground">{t("ctaTitle")}</h2>
            <p className="mt-4 text-muted-foreground">{t("ctaSubtitle")}</p>
            <Link
              href="/signup"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
            >
              {t("ctaTitle")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
