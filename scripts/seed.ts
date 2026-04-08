/**
 * Seed script — populates TalentHub with realistic Middle East job market data.
 *
 * Run: npx tsx scripts/seed.ts
 *
 * Uses Supabase Admin API to create auth users (which triggers auto-profile creation),
 * then fills in the profile details, jobs, and applications.
 */

import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  profiles,
  candidateProfiles,
  employerProfiles,
  jobs,
  applications,
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

// All seeded users share this password for easy testing
const SEED_PASSWORD = "TalentHub2026!";

// ─── Employers ────────────────────────────────────────────────────────────────

const EMPLOYERS = [
  {
    fullName: "Khalid Al-Mansoori",
    email: "khalid@techvision.ae",
    company: "TechVision UAE",
    description:
      "Leading digital transformation consultancy in the Gulf region. We help enterprises modernize their tech stack and embrace AI-driven solutions.",
    website: "https://techvision.ae",
    size: "51-200" as const,
    industry: "Technology Consulting",
    location: "Dubai, UAE",
  },
  {
    fullName: "Noura Al-Rashid",
    email: "noura@gulffintech.com",
    company: "Gulf FinTech",
    description:
      "Pioneering digital banking and payment solutions for the MENA region. Backed by SoftBank and Mubadala.",
    website: "https://gulffintech.com",
    size: "201-500" as const,
    industry: "Financial Technology",
    location: "Riyadh, KSA",
  },
  {
    fullName: "Omar Hassan",
    email: "omar@petrosoft.qa",
    company: "PetroSoft Solutions",
    description:
      "Enterprise software for oil & gas operations. Our AI-powered analytics platform serves 40+ energy companies across the GCC.",
    website: "https://petrosoft.qa",
    size: "51-200" as const,
    industry: "Energy Technology",
    location: "Doha, Qatar",
  },
  {
    fullName: "Layla Ibrahim",
    email: "layla@medconnect.sa",
    company: "MedConnect Arabia",
    description:
      "Healthtech startup building the future of telemedicine in the Middle East. Series B funded.",
    website: "https://medconnect.sa",
    size: "11-50" as const,
    industry: "Healthcare Technology",
    location: "Jeddah, KSA",
  },
  {
    fullName: "Ahmed El-Sayed",
    email: "ahmed@buildhub.eg",
    company: "BuildHub Egypt",
    description:
      "PropTech platform connecting construction companies with suppliers and contractors across North Africa and the Gulf.",
    website: "https://buildhub.eg",
    size: "11-50" as const,
    industry: "Construction Technology",
    location: "Cairo, Egypt",
  },
  {
    fullName: "Fatima Al-Zahra",
    email: "fatima@luxecommerce.ae",
    company: "LuxeCommerce",
    description:
      "Premium e-commerce platform for luxury goods in the Middle East. Operating in 6 GCC countries.",
    website: "https://luxecommerce.ae",
    size: "201-500" as const,
    industry: "E-Commerce",
    location: "Abu Dhabi, UAE",
  },
  {
    fullName: "Youssef Karam",
    email: "youssef@cloudnative.kw",
    company: "CloudNative Kuwait",
    description:
      "Cloud infrastructure and DevOps consultancy. AWS Advanced Partner serving government and enterprise clients.",
    website: "https://cloudnative.kw",
    size: "1-10" as const,
    industry: "Cloud Computing",
    location: "Kuwait City, Kuwait",
  },
  {
    fullName: "Sara Al-Mutairi",
    email: "sara@edutechgcc.com",
    company: "EduTech GCC",
    description:
      "AI-powered learning platform serving 500K+ students across the Gulf. Arabic-first EdTech.",
    website: "https://edutechgcc.com",
    size: "51-200" as const,
    industry: "Education Technology",
    location: "Manama, Bahrain",
  },
];

// ─── Candidates ───────────────────────────────────────────────────────────────

