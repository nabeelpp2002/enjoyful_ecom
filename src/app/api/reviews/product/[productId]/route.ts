import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> },
) {
  const { productId } = await params;
  const url = `${API_BASE}/reviews/product/${productId}${request.nextUrl.search}`;
  const res = await fetch(url, { cache: 'no-store' });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
