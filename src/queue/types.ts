export type EmailJobData =
  | { type: "welcome"; email: string; fullName: string | null; role: "student" | "startup" }
  | {
      type: "new-application";
      companyEmail: string;
      companyName: string;
      applicantName: string;
      jobTitle: string;
      score: number;
    }
  | {
      type: "decision";
      studentEmail: string;
      studentName: string;
      jobTitle: string;
      companyName: string;
      status: "accepted" | "rejected";
      emailBody: string | null;
    };
