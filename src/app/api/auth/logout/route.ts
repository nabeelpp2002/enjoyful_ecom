import { NextRequest, NextResponse } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function POST(request: NextRequest) {
  const res = await proxyRequest(request, '/auth/logout', 'POST');
  res.cookies.delete('access_token');
  res.cookies.delete('refresh_token');
  return res;
}
