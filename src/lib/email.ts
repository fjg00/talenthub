import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) return null;
    resend = new Resend(key);
  }
  return resend;
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const client = getResend();
  if (!client) return; // No API key — skip silently

  try {
    await client.emails.send({
      from: "TalentHub <notifications@talenthub.app>",
      to,
      subject,
      html,
    });
  } catch {
    // Email send failed — non-critical, don't crash
  }
}
