import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';
const isProd = process.env.NODE_ENV === 'production';

export async function proxyRequest(
  request: NextRequest,
  path: string,
  method = 'GET',
  body?: unknown,
  tokenKey = 'access_token',
): Promise<NextResponse> {
  const cookieStore = await cookies();
  const token = cookieStore.get(tokenKey)?.value;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}${request.nextUrl.search}`, {
    method,
    headers,
    cache: 'no-store',
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}
