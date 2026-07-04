import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

async function getToken() {
  const store = await cookies();
  return store.get('admin_access_token')?.value;
}

function normalizeBanner(b: Record<string, unknown>) {
  return {
    id: String(b._id ?? b.id ?? ''),
    category: b.category,
    desktopImageUrl: b.desktopImageUrl ?? '',
    mobileImageUrl: b.mobileImageUrl ?? '',
  };
}

export async function GET() {
  const token = await getToken();
  const res = await fetch(`${API_BASE}/category-banners`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: 'no-store',
  });
  const wrapped = await res.json();
  const raw: Record<string, unknown>[] = Array.isArray(wrapped?.data)
    ? wrapped.data
    : Array.isArray(wrapped)
    ? wrapped
    : [];
  return NextResponse.json(raw.map(normalizeBanner));
}

export async function POST(request: NextRequest) {
  const token = await getToken();
  const body = await request.text();
  const res = await fetch(`${API_BASE}/category-banners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
