import { NextRequest, NextResponse } from 'next/server';
import { getArticleBySlug, updateArticle, deleteArticle } from '@/lib/db';

interface RouteParams {
  params: { id: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const article = getArticleBySlug(params.id);
    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: article });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !validateAuth(authHeader)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid article ID' }, { status: 400 });
    }

    updateArticle(id, body);
    return NextResponse.json({ success: true, message: 'Article updated' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !validateAuth(authHeader)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid article ID' }, { status: 400 });
    }

    deleteArticle(id);
    return NextResponse.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete article' },
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
