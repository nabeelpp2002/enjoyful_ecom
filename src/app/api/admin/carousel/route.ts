import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';
import { fetchCarouselSlides } from '@/lib/carousel';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

async function getToken() {
  const store = await cookies();
  return store.get('admin_access_token')?.value;
}

export async function GET() {
  try {
    const token = await getToken();
    const slides = await fetchCarouselSlides(token);
    return NextResponse.json(slides);
  } catch (err) {
    console.error('[api/admin/carousel]', err);
    return NextResponse.json(
      { error: 'Failed to load carousel slides. Is the API server running?' },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const token = await getToken();
  const body = await request.text();

  try {
    const res = await fetch(`${API_BASE}/carousel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    // Bust the public homepage hero cache so the new slide appears immediately.
    if (res.ok) revalidateTag('carousel', 'max');
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[api/admin/carousel] POST', err);
    return NextResponse.json(
      { error: 'Failed to reach API server' },
      { status: 503 },
    );
  }
}
