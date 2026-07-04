import { NextRequest, NextResponse } from 'next/server';
import { cookieOptions } from '@/lib/api-proxy';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const upstream = await fetch(`${API_BASE}/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });
  const data = await upstream.json();
  if (!upstream.ok) return NextResponse.json(data, { status: upstream.status });

  const access = data?.data?.accessToken;
  const refreshHeader = upstream.headers.get('set-cookie') ?? '';
  const refreshMatch = refreshHeader.match(/refresh_token=([^;]+)/);
  const refresh = refreshMatch?.[1];

  const out = NextResponse.json({ success: true, data: { user: data?.data?.user } });
  if (access) out.cookies.set('access_token', access, cookieOptions(8 * 60 * 60));
  if (refresh) out.cookies.set('refresh_token', refresh, cookieOptions(7 * 24 * 60 * 60));
  return out;
}
