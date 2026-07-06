import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { revalidateTag } from 'next/cache';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

async function getToken() {
  const store = await cookies();
  return store.get('admin_access_token')?.value;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken();
  const body = await request.text();
  const res = await fetch(`${API_BASE}/carousel/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body,
  });
  const data = await res.json();
  // Bust the public homepage hero cache so the edit appears immediately.
  if (res.ok) revalidateTag('carousel', 'max');
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = await getToken();
  const res = await fetch(`${API_BASE}/carousel/${id}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  // Bust the public homepage hero cache so the deletion appears immediately.
  if (res.ok) revalidateTag('carousel', 'max');
  return NextResponse.json(data, { status: res.status });
}