const CANDIDATES = [
  {
    fullName: "Mohammad Al-Farsi",
    email: "mohammad.alfarsi@gmail.com",
    headline: "Senior Full-Stack Engineer",
    bio: "8+ years building scalable web applications. Passionate about React, Node.js, and cloud architecture. Previously at Careem and Noon.",
    skills: ["React", "Node.js", "TypeScript", "AWS", "PostgreSQL", "Docker", "GraphQL"],
    experienceYears: 8,
    education: "BSc Computer Science, American University of Sharjah",
    location: "Dubai, UAE",
    availability: "open" as const,
  },
  {
    fullName: "Reem Al-Dosari",
    email: "reem.dosari@outlook.com",
    headline: "Data Scientist & ML Engineer",
    bio: "Specialized in NLP and computer vision for Arabic language processing. Published researcher with 3 papers on Arabic NLP.",
    skills: ["Python", "TensorFlow", "PyTorch", "NLP", "Arabic NLP", "SQL", "Spark"],
    experienceYears: 5,
    education: "MSc Artificial Intelligence, KAUST",
    location: "Riyadh, KSA",
    availability: "open_to_offers" as const,
  },
  {
    fullName: "Hassan Mahmoud",
    email: "hassan.m@outlook.com",
    headline: "DevOps & Cloud Architect",
    bio: "Certified AWS Solutions Architect and Kubernetes expert. Built CI/CD pipelines for 20+ production systems across the GCC.",
    skills: ["AWS", "Kubernetes", "Terraform", "Docker", "CI/CD", "Linux", "Python"],
    experienceYears: 7,
    education: "BSc Information Technology, Qatar University",
    location: "Doha, Qatar",
    availability: "open" as const,
  },
  {
    fullName: "Aisha Noor",
    email: "aisha.noor@outlook.com",
    headline: "Product Designer (UX/UI)",
    bio: "Designing intuitive Arabic-first digital experiences. Led design systems at Fetchr and Kitopi. Figma and design systems enthusiast.",
    skills: ["Figma", "Design Systems", "User Research", "Prototyping", "Arabic UX", "Tailwind CSS"],
    experienceYears: 6,
    education: "BFA Graphic Design, American University in Cairo",
    location: "Dubai, UAE",
    availability: "open" as const,
  },
  {
    fullName: "Tariq Bin Salman",
    email: "tariq.bs@outlook.com",
    headline: "Mobile Developer (iOS/Android)",
    bio: "Cross-platform mobile expert with apps serving 2M+ users. Swift, Kotlin, and React Native.",
    skills: ["React Native", "Swift", "Kotlin", "TypeScript", "Firebase", "REST APIs"],
    experienceYears: 5,
    education: "BSc Software Engineering, King Saud University",
    location: "Riyadh, KSA",
    availability: "open_to_offers" as const,
  },
  {
    fullName: "Nadia El-Amin",
    email: "nadia.elamin@outlook.com",
    headline: "Cybersecurity Analyst",
    bio: "CISSP-certified security professional with experience in penetration testing and SOC operations.",
    skills: ["Penetration Testing", "SIEM", "ISO 27001", "Network Security", "Python", "Incident Response"],
    experienceYears: 4,
    education: "MSc Cybersecurity, Khalifa University",
    location: "Abu Dhabi, UAE",
    availability: "open" as const,
  },
  {
    fullName: "Ali Jaber",
    email: "ali.jaber@outlook.com",
    headline: "Backend Engineer (Go/Python)",
    bio: "Building high-performance microservices and distributed systems. Experience with real-time trading platforms and payment gateways.",
    skills: ["Go", "Python", "gRPC", "Redis", "PostgreSQL", "Kafka", "Microservices"],
    experienceYears: 6,
    education: "BSc Computer Engineering, Lebanese American University",
    location: "Beirut, Lebanon",
    availability: "open" as const,
  },
  {
    fullName: "Mariam Al-Thani",
    email: "mariam.thani@outlook.com",
    headline: "Project Manager & Scrum Master",
    bio: "PMP and CSM certified. Led delivery of 15+ enterprise projects worth $50M+ across fintech, healthcare, and government.",
    skills: ["Agile", "Scrum", "Jira", "Stakeholder Management", "Risk Management", "SAFe"],
    experienceYears: 9,
    education: "MBA, London Business School",
    location: "Doha, Qatar",
    availability: "open_to_offers" as const,
  },
  {
    fullName: "Yara Khalil",
    email: "yara.k@outlook.com",
    headline: "Frontend Engineer (React/Next.js)",
    bio: "Building beautiful, accessible web applications. RTL layout specialist. Open-source contributor to next-intl and shadcn/ui.",
    skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "Accessibility", "RTL"],
    experienceYears: 4,
    education: "BSc Computer Science, German University in Cairo",
    location: "Cairo, Egypt",
    availability: "open" as const,
  },
  {
    fullName: "Faisal Al-Otaibi",
    email: "faisal.otaibi@outlook.com",
    headline: "AI/ML Engineer",
    bio: "Building production ML pipelines for recommendation systems and fraud detection. Experience at scale with 100M+ records.",
    skills: ["Python", "MLOps", "AWS SageMaker", "Deep Learning", "Feature Engineering", "SQL"],
    experienceYears: 5,
    education: "MSc Machine Learning, University of Edinburgh",
    location: "Riyadh, KSA",
    availability: "open" as const,
  },
  {
    fullName: "Dana Haddad",
    email: "dana.h@outlook.com",
    headline: "QA Engineer & Test Automation Lead",
    bio: "End-to-end test automation with Playwright and Cypress. Built test frameworks from scratch for 3 startups.",
    skills: ["Playwright", "Cypress", "Selenium", "TypeScript", "API Testing", "CI/CD"],
    experienceYears: 5,
    education: "BSc Information Systems, University of Jordan",
    location: "Amman, Jordan",
    availability: "open" as const,
  },
  {
    fullName: "Saeed Al-Balushi",
    email: "saeed.b@outlook.com",
    headline: "Junior Frontend Developer",
    bio: "Recent graduate passionate about web development. Completed 3 internships and built several personal projects with React.",
    skills: ["HTML", "CSS", "JavaScript", "React", "Git", "Tailwind CSS"],
    experienceYears: 1,
    education: "BSc IT, Sultan Qaboos University",
    location: "Muscat, Oman",
    availability: "open" as const,
  },
];

