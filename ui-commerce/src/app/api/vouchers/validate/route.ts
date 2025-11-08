import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/vouchers/validate
 * Proxy to backend API /vouchers/validate to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/vouchers/validate`;

    console.log('🎟️ Voucher validation request to:', url);
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log('📡 Voucher validation response:', data);

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Validation failed' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('❌ Voucher validation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

