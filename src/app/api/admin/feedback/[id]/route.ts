import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

async function token() {
  const store = await cookies();
  return store.get('admin_access_token')?.value;
}

/** PATCH /api/admin/feedback/:id — body { status: "new" | "read" | "archived" }. */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await token();
  if (!t) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const res = await fetch(`${API_BASE}/feedback/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify({ status: body.status }),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** DELETE → permanently remove a feedback entry. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await token();
  if (!t) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const res = await fetch(`${API_BASE}/feedback/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
