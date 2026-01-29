import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require";
import { getMatchedJobsForUser } from "@/lib/ai/matching";

export async function GET() {
  const auth = await requireRole("student");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const jobs = await getMatchedJobsForUser(auth.sub);
  return NextResponse.json(jobs);
}
