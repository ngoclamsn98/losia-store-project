import { NextRequest, NextResponse } from 'next/server';

// Disable caching for this route - always fetch fresh payment status
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/payment/status/:orderCode
 * Proxy to backend API /payment/status/:orderCode to check payment status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderCode: string } }
) {
  try {
    const { orderCode } = params;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/payment/status/${orderCode}`;

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      next: { revalidate: 0 },
    });

    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      console.error('❌ Backend returned non-JSON response:', text.substring(0, 500));
      return NextResponse.json(
        { error: 'Backend API không trả về JSON. Vui lòng kiểm tra backend server.' },
        { status: 502 }
      );
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Kiểm tra trạng thái thất bại' }));
      console.error('❌ Backend error:', error);
      return NextResponse.json(
        { error: error.message || 'Kiểm tra trạng thái thất bại' },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Return with no-cache headers
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('💥 Payment status API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

