import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/register
 * Proxy to backend API /client-auth/register to avoid CORS issues
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Map frontend fields to backend DTO
    // Frontend sends: { name, email, phone, password }
    // Backend expects: { email, password, name?, phone? }
    const backendPayload = {
      email: body.email,
      password: body.password,
      name: body.name || undefined,
      phone: body.phone || undefined,
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/client-auth/register`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendPayload),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Đăng ký thất bại' },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json(
      { error: 'Có lỗi xảy ra. Vui lòng thử lại.' },
      { status: 500 }
    );
  }
}

