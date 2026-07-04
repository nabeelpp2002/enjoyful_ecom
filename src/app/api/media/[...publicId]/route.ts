import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ publicId: string[] }> }) {
  const { publicId } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;

  const res = await fetch(`${API_BASE}/media/${publicId.join('/')}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
