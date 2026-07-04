import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

async function token() {
  const store = await cookies();
  return store.get('admin_access_token')?.value;
}

/**
 * PATCH /api/admin/reviews/:id
 * Body must be one of:
 *   { action: "visibility", hidden: boolean }
 *   { action: "archive",    deleted: boolean }
 *
 * Forwards to /reviews/:id/visibility or /reviews/:id/archive respectively.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await token();
  if (!t) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await request.json();

  const path =
    body.action === 'archive' ? `reviews/${id}/archive` :
    body.action === 'visibility' ? `reviews/${id}/visibility` :
    null;
  if (!path) return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });

  const upstream = body.action === 'archive' ? { deleted: body.deleted } : { hidden: body.hidden };

  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
    body: JSON.stringify(upstream),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

/** DELETE → admin soft-delete (sets isDeleted: true). */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const t = await token();
  if (!t) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const res = await fetch(`${API_BASE}/reviews/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${t}` },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
