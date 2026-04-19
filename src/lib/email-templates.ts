const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  max-width: 560px;
  margin: 0 auto;
  padding: 40px 20px;
  color: #1a1a1a;
`;

const buttonStyle = `
  display: inline-block;
  background: #7c3aed;
  color: #ffffff;
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
`;

function wrap(content: string) {
  return `
    <!DOCTYPE html>
    <html>
    <body style="background: #f5f5f5; margin: 0; padding: 20px;">
      <div style="${baseStyle}">
        <div style="text-align: center; margin-bottom: 32px;">
          <span style="font-size: 24px; font-weight: 700; color: #7c3aed;">TalentHub</span>
        </div>
        <div style="background: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e5e5;">
          ${content}
        </div>
        <p style="text-align: center; font-size: 12px; color: #999; margin-top: 24px;">
          You received this email because of your TalentHub account settings.
        </p>
      </div>
    </body>
    </html>
  `;
}

export function newApplicationEmail(jobTitle: string, candidateName: string, jobUrl: string) {
  return wrap(`
    <h2 style="margin: 0 0 16px; font-size: 20px;">New Application Received</h2>
    <p style="color: #555; line-height: 1.6;">
      <strong>${candidateName}</strong> has applied to your job posting
      <strong>${jobTitle}</strong>.
    </p>
    <p style="margin-top: 24px;">
      <a href="${jobUrl}" style="${buttonStyle}">View Applicant</a>
    </p>
  `);
}

export function statusChangeEmail(
  jobTitle: string,
  newStatus: string,
  dashboardUrl: string
) {
  const statusMessages: Record<string, string> = {
    reviewed: "Your application has been reviewed by the employer.",
    shortlisted: "Great news! You've been shortlisted for the next round.",
    interview: "You've been invited to an AI video interview!",
    offered: "Congratulations! You've received a job offer.",
    rejected: "Unfortunately, the employer has decided to move forward with other candidates.",
    hired: "Congratulations! You've been hired!",
  };

  const message = statusMessages[newStatus] ?? `Your application status has been updated to: ${newStatus}`;

  return wrap(`
    <h2 style="margin: 0 0 16px; font-size: 20px;">Application Update</h2>
    <p style="color: #555; line-height: 1.6;">
      Regarding your application for <strong>${jobTitle}</strong>:
    </p>
    <p style="color: #333; line-height: 1.6; font-size: 15px;">
      ${message}
    </p>
    <p style="margin-top: 24px;">
      <a href="${dashboardUrl}" style="${buttonStyle}">View Details</a>
    </p>
  `);
}

export function interviewRequestedEmail(jobTitle: string, interviewUrl: string) {
  return wrap(`
    <h2 style="margin: 0 0 16px; font-size: 20px;">Interview Requested</h2>
    <p style="color: #555; line-height: 1.6;">
      You've been invited to complete an AI video interview for
      <strong>${jobTitle}</strong>.
    </p>
    <p style="color: #555; line-height: 1.6;">
      The interview consists of a set of questions you'll answer on camera.
      Take your time and find a quiet space.
    </p>
    <p style="margin-top: 24px;">
      <a href="${interviewUrl}" style="${buttonStyle}">Start Interview</a>
    </p>
  `);
}

export function hiredEmail(jobTitle: string, companyName: string) {
  return wrap(`
    <h2 style="margin: 0 0 16px; font-size: 20px;">🎉 Congratulations!</h2>
    <p style="color: #555; line-height: 1.6;">
      You've been hired for <strong>${jobTitle}</strong> at
      <strong>${companyName}</strong>!
    </p>
    <p style="color: #555; line-height: 1.6;">
      The employer will be in touch with next steps. Welcome to the team!
    </p>
  `);
}

export function interviewScheduledEmail(opts: {
  jobTitle: string;
  companyName: string;
  scheduledAt: Date;
  durationMinutes: number;
  type: "video" | "phone" | "onsite";
  meetingUrl?: string | null;
  location?: string | null;
  notes?: string | null;
  dashboardUrl: string;
  action: "scheduled" | "rescheduled" | "cancelled";
}) {
  const verb =
    opts.action === "scheduled"
      ? "Scheduled"
      : opts.action === "rescheduled"
        ? "Rescheduled"
        : "Cancelled";
  const when = opts.scheduledAt.toLocaleString("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "UTC",
  });
  const typeLabel =
    opts.type === "video"
      ? "Video call"
      : opts.type === "phone"
        ? "Phone call"
        : "Onsite";
  const locationLine =
    opts.type === "video" && opts.meetingUrl
      ? `<p style="color:#555; line-height:1.6;"><strong>Join link:</strong> <a href="${opts.meetingUrl}">${opts.meetingUrl}</a></p>`
      : opts.type === "onsite" && opts.location
        ? `<p style="color:#555; line-height:1.6;"><strong>Location:</strong> ${opts.location}</p>`
        : "";
  const notesLine = opts.notes
    ? `<p style="color:#555; line-height:1.6;"><strong>Notes:</strong> ${opts.notes}</p>`
    : "";
  return wrap(`
    <h2 style="margin: 0 0 16px; font-size: 20px;">Interview ${verb}</h2>
    <p style="color: #555; line-height: 1.6;">
      ${opts.companyName} has ${opts.action} an interview for
      <strong>${opts.jobTitle}</strong>.
    </p>
    <p style="color:#555; line-height:1.6;">
      <strong>When:</strong> ${when} (UTC)<br/>
      <strong>Duration:</strong> ${opts.durationMinutes} minutes<br/>
      <strong>Type:</strong> ${typeLabel}
    </p>
    ${locationLine}
    ${notesLine}
    <p style="margin-top: 24px;">
      <a href="${opts.dashboardUrl}" style="${buttonStyle}">View in Dashboard</a>
    </p>
  `);
}

export function jobAlertDigestEmail(
  alertName: string,
  matches: { title: string; company: string; location: string | null; url: string }[],
  browseUrl: string
) {
  const rows = matches
    .map(
      (m) => `
      <div style="padding: 16px 0; border-bottom: 1px solid #eee;">
        <a href="${m.url}" style="color: #7c3aed; font-weight: 600; text-decoration: none; font-size: 15px;">
          ${m.title}
        </a>
        <div style="color: #666; font-size: 13px; margin-top: 4px;">
          ${m.company}${m.location ? ` &middot; ${m.location}` : ""}
        </div>
      </div>
    `
    )
    .join("");

  return wrap(`
    <h2 style="margin: 0 0 8px; font-size: 20px;">New jobs for &ldquo;${alertName}&rdquo;</h2>
    <p style="color: #555; line-height: 1.6;">
      We found ${matches.length} new ${matches.length === 1 ? "job" : "jobs"} matching your alert:
    </p>
    <div style="margin-top: 8px;">
      ${rows}
    </div>
    <p style="margin-top: 24px;">
      <a href="${browseUrl}" style="${buttonStyle}">Browse all jobs</a>
    </p>
  `);
}
