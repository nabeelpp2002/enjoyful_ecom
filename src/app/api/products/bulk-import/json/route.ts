import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function POST(request: NextRequest) {
  const body = await request.json();
  return proxyRequest(request, '/products/bulk-import/json', 'POST', body);
}
