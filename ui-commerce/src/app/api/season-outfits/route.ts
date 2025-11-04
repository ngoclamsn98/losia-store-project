import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 300; // Revalidate every 5 minutes

/**
 * GET /api/season-outfits
 * Proxy to backend API /products/season-outfits
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || '16';

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/products/season-outfits?limit=${limit}`;

    const res = await fetch(url, {
      next: {
        revalidate: process.env.NODE_ENV === 'production' ? 300 : 0, // Cache 5 minutes in production
        tags: ['season-outfits', 'products'],
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch season outfits: ${res.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch season outfits', items: [] },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Return in format expected by SeasonOutfitSection
    return NextResponse.json({
      items: data.data || [],
      meta: data.meta || {},
    });
  } catch (error) {
    console.error('Error fetching season outfits:', error);
    return NextResponse.json(
      { error: 'Internal server error', items: [] },
      { status: 500 }
    );
  }
}

