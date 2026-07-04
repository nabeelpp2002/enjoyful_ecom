import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/settings');
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, '/settings', 'PATCH', body, 'admin_access_token');
}
