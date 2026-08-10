import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { invalidateProductCaches } from '@/lib/product-cache';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

async function getToken() {
  const store = await cookies();
  return store.get('admin_access_token')?.value;
}

export async function POST(request: NextRequest) {
  const token = await getToken();
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    // CSV upload: forward the multipart body to NestJS bulk-import/csv
    const formData = await request.formData();
    const res = await fetch(`${API_BASE}/products/bulk-import/csv`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (res.ok) invalidateProductCaches();
    return NextResponse.json(data, { status: res.status });
  }

  // JSON upload: { products: [...] }
  const body = await request.json();
  const res = await fetch(`${API_BASE}/products/bulk-import/json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (res.ok) invalidateProductCaches();
  return NextResponse.json(data, { status: res.status });
}
