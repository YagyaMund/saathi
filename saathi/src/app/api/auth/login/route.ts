import { NextResponse } from "next/server";
import { loginEmail } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await loginEmail(String(body.email || ""), String(body.password || ""));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 400 },
    );
  }
}
