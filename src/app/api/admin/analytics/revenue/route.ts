import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/analytics/revenue', 'GET', undefined, 'admin_access_token');
}