// ─── Jobs ─────────────────────────────────────────────────────────────────────

const JOBS = [
  {
    employerIndex: 0,
    title: "Senior React Engineer",
    description: `We're looking for a Senior React Engineer to lead frontend development of our AI-powered enterprise platform.

Responsibilities:
• Architect and build complex React applications with TypeScript
• Implement responsive, RTL-compatible UI components
• Optimize performance for large-scale data dashboards
• Mentor junior developers and conduct code reviews
• Collaborate with UX designers and backend engineers

Requirements:
• 5+ years of React/TypeScript experience
• Strong understanding of state management (Zustand, Redux, or similar)
• Experience with Next.js App Router and Server Components
• Familiarity with testing (Jest, Playwright)
• Excellent communication skills in English (Arabic is a plus)

What we offer:
• Competitive salary + equity
• Remote-friendly with Dubai office
• Annual learning budget of $3,000
• Health insurance for you and your family`,
    location: "Dubai, UAE",
    jobType: "full_time" as const,
    experienceLevel: "senior" as const,
    skills: ["React", "TypeScript", "Next.js", "Tailwind CSS", "GraphQL"],
    salaryMin: 25000, salaryMax: 40000, currency: "AED" as const,
  },
  {
    employerIndex: 0,
    title: "Junior Full-Stack Developer",
    description: `Join our growing team as a Junior Full-Stack Developer. Great opportunity to learn from experienced engineers.

Responsibilities:
• Build features across our web application stack
• Write clean, tested code following our coding standards
• Participate in daily standups and sprint planning
• Learn and adopt new technologies as needed

Requirements:
• 0-2 years of experience with JavaScript/TypeScript
• Basic knowledge of React and Node.js
• Understanding of REST APIs and databases
• Eager to learn and grow

What we offer:
• Structured mentorship program
• Monthly tech talks and learning sessions
• Competitive salary for entry level
• Visa sponsorship available`,
    location: "Dubai, UAE",
    jobType: "full_time" as const,
    experienceLevel: "entry" as const,
    skills: ["JavaScript", "React", "Node.js", "SQL", "Git"],
    salaryMin: 8000, salaryMax: 14000, currency: "AED" as const,
  },
  {
    employerIndex: 1,
    title: "Lead Data Scientist",
    description: `Gulf FinTech is hiring a Lead Data Scientist to build ML models for credit scoring, fraud detection, and customer analytics.

Responsibilities:
• Design and deploy ML models for financial risk assessment
• Build real-time fraud detection systems
• Lead a team of 4 data scientists
• Present insights to C-level stakeholders
• Ensure model compliance with SAMA regulations

Requirements:
• 7+ years in data science, 3+ in fintech
• Expert in Python, TensorFlow/PyTorch, and SQL
• Experience with credit scoring and fraud models
• Strong understanding of financial regulations (SAMA, CBUAE)
• PhD or MSc in a quantitative field preferred

Benefits:
• Base salary 35,000-50,000 SAR/month
• Annual bonus up to 30%
• Stock options
• Relocation package`,
    location: "Riyadh, KSA",
    jobType: "full_time" as const,
    experienceLevel: "lead" as const,
    skills: ["Python", "Machine Learning", "TensorFlow", "SQL", "Financial Modeling", "Team Leadership"],
    salaryMin: 35000, salaryMax: 50000, currency: "SAR" as const,
  },
  {
    employerIndex: 1,
    title: "Mobile Engineer (React Native)",
    description: `Build the next generation of digital banking apps used by millions across the MENA region.

Responsibilities:
• Develop and maintain our React Native banking app
• Implement secure payment flows and biometric authentication
• Optimize app performance and reduce crash rates
• Work with the design team on pixel-perfect implementations

Requirements:
• 3+ years of React Native experience
• Experience with financial/banking apps preferred
• Strong understanding of mobile security best practices
• Familiarity with native modules (Swift/Kotlin)`,
    location: "Riyadh, KSA",
    jobType: "full_time" as const,
    experienceLevel: "mid" as const,
    skills: ["React Native", "TypeScript", "Swift", "Kotlin", "Mobile Security"],
    salaryMin: 20000, salaryMax: 32000, currency: "SAR" as const,
  },
  {
    employerIndex: 2,
    title: "Cloud Infrastructure Engineer",
    description: `PetroSoft is looking for a Cloud Infrastructure Engineer to manage and scale our multi-cloud platform serving 40+ energy companies.

Responsibilities:
• Design and maintain AWS/Azure infrastructure
• Implement infrastructure-as-code with Terraform
• Manage Kubernetes clusters and container orchestration
• Set up monitoring, alerting, and incident response
• Ensure 99.99% uptime for mission-critical systems

Requirements:
• 5+ years in cloud infrastructure/DevOps
• AWS and/or Azure certifications
• Expert in Terraform, Kubernetes, and Docker
• Experience with high-availability architectures

Compensation:
• Tax-free salary in Qatar
• Housing allowance
• Annual flight tickets`,
    location: "Doha, Qatar",
    jobType: "full_time" as const,
    experienceLevel: "senior" as const,
    skills: ["AWS", "Azure", "Terraform", "Kubernetes", "Docker", "Linux"],
    salaryMin: 30000, salaryMax: 45000, currency: "QAR" as const,
  },
  {
    employerIndex: 3,
    title: "Telemedicine Platform Developer",
    description: `Join MedConnect Arabia to build the future of healthcare delivery in the Middle East.

Responsibilities:
• Develop video consultation features using WebRTC
• Build appointment scheduling and EHR integration
• Implement HIPAA-compliant data handling
• Create responsive Arabic-first patient interfaces

Requirements:
• 3+ years of full-stack development
• Experience with WebRTC or real-time communication
• Healthcare/telemedicine experience preferred
• Understanding of data privacy regulations (HIPAA, PDPL)`,
    location: "Jeddah, KSA",
    jobType: "remote" as const,
    experienceLevel: "mid" as const,
    skills: ["React", "Node.js", "WebRTC", "PostgreSQL", "Arabic", "Healthcare APIs"],
    salaryMin: 18000, salaryMax: 28000, currency: "SAR" as const,
  },
  {
    employerIndex: 4,
    title: "Backend Developer (Python/Django)",
    description: `BuildHub is scaling fast across North Africa and the Gulf. We need a Backend Developer to build our core marketplace platform.

Responsibilities:
• Design and build REST APIs with Django REST Framework
• Implement payment gateway integrations (Fawry, Tap, Stripe)
• Optimize database queries for marketplace search
• Build real-time notification systems

Requirements:
• 3+ years with Python/Django
• Experience with PostgreSQL and Redis
• Payment integration experience preferred
• Marketplace or e-commerce background`,
    location: "Cairo, Egypt (Remote)",
    jobType: "remote" as const,
    experienceLevel: "mid" as const,
    skills: ["Python", "Django", "PostgreSQL", "Redis", "REST APIs", "Payment APIs"],
    salaryMin: 50000, salaryMax: 80000, currency: "EGP" as const,
  },
  {
    employerIndex: 5,
    title: "Senior Product Designer",
    description: `LuxeCommerce is looking for a Senior Product Designer to craft premium shopping experiences.

Responsibilities:
• Lead end-to-end design for our luxury e-commerce platform
• Create and maintain our design system
• Conduct user research with premium shoppers
• Design for both Arabic and English experiences

Requirements:
• 5+ years of product design experience
• Strong portfolio of e-commerce or luxury brand work
• Expert in Figma and prototyping tools
• Experience with Arabic/RTL design`,
    location: "Abu Dhabi, UAE",
    jobType: "full_time" as const,
    experienceLevel: "senior" as const,
    skills: ["Figma", "Design Systems", "User Research", "E-Commerce UX", "Arabic Design", "Prototyping"],
    salaryMin: 22000, salaryMax: 35000, currency: "AED" as const,
  },
  {
    employerIndex: 6,
    title: "AWS Solutions Architect (Contract)",
    description: `6-month contract to design and implement cloud migration for a major government client in Kuwait.

Responsibilities:
• Assess current on-premise infrastructure
• Design AWS migration architecture
• Implement landing zone and security guardrails
• Train internal IT team on AWS best practices

Requirements:
• AWS Solutions Architect Professional certification
• 5+ years of cloud architecture experience
• Government/public sector experience preferred
• Arabic language preferred`,
    location: "Kuwait City, Kuwait",
    jobType: "contract" as const,
    experienceLevel: "senior" as const,
    skills: ["AWS", "Cloud Architecture", "Security", "Migration", "Terraform", "Documentation"],
    salaryMin: 3000, salaryMax: 5000, currency: "KWD" as const,
  },
  {
    employerIndex: 7,
    title: "AI Curriculum Developer",
    description: `EduTech GCC is creating AI-powered Arabic learning content. We need a Curriculum Developer who understands both education and technology.

Responsibilities:
• Design K-12 computer science curriculum in Arabic
• Create interactive coding exercises and projects
• Work with AI team to build adaptive learning paths
• Align content with GCC national education standards

Requirements:
• 3+ years in educational content development
• Strong understanding of K-12 CS education
• Arabic fluency (written and spoken)
• Basic programming knowledge (Python, Scratch)`,
    location: "Manama, Bahrain",
    jobType: "full_time" as const,
    experienceLevel: "mid" as const,
    skills: ["Curriculum Design", "Arabic", "Python", "Education Technology", "K-12"],
    salaryMin: 1500, salaryMax: 2500, currency: "BHD" as const,
  },
  {
    employerIndex: 5,
    title: "E-Commerce Backend Engineer (Node.js)",
    description: `Build the backend powering luxury shopping across 6 GCC countries.

Responsibilities:
• Design microservices for catalog, cart, and checkout
• Build integrations with luxury brand APIs and logistics partners
• Implement real-time inventory sync across warehouses
• Handle peak traffic during sales events

Requirements:
• 4+ years of Node.js/TypeScript backend experience
• E-commerce platform experience
• Experience with message queues (RabbitMQ, Kafka)
• Understanding of payment gateways (Tap, Checkout.com)`,
    location: "Abu Dhabi, UAE",
    jobType: "full_time" as const,
    experienceLevel: "senior" as const,
    skills: ["Node.js", "TypeScript", "PostgreSQL", "Redis", "Microservices", "Kafka"],
    salaryMin: 28000, salaryMax: 42000, currency: "AED" as const,
  },
  {
    employerIndex: 3,
    title: "QA Automation Engineer",
    description: `Ensure the quality and reliability of our telemedicine platform used by thousands of patients daily.

Responsibilities:
• Build and maintain end-to-end test suites with Playwright
• Automate API testing for all microservices
• Set up CI/CD test pipelines
• Perform security testing for healthcare compliance

Requirements:
• 3+ years in test automation
• Expert in Playwright or Cypress
• Experience with API testing tools (Postman, k6)
• Healthcare software testing experience is a plus`,
    location: "Jeddah, KSA (Remote)",
    jobType: "remote" as const,
    experienceLevel: "mid" as const,
    skills: ["Playwright", "Cypress", "API Testing", "CI/CD", "TypeScript", "Healthcare"],
    salaryMin: 15000, salaryMax: 25000, currency: "SAR" as const,
  },
];

