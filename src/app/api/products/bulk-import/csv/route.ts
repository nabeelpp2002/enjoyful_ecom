import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { invalidateProductCaches } from '@/lib/product-cache';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;

  const formData = await request.formData();
  const res = await fetch(`${API_BASE}/products/bulk-import/csv`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json();
  if (res.ok) invalidateProductCaches();
  return NextResponse.json(data, { status: res.status });
}
