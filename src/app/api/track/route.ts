import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const body = await request.text();
  // Fire-and-forget — never block the user
  try {
    await fetch(`${API_BASE}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'user-agent': request.headers.get('user-agent') ?? '',
      },
      body,
    });
  } catch {
    // swallow analytics errors
  }
  return NextResponse.json({ ok: true });
}
