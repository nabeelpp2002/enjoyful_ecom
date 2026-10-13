import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  const guest = () => NextResponse.json(
    { success: true, data: null },
    { headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } },
  );
  // This public session probe is not an authorization gate. Protected APIs
  // still validate tokens and return 401 normally.
  if (!request.cookies.get('access_token')?.value) return guest();

  const response = await proxyRequest(request, '/auth/me');
  if (response.status === 401) return guest();
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Vary', 'Cookie');
  return response;
}
