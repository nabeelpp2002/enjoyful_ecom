import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(request: NextRequest) {
  const store = await cookies();
  const token = store.get('admin_access_token')?.value;
  const days = request.nextUrl.searchParams.get('days') ?? '7';
  const res = await fetch(`${API_BASE}/analytics/dashboard?days=${days}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const wrapped = await res.json();
  const data = wrapped?.data ?? wrapped;
  return NextResponse.json(data, { status: res.status });
}
