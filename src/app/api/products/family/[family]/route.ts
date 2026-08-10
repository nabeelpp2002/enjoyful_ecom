import { NextRequest, NextResponse } from 'next/server';
import { fetchProductFamilyEnvelope, storefrontCacheHeaders } from '@/lib/products-server';

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ family: string }> }
) {
    const { family } = await params;
    try {
        const upstream = await fetchProductFamilyEnvelope(family);
        return NextResponse.json(upstream.body, {
            status: upstream.status,
            headers: upstream.ok ? storefrontCacheHeaders() : { 'Cache-Control': 'no-store' },
        });
    } catch {
        return NextResponse.json(
            { success: false, error: { message: 'Products service unavailable' } },
            { status: 503, headers: { 'Cache-Control': 'no-store' } },
        );
    }
}
