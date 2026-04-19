import { NextRequest } from "next/server";
import { db } from "@/db";
import { jobs, jobAlerts, profiles, employerProfiles } from "@/db/schema";
import { and, eq, gt, gte, isNull, or, SQL, sql } from "drizzle-orm";
import { sendEmail } from "@/lib/email";
import { jobAlertDigestEmail } from "@/lib/email-templates";

export const dynamic = "force-dynamic";

/**
 * Scheduled job that fans out email digests of matching new jobs to subscribed
 * candidates. Invoke from any scheduler (Vercel Cron, a GitHub Action, etc.)
 * with `?frequency=daily` or `?frequency=weekly` and the shared `CRON_SECRET`
 * as a Bearer token.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(req.url);
  const frequency = url.searchParams.get("frequency");
  if (frequency !== "daily" && frequency !== "weekly") {
    return Response.json(
      { error: "frequency must be 'daily' or 'weekly'" },
      { status: 400 }
    );
  }

  const cadenceDays = frequency === "daily" ? 1 : 7;
  const cadenceCutoff = new Date(
    Date.now() - cadenceDays * 24 * 60 * 60 * 1000
  );

  // Pull enabled alerts with the right cadence that haven't been sent within the window.
  const alerts = await db.query.jobAlerts.findMany({
    where: and(
      eq(jobAlerts.enabled, true),
      eq(jobAlerts.frequency, frequency),
      or(
        isNull(jobAlerts.lastSentAt),
        sql`${jobAlerts.lastSentAt} < ${cadenceCutoff.toISOString()}`
      )
    ),
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let emailsSent = 0;
  let matchesTotal = 0;

  for (const alert of alerts) {
    // Window: since lastSentAt if present, else since the cadence window started.
    const since = alert.lastSentAt ?? cadenceCutoff;

    const conditions: SQL[] = [
      eq(jobs.status, "published"),
      gt(jobs.createdAt, since),
    ];
    if (alert.jobType) conditions.push(eq(jobs.jobType, alert.jobType));
    if (alert.experienceLevel)
      conditions.push(eq(jobs.experienceLevel, alert.experienceLevel));
    if (alert.location) {
      conditions.push(
        sql`lower(${jobs.location}) LIKE ${"%" + alert.location.toLowerCase() + "%"}`
      );
    }
    if (alert.keyword) {
      const kw = `%${alert.keyword.toLowerCase()}%`;
      conditions.push(
        sql`(lower(${jobs.title}) LIKE ${kw} OR lower(${jobs.description}) LIKE ${kw})`
      );
    }
    if (alert.salaryMin != null) {
      conditions.push(gte(jobs.salaryMin, alert.salaryMin));
    }
    if (alert.skills && alert.skills.length > 0) {
      // Any overlap between job.skills jsonb array and alert skills.
      // Using jsonb_array_elements_text via a subquery.
      const skillsJson = JSON.stringify(alert.skills);
      conditions.push(
        sql`EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(${jobs.skills}) AS js(s)
          WHERE js.s = ANY (SELECT jsonb_array_elements_text(${skillsJson}::jsonb))
        )`
      );
    }

    const matchRows = await db
      .select({
        id: jobs.id,
        title: jobs.title,
        location: jobs.location,
        employerId: jobs.employerId,
      })
      .from(jobs)
      .where(and(...conditions))
      .limit(20);

    if (matchRows.length === 0) {
      // Still advance lastSentAt so we don't re-scan the same window forever.
      await db
        .update(jobAlerts)
        .set({ lastSentAt: new Date() })
        .where(eq(jobAlerts.id, alert.id));
      continue;
    }

    // Look up candidate email + company names in one pass each.
    const [candidate] = await db
      .select({ email: profiles.email, fullName: profiles.fullName })
      .from(profiles)
      .where(eq(profiles.id, alert.candidateId));

    if (!candidate?.email) {
      await db
        .update(jobAlerts)
        .set({ lastSentAt: new Date() })
        .where(eq(jobAlerts.id, alert.id));
      continue;
    }

    const employerIds = [...new Set(matchRows.map((m) => m.employerId))];
    const employers = await db
      .select({
        id: profiles.id,
        fullName: profiles.fullName,
        companyName: employerProfiles.companyName,
      })
      .from(profiles)
      .leftJoin(employerProfiles, eq(employerProfiles.userId, profiles.id))
      .where(
        // small set, use inArray via sql
        sql`${profiles.id} IN (${sql.join(
          employerIds.map((id) => sql`${id}`),
          sql`, `
        )})`
      );

    const companyByEmployer = new Map<string, string>();
    for (const e of employers) {
      companyByEmployer.set(e.id, e.companyName ?? e.fullName);
    }

    const matches = matchRows.map((m) => ({
      title: m.title,
      company: companyByEmployer.get(m.employerId) ?? "",
      location: m.location,
      url: `${siteUrl}/dashboard/jobs/${m.id}`,
    }));

    try {
      await sendEmail({
        to: candidate.email,
        subject: `${matches.length} new ${matches.length === 1 ? "job" : "jobs"} for "${alert.name}"`,
        html: jobAlertDigestEmail(
          alert.name,
          matches,
          `${siteUrl}/dashboard/jobs`
        ),
      });
      emailsSent += 1;
      matchesTotal += matches.length;
    } catch {
      // fall through — still update lastSentAt so we don't retry indefinitely
    }

    await db
      .update(jobAlerts)
      .set({ lastSentAt: new Date() })
      .where(eq(jobAlerts.id, alert.id));
  }

  return Response.json({
    ok: true,
    frequency,
    alertsProcessed: alerts.length,
    emailsSent,
    matchesTotal,
  });
}
