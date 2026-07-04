import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${API_BASE}/auth/otp/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
