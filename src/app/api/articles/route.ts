import { NextRequest, NextResponse } from 'next/server';
import { getArticles, createArticle, getArticleCount } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const category = searchParams.get('category') || undefined;
    const featured = searchParams.get('featured');

    const articles = getArticles({
      limit,
      offset,
      categorySlug: category,
      featured: featured === 'true' ? true : featured === 'false' ? false : undefined,
    });

    const total = getArticleCount();

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Basic auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !validateAuth(authHeader)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.title || !body.content || !body.slug) {
      return NextResponse.json(
        { success: false, error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    const result = createArticle({
      title: body.title,
      slug: body.slug,
      excerpt: body.excerpt || '',
      content: body.content,
      featured_image: body.featured_image || '',
      category_id: body.category_id || 1,
      author: body.author || 'FinanceDaily Team',
      meta_title: body.meta_title || body.title,
      meta_description: body.meta_description || body.excerpt || '',
      meta_keywords: body.meta_keywords || '',
      is_published: body.is_published ?? true,
      is_featured: body.is_featured ?? false,
      reading_time: body.reading_time || 3,
      source_url: body.source_url || '',
      views: body.views || 0,
    });

    return NextResponse.json({
      success: true,
      data: { id: result.lastInsertRowid },
    }, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint')) {
      return NextResponse.json(
        { success: false, error: 'Article with this slug already exists' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}

function validateAuth(authHeader: string): boolean {
  const [scheme, credentials] = authHeader.split(' ');
  if (scheme !== 'Basic') return false;

  const decoded = Buffer.from(credentials, 'base64').toString();
  const [username, password] = decoded.split(':');

  return (
    username === (process.env.ADMIN_USERNAME || 'admin') &&
    password === (process.env.ADMIN_PASSWORD || 'changeme123')
  );
}