// ─── Seed logic ───────────────────────────────────────────────────────────────

async function createAuthUser(
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
    // User might already exist
    if (error.message.includes("already been registered")) {
      const { data: list } = await supabase.auth.admin.listUsers();
      const existing = list?.users?.find((u) => u.email === email);
      if (existing) return existing.id;
    }
    throw new Error(`Failed to create user ${email}: ${error.message}`);
  }

  return data.user.id;
}

async function seed() {
  console.log("🌱 Seeding TalentHub...\n");

  // 1. Create employer auth users + profiles
  const employerIds: string[] = [];
  console.log("── Employers ──");
  for (const emp of EMPLOYERS) {
    const id = await createAuthUser(emp.email, emp.fullName, "employer");
    employerIds.push(id);

    // Wait for trigger to create profile, then update employer details
    await new Promise((r) => setTimeout(r, 500));

    // Update the auto-created profile role to employer
    await db
      .update(profiles)
      .set({ role: "employer", fullName: emp.fullName })
      .where(eq(profiles.id, id));

    // Upsert employer profile details
    const existing = await db.query.employerProfiles.findFirst({
      where: eq(employerProfiles.userId, id),
    });

    if (existing) {
      await db
        .update(employerProfiles)
        .set({
          companyName: emp.company,
          companyDescription: emp.description,
          companyWebsite: emp.website,
          companySize: emp.size,
          industry: emp.industry,
          location: emp.location,
        })
        .where(eq(employerProfiles.userId, id));
    } else {
      await db.insert(employerProfiles).values({
        userId: id,
        companyName: emp.company,
        companyDescription: emp.description,
        companyWebsite: emp.website,
        companySize: emp.size,
        industry: emp.industry,
        location: emp.location,
      });
    }

    console.log(`  ✓ ${emp.company} — ${emp.email}`);
  }

  // 2. Create candidate auth users + profiles
  const candidateIds: string[] = [];
  console.log("\n── Candidates ──");
  for (const cand of CANDIDATES) {
    const id = await createAuthUser(cand.email, cand.fullName, "candidate");
    candidateIds.push(id);

    await new Promise((r) => setTimeout(r, 500));

    // Update profile
    await db
      .update(profiles)
      .set({ role: "candidate", fullName: cand.fullName })
      .where(eq(profiles.id, id));

    // Upsert candidate profile details
    const existing = await db.query.candidateProfiles.findFirst({
      where: eq(candidateProfiles.userId, id),
    });

    if (existing) {
      await db
        .update(candidateProfiles)
        .set({
          headline: cand.headline,
          bio: cand.bio,
          skills: cand.skills,
          experienceYears: cand.experienceYears,
          education: cand.education,
          location: cand.location,
          availabilityStatus: cand.availability,
        })
        .where(eq(candidateProfiles.userId, id));
    } else {
      await db.insert(candidateProfiles).values({
        userId: id,
        headline: cand.headline,
        bio: cand.bio,
        skills: cand.skills,
        experienceYears: cand.experienceYears,
        education: cand.education,
        location: cand.location,
        availabilityStatus: cand.availability,
      });
    }

    console.log(`  ✓ ${cand.fullName} — ${cand.headline}`);
  }

  // 3. Create jobs
  const jobIds: string[] = [];
  const deadline = new Date();
  deadline.setMonth(deadline.getMonth() + 2);

  console.log("\n── Jobs ──");
  for (const j of JOBS) {
    const [newJob] = await db
      .insert(jobs)
      .values({
        employerId: employerIds[j.employerIndex],
        title: j.title,
        description: j.description,
        location: j.location,
        jobType: j.jobType,
        experienceLevel: j.experienceLevel,
        skills: j.skills,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        deadline,
        status: "published",
      })
      .returning({ id: jobs.id });

    jobIds.push(newJob.id);
    console.log(`  ✓ ${j.title} — ${EMPLOYERS[j.employerIndex].company}`);
  }

  // 4. Create applications
  const appPairs: [number, number][] = [
    [0, 0],  [0, 10], [1, 2],  [1, 9],
    [2, 4],  [2, 8],  [3, 7],  [4, 3],
    [4, 5],  [5, 4],  [6, 6],  [6, 10],
    [7, 2],  [8, 0],  [8, 1],  [9, 2],
    [9, 9],  [10, 11],[11, 1], [11, 5],
  ];

  const coverLetters = [
    "I'm excited to apply for this role. My experience aligns well with the requirements, and I'm eager to contribute to your team's success in the GCC market.",
    "I believe my skills and background make me a strong candidate for this position. I'm particularly drawn to your company's mission and growth trajectory.",
    "Having worked in similar roles across the region, I understand the unique challenges and opportunities in this market. I'd love to bring my expertise to your team.",
    "This role perfectly matches my career goals and technical background. I'm passionate about the technology stack mentioned and have shipped production systems using it.",
    "I'm impressed by your company's impact in the Middle East market. My combination of technical skills and regional experience would be valuable to your team.",
  ];

  const statuses = [
    "applied", "applied", "applied", "reviewed", "reviewed",
    "shortlisted", "shortlisted", "interview", "offered", "rejected",
  ] as const;

  console.log("\n── Applications ──");
  for (const [candIdx, jobIdx] of appPairs) {
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const coverLetter = coverLetters[Math.floor(Math.random() * coverLetters.length)];

    await db.insert(applications).values({
      jobId: jobIds[jobIdx],
      candidateId: candidateIds[candIdx],
      coverLetter,
      status,
    });

    console.log(`  ✓ ${CANDIDATES[candIdx].fullName} → ${JOBS[jobIdx].title} [${status}]`);
  }

  console.log("\n✅ Seeding complete!");
  console.log(`   ${EMPLOYERS.length} employers`);
  console.log(`   ${CANDIDATES.length} candidates`);
  console.log(`   ${JOBS.length} jobs`);
  console.log(`   ${appPairs.length} applications`);
  console.log(`\n   All users share password: ${SEED_PASSWORD}`);
  console.log(`   Login as any employer: e.g. khalid@techvision.ae`);
  console.log(`   Login as any candidate: e.g. mohammad.alfarsi@gmail.com`);

  await sql.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
