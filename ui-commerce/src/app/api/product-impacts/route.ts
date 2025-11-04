import { NextResponse } from 'next/server';

export const revalidate = 300; // Revalidate every 5 minutes

/**
 * GET /api/product-impacts
 * Proxy to backend API to get eco impact defaults
 * Used by EcoImpactSection component
 */
export async function GET() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const url = `${apiUrl}/product-impacts`;

    const res = await fetch(url, {
      next: {
        revalidate: 3600, // Cache for 1 hour
        tags: ['product-impacts'],
      },
    });

    if (!res.ok) {
      console.error(`Failed to fetch product impacts: ${res.status}`);
      return NextResponse.json(
        { ecoImpacts: [] },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching product impacts:', error);
    return NextResponse.json(
      { ecoImpacts: [] },
      { status: 500 }
    );
  }
}

