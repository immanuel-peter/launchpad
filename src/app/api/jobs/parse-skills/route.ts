import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require";
import { parseJobSkills } from "@/lib/ai/parsing";

export async function POST(request: Request) {
  const auth = await requireRole("startup");
  if (!auth) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json();
  const description = (body.description as string | undefined)?.trim();

  if (!description) {
    return NextResponse.json({ message: "Description is required." }, { status: 400 });
  }

  const skills = await parseJobSkills(description);
  return NextResponse.json({ skills });
}
