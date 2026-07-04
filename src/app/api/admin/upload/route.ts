import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(request: NextRequest) {
  const store = await cookies();
  const token = store.get('admin_access_token')?.value;

  // Parse the incoming multipart form from the browser
  const incomingForm = await request.formData();
  const file = incomingForm.get('file') as File | null;

  if (!file) {
    return NextResponse.json(
      { success: false, error: { message: 'No file provided' } },
      { status: 400 },
    );
  }

  // Re-build a fresh FormData to forward to NestJS.
  // This is necessary because Next.js's parsed FormData entries are Web API
  // File/Blob objects that Node's fetch serialises correctly with proper
  // multipart boundaries when placed into a *new* FormData.
  const fd = new FormData();
  fd.append('file', file, file.name);

  // Forward any extra fields (e.g. `folder`)
  for (const [key, value] of incomingForm.entries()) {
    if (key !== 'file') fd.append(key, value);
  }

  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  // Do NOT set Content-Type — fetch auto-generates it with the correct boundary

  const res = await fetch(`${API_BASE}/media/upload`, {
    method: 'POST',
    headers,
    body: fd,
  });

  const data = await res.json();
  // Normalise: return { secure_url } that the admin panel expects
  const url = data?.data?.url ?? data?.url ?? data?.secure_url ?? '';
  return NextResponse.json({ secure_url: url, ...data }, { status: res.status });
}
