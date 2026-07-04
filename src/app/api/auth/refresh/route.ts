import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { cookieOptions } from '@/lib/api-proxy';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get('refresh_token')?.value;

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(refreshToken ? { Cookie: `refresh_token=${refreshToken}` } : {}),
    },
  });
  const data = await res.json();
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const response = NextResponse.json({ success: true, data: { accessToken: data.data.accessToken } });
  response.cookies.set('access_token', data.data.accessToken, cookieOptions(15 * 60));
  return response;
}
