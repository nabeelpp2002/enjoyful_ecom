import { NextRequest } from 'next/server';
import { proxyRequest } from '@/lib/api-proxy';

// Public read of the admin-managed category banners (used by the storefront category pages).
export async function GET(request: NextRequest) {
  return proxyRequest(request, '/category-banners');
}
