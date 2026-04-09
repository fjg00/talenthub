/**
 * Creates 2 extra test accounts: 1 employer + 1 candidate.
 *
 * Run: npx tsx scripts/seed-extra-accounts.ts
 */

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  profiles,
  candidateProfiles,
  employerProfiles,
} from "../src/db/schema";
import * as schema from "../src/db/schema";
import { eq } from "drizzle-orm";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATABASE_URL = process.env.DATABASE_URL!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY || !DATABASE_URL) {
  console.error("Missing env vars. Ensure .env.local is loaded.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const sql = postgres(DATABASE_URL, { prepare: false });
const db = drizzle(sql, { schema });

const SEED_PASSWORD = "TalentHub2026!";

async function createUser(
  email: string,
  fullName: string,
  role: "candidate" | "employer"
): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (error) {
    if (error.message.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      if (existing) return existing.id;
    }
    throw new Error(`Failed to create user ${email}: ${error.message}`);
  }

  return data.user.id;
}

async function main() {
  console.log("Creating 2 extra accounts...\n");

  // ── Employer ──
  const empEmail = "nadia@logisticspro.ae";
  const empName = "Nadia Al-Suwaidi";
  const empId = await createUser(empEmail, empName, "employer");
  await new Promise((r) => setTimeout(r, 500));

  await db
    .update(profiles)
    .set({ role: "employer", fullName: empName })
    .where(eq(profiles.id, empId));

  const existingEmp = await db.query.employerProfiles.findFirst({
    where: eq(employerProfiles.userId, empId),
  });

  const empData = {
    companyName: "LogisticsPro Gulf",
    companyDescription:
      "AI-driven supply chain and logistics platform operating across the GCC. Serving 200+ enterprise clients with real-time fleet tracking and warehouse automation.",
    companyWebsite: "https://logisticspro.ae",
    companySize: "51-200" as const,
    industry: "Logistics & Supply Chain",
    location: "Sharjah, UAE",
  };

  if (existingEmp) {
    await db
      .update(employerProfiles)
      .set(empData)
      .where(eq(employerProfiles.userId, empId));
  } else {
    await db.insert(employerProfiles).values({ userId: empId, ...empData });
  }

  console.log(`  Employer: ${empName}`);
  console.log(`    Email:   ${empEmail}`);
  console.log(`    Company: ${empData.companyName}`);

  // ── Candidate ──
  const candEmail = "zain.haddad@outlook.com";
  const candName = "Zain Haddad";
  const candId = await createUser(candEmail, candName, "candidate");
  await new Promise((r) => setTimeout(r, 500));

  await db
    .update(profiles)
    .set({ role: "candidate", fullName: candName })
    .where(eq(profiles.id, candId));

  const existingCand = await db.query.candidateProfiles.findFirst({
    where: eq(candidateProfiles.userId, candId),
  });

  const candData = {
    headline: "Full-Stack Engineer & Cloud Enthusiast",
    bio: "5 years of experience building production apps with React, Next.js, and Go. Passionate about serverless architecture and developer tooling. Previously at Talabat and Anghami.",
    skills: ["React", "Next.js", "TypeScript", "Go", "AWS", "Docker", "PostgreSQL", "Redis"],
    experienceYears: 5,
    education: "BSc Computer Science, Lebanese American University",
    location: "Beirut, Lebanon",
    availabilityStatus: "open" as const,
  };

  if (existingCand) {
    await db
      .update(candidateProfiles)
      .set(candData)
      .where(eq(candidateProfiles.userId, candId));
  } else {
    await db.insert(candidateProfiles).values({ userId: candId, ...candData });
  }

  console.log(`\n  Candidate: ${candName}`);
  console.log(`    Email:    ${candEmail}`);
  console.log(`    Headline: ${candData.headline}`);

  console.log(`\n  Password for both: ${SEED_PASSWORD}`);

  await sql.end();
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
