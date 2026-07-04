import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, '/banners/reorder', 'PATCH', body);
}
