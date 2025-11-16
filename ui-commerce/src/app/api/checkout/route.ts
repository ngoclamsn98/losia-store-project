import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/checkout
 * Proxy to backend API /orders/checkout to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/orders/checkout`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
      const error = await res.json().catch(() => ({ message: 'Đặt hàng thất bại' }));
      console.error('❌ Backend error:', error);
      return NextResponse.json(
        { error: error.message || 'Đặt hàng thất bại' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('💥 Checkout API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

