"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  Users,
  Globe,
  Shield,
  BarChart3,
  ArrowRight,
  Play,
  Star,
  ChevronRight,
  Search,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

function AnimatedCounter({ value, label }: { value: string; label: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="text-center"
    >
      <div className="text-3xl font-bold text-primary sm:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
    </motion.div>
  );
}

export default function LandingPage() {
  const t = useTranslations("landing");
  const tc = useTranslations("common");

  const features = [
    { icon: Brain, title: t("feature1Title"), desc: t("feature1Desc") },
    { icon: Zap, title: t("feature2Title"), desc: t("feature2Desc") },
    { icon: Users, title: t("feature3Title"), desc: t("feature3Desc") },
    { icon: Globe, title: t("feature4Title"), desc: t("feature4Desc") },
    { icon: BarChart3, title: t("feature5Title"), desc: t("feature5Desc") },
    { icon: Shield, title: t("feature6Title"), desc: t("feature6Desc") },
  ];

  const steps = [
    { num: "01", title: t("step1Title"), desc: t("step1Desc") },
    { num: "02", title: t("step2Title"), desc: t("step2Desc") },
    { num: "03", title: t("step3Title"), desc: t("step3Desc") },
  ];

  const testimonials = [
    {
      quote: t("testimonial1Quote"),
      name: t("testimonial1Name"),
      role: t("testimonial1Role"),
    },
    {
      quote: t("testimonial2Quote"),
      name: t("testimonial2Name"),
      role: t("testimonial2Role"),
    },
    {
      quote: t("testimonial3Quote"),
      name: t("testimonial3Name"),
      role: t("testimonial3Role"),
    },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 end-0 w-1/2 bg-gradient-to-s from-primary/5 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-3xl text-center"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              AI-Powered Hiring Platform
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("heroTitle")}{" "}
              <span className="bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                {t("heroTitleHighlight")}
              </span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground sm:text-xl">
              {t("heroSubtitle")}
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
              >
                {t("heroCTA")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-accent">
                <Play className="h-4 w-4" />
                {t("heroSecondaryCTA")}
              </button>
            </div>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="mt-20 text-center"
          >
            <p className="text-sm font-medium text-muted-foreground">{t("trustedBy")}</p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-8 opacity-40">
              {["TechCorp", "Innovate", "Gulf Group", "FinanceX", "BuildCo"].map((name) => (
                <div key={name} className="text-lg font-bold text-foreground">
                  {name}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Browse Jobs Section */}
      <section className="border-t border-border py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t("browseJobsTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              {t("browseJobsSubtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-8 max-w-xl"
          >
            <LandingJobSearch />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <Link
              href="/jobs"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              {t("browseAllJobs")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t("featuresTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("featuresSubtitle")}</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={fadeInUp}
                className="group relative rounded-2xl border border-border bg-background p-8 transition-all hover:border-primary/30 hover:shadow-lg"
              >
                <div className="mb-4 inline-flex rounded-xl bg-primary/10 p-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t("howItWorksTitle")}
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("howItWorksSubtitle")}</p>
          </motion.div>

          <div className="mt-16 grid gap-8 lg:grid-cols-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className="relative rounded-2xl border border-border bg-card p-8"
              >
                <div className="mb-4 text-5xl font-bold text-primary/20">{step.num}</div>
                <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-muted-foreground">{step.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="absolute end-4 top-1/2 hidden h-6 w-6 -translate-y-1/2 text-primary/30 lg:block rtl:rotate-180" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-t border-border bg-card py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mb-12 text-center text-3xl font-bold text-foreground"
          >
            {t("statsTitle")}
          </motion.h2>
          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            <AnimatedCounter value={t("stat1Value")} label={t("stat1Label")} />
            <AnimatedCounter value={t("stat2Value")} label={t("stat2Label")} />
            <AnimatedCounter value={t("stat3Value")} label={t("stat3Label")} />
            <AnimatedCounter value={t("stat4Value")} label={t("stat4Label")} />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              {t("testimonialsTitle")}
            </h2>
          </motion.div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((item, i) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl border border-border bg-card p-8"
              >
                <div className="mb-4 flex gap-1">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-foreground">&ldquo;{item.quote}&rdquo;</p>
                <div className="mt-6">
                  <div className="font-semibold text-foreground">{item.name}</div>
                  <div className="text-sm text-muted-foreground">{item.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border bg-gradient-to-b from-primary/5 to-primary/10 py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-2xl text-center"
          >
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">{t("ctaTitle")}</h2>
            <p className="mt-4 text-lg text-muted-foreground">{t("ctaSubtitle")}</p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90"
              >
                {t("ctaCTA")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-8 py-3.5 text-base font-semibold text-foreground transition-colors hover:bg-accent"
              >
                {tc("pricing")}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function LandingJobSearch() {
  const t = useTranslations("landing");
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?keyword=${encodeURIComponent(query.trim())}` : "";
    router.push(`/jobs${params}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-xl border border-border bg-background py-3 ps-10 pe-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>
      <button
        type="submit"
        className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        {t("searchButton")}
      </button>
    </form>
  );
}
