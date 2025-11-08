import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * POST /api/checkout-auth
 * Proxy to backend API /orders/checkout-auth for authenticated users
 * Includes user's access token in Authorization header
 */
export async function POST(request: NextRequest) {
  try {
    // Get session to retrieve access token
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login to checkout.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/orders/checkout-auth`;

    // Get access token from session
    const accessToken = (session.user as any).accessToken;

    console.log('🔐 Authenticated checkout request to:', url);
    console.log('👤 User:', session.user.email);
    console.log('📦 Request body:', JSON.stringify(body, null, 2));

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if access token exists
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      console.log('🔑 Access token included in request');
    } else {
      console.warn('⚠️ No access token found in session');
    }

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    console.log('📡 Backend response status:', res.status);
    console.log('📡 Backend response headers:', Object.fromEntries(res.headers.entries()));

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
    console.error('💥 Checkout-auth API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

