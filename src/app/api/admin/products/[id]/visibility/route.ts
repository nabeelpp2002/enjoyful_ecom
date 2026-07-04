import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const store = await cookies();
  const token = store.get('admin_access_token')?.value;
  const body = await request.json();
  const res = await fetch(`${API_BASE}/products/${id}/visibility`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ isHidden: body.isHidden }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
