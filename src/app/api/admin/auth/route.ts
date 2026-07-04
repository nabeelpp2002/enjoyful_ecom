import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions } from '@/lib/api-proxy';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const res = await fetch(`${API_BASE}/auth/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ success: false }, { status: res.status });
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_access_token', data.data.accessToken, cookieOptions(8 * 60 * 60));
  return response;
}
