import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_access_token')?.value;

  const incomingForm = await request.formData();
  const file = incomingForm.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: { message: 'No file provided' } },
      { status: 400 },
    );
  }

  // Re-build a clean FormData so Node's fetch auto-generates correct multipart boundaries
  const fd = new FormData();
  fd.append('file', file, file.name);

  for (const [key, value] of incomingForm.entries()) {
    if (key !== 'file') fd.append(key, value);
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers,
    body: fd,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
