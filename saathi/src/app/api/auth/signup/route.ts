import { NextResponse } from "next/server";
import { signupEmail } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    await signupEmail({
      email: String(body.email || ""),
      name: String(body.name || ""),
      password: String(body.password || ""),
      shopName: String(body.shopName || ""),
      city: String(body.city || ""),
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Signup failed" },
      { status: 400 },
    );
  }
}
