import { NextRequest, NextResponse } from "next/server";

const API_BASE = process.env.NEST_API_URL ?? "http://localhost:4000/api/v1";

export async function POST(request: NextRequest) {
  let body: { name?: unknown; email?: unknown; subject?: unknown; message?: unknown };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json(
      { ok: false, error: "name, email, and message are required" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`${API_BASE}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      return NextResponse.json(
        { ok: false, error: errData?.message ?? "Upstream error" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Failed to deliver message" },
      { status: 500 }
    );
  }
}
