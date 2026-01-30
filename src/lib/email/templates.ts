export type EmailTemplate = {
  subject: string;
  html: string;
};

const DEFAULT_ACCEPTANCE_EMAIL = [
  "Congratulations! We are pleased to inform you that you have been selected.",
  "We were impressed by your qualifications and believe you will be a great addition to our team.",
  "",
  "Our team will reach out shortly with next steps regarding onboarding and start date details.",
].join("\n");

const DEFAULT_REJECTION_EMAIL = [
  "Thank you for your interest in this position.",
  "After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs.",
  "",
  "We appreciate the time you invested in applying and encourage you to apply for future opportunities that align with your skills.",
].join("\n");

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const formatMultiline = (value: string) => {
  const escaped = escapeHtml(value);
  return escaped
    .split("\n")
    .map((line) => (line.length === 0 ? "" : line))
    .join("<br />");
};

const wrapEmail = (bodyHtml: string) =>
  `<div style="font-family: Arial, sans-serif; color: #111; line-height: 1.5;">${bodyHtml}</div>`;

export function getWelcomeEmail(fullName: string | null, role: "student" | "startup"): EmailTemplate {
  const displayName = fullName?.trim() || "there";
  const roleLine =
    role === "student"
      ? "You can now complete your profile and apply for roles."
      : "You can now post roles and review applicants.";

  const html = wrapEmail(
    `<p>Hi ${escapeHtml(displayName)},</p>
     <p>Welcome to Launchpad.</p>
     <p>${escapeHtml(roleLine)}</p>
     <p>Thanks,<br />The Launchpad Team</p>`
  );

  return {
    subject: "Welcome to Launchpad",
    html,
  };
}

export function getNewApplicationEmail(params: {
  companyName: string;
  applicantName: string;
  jobTitle: string;
  score: number;
}): EmailTemplate {
  const { companyName, applicantName, jobTitle, score } = params;
  const html = wrapEmail(
    `<p>Hi ${escapeHtml(companyName)},</p>
     <p>You have a new application ready for review.</p>
     <p><strong>Applicant:</strong> ${escapeHtml(applicantName)}</p>
     <p><strong>Role:</strong> ${escapeHtml(jobTitle)}</p>
     <p><strong>Score:</strong> ${score}</p>
     <p>Log in to review the full details.</p>`
  );

  return {
    subject: `New application for ${jobTitle}`,
    html,
  };
}

export function getDecisionEmail(params: {
  studentName: string;
  companyName: string;
  jobTitle: string;
  status: "accepted" | "rejected";
  emailBody: string | null;
}): EmailTemplate {
  const { studentName, companyName, jobTitle, status, emailBody } = params;
  const fallbackBody = status === "accepted" ? DEFAULT_ACCEPTANCE_EMAIL : DEFAULT_REJECTION_EMAIL;
  const bodyText = emailBody?.trim() ? emailBody : fallbackBody;
  const bodyHtml = formatMultiline(bodyText);

  const html = wrapEmail(
    `<p>Hi ${escapeHtml(studentName)},</p>
     <p>${escapeHtml(companyName)} has made a decision on your application for ${escapeHtml(jobTitle)}.</p>
     <p>${bodyHtml}</p>
     <p>Thanks,<br />The ${escapeHtml(companyName)} Team</p>`
  );

  return {
    subject: `Update on your application for ${jobTitle}`,
    html,
  };
}
