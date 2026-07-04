import { NextRequest, NextResponse } from 'next/server';

const API_BASE = process.env.NEST_API_URL ?? 'http://localhost:4000/api/v1';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ family: string }> }
) {
    const { family } = await params;
    const res = await fetch(`${API_BASE}/products/family/${encodeURIComponent(family)}`, {
        cache: 'no-store',
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
}
