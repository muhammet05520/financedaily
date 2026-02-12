import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/db';

export async function GET() {
  try {
    const categories = getCategories();
    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
