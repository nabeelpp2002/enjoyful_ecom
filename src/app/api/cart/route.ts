import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

export async function GET(request: NextRequest) {
  return proxyRequest(request, '/cart');
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request, '/cart', 'DELETE');
}
