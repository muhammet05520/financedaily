import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'database', 'data.json');
const SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema.sql');

interface DbData {
  articles: any[];
  categories: any[];
  tags: any[];
  nextArticleId: number;
}

function getDefaultCategories() {
  return [
    { id: 1, name: 'Markets', slug: 'markets', description: 'Stock market news, analysis, and insights', icon: '📈', created_at: new Date().toISOString() },
    { id: 2, name: 'Cryptocurrency', slug: 'cryptocurrency', description: 'Bitcoin, Ethereum, and crypto market updates', icon: '₿', created_at: new Date().toISOString() },
    { id: 3, name: 'Economy', slug: 'economy', description: 'Global economic news and macroeconomic analysis', icon: '🌍', created_at: new Date().toISOString() },
    { id: 4, name: 'Personal Finance', slug: 'personal-finance', description: 'Budgeting, saving, and financial planning tips', icon: '💰', created_at: new Date().toISOString() },
    { id: 5, name: 'Investing', slug: 'investing', description: 'Investment strategies, portfolio management, and tips', icon: '📊', created_at: new Date().toISOString() },
    { id: 6, name: 'Real Estate', slug: 'real-estate', description: 'Property market trends and real estate investing', icon: '🏠', created_at: new Date().toISOString() },
    { id: 7, name: 'Technology', slug: 'technology', description: 'Fintech, banking technology, and digital finance', icon: '💻', created_at: new Date().toISOString() },
    { id: 8, name: 'Commodities', slug: 'commodities', description: 'Gold, oil, and commodity market analysis', icon: '🛢️', created_at: new Date().toISOString() },
  ];
}

function getDefaultArticles(): any[] {
  return [];
}

function loadData(): DbData {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      // Only return if it has valid structure
      if (parsed && parsed.categories) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading db:', e);
  }
  
  // Only initialize if file truly doesn't exist
  if (!fs.existsSync(DB_PATH)) {
    const data: DbData = {
      categories: getDefaultCategories(),
      articles: [],
      tags: [],
      nextArticleId: 1,
    };
    saveData(data);
    return data;
  }
  
  // Fallback: return empty structure without overwriting
  return {
    categories: getDefaultCategories(),
    articles: [],
    tags: [],
    nextArticleId: 1,
  };
}

function saveData(data: DbData): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// Article queries
export function getArticles(options: {
  limit?: number;
  offset?: number;
  categorySlug?: string;
  featured?: boolean;
  published?: boolean;
} = {}) {
  const data = loadData();
  const { limit = 20, offset = 0, categorySlug, featured, published = true } = options;

  let articles = data.articles;

  if (published) {
    articles = articles.filter(a => a.is_published === 1);
  }
  if (featured !== undefined) {
    articles = articles.filter(a => a.is_featured === (featured ? 1 : 0));
  }
  if (categorySlug) {
    const cat = data.categories.find(c => c.slug === categorySlug);
    if (cat) {
      articles = articles.filter(a => a.category_id === cat.id);
    }
  }

  // Add category info
  articles = articles.map(a => {
    const cat = data.categories.find(c => c.id === a.category_id);
    return { ...a, category_name: cat?.name || '', category_slug: cat?.slug || '' };
  });

  // Sort by created_at descending
  articles.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return articles.slice(offset, offset + limit);
}

export function getArticleBySlug(slug: string) {
  const data = loadData();
  const article = data.articles.find(a => a.slug === slug);
  
  if (article) {
    // Increment views
    article.views = (article.views || 0) + 1;
    saveData(data);

    const cat = data.categories.find(c => c.id === article.category_id);
    return { ...article, category_name: cat?.name || '', category_slug: cat?.slug || '' };
  }
  return null;
}

export function getCategories() {
  const data = loadData();
  return data.categories.map(c => ({
    ...c,
    article_count: data.articles.filter(a => a.category_id === c.id && a.is_published === 1).length,
  }));
}

export function getCategoryBySlug(slug: string) {
  const data = loadData();
  return data.categories.find(c => c.slug === slug) || null;
}

export function getTrendingArticles(limit = 5) {
  const data = loadData();
  const articles = data.articles
    .filter(a => a.is_published === 1)
    .map(a => {
      const cat = data.categories.find(c => c.id === a.category_id);
      return { ...a, category_name: cat?.name || '', category_slug: cat?.slug || '' };
    })
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
  return articles;
}

export function getRelatedArticles(articleId: number, categoryId: number, limit = 4) {
  const data = loadData();
  return data.articles
    .filter(a => a.is_published === 1 && a.id !== articleId && a.category_id === categoryId)
    .map(a => {
      const cat = data.categories.find(c => c.id === a.category_id);
      return { ...a, category_name: cat?.name || '', category_slug: cat?.slug || '' };
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit);
}

export function searchArticles(query: string, limit = 20) {
  const data = loadData();
  const q = query.toLowerCase();
  return data.articles
    .filter(a => a.is_published === 1 && (
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.excerpt.toLowerCase().includes(q)
    ))
    .map(a => {
      const cat = data.categories.find(c => c.id === a.category_id);
      return { ...a, category_name: cat?.name || '', category_slug: cat?.slug || '' };
    })
    .slice(0, limit);
}

export function createArticle(article: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  category_id: number;
  author?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  is_published?: boolean;
  is_featured?: boolean;
  reading_time?: number;
  source_url?: string;
  views?: number;
}) {
  const data = loadData();
  
  // Check for duplicate slug
  if (data.articles.find(a => a.slug === article.slug)) {
    throw new Error('UNIQUE constraint failed: articles.slug');
  }

  const now = new Date().toISOString();
  const newArticle = {
    id: data.nextArticleId++,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt || '',
    content: article.content,
    featured_image: article.featured_image || '',
    category_id: article.category_id,
    author: article.author || 'FinanceDaily Team',
    meta_title: article.meta_title || article.title,
    meta_description: article.meta_description || article.excerpt || '',
    meta_keywords: article.meta_keywords || '',
    is_published: article.is_published ? 1 : 0,
    is_featured: article.is_featured ? 1 : 0,
    views: article.views || 0,
    reading_time: article.reading_time || 3,
    source_url: article.source_url || '',
    created_at: now,
    updated_at: now,
  };

  data.articles.push(newArticle);
  saveData(data);

  return { lastInsertRowid: newArticle.id };
}

export function updateArticle(id: number, updates: Record<string, any>) {
  const data = loadData();
  const index = data.articles.findIndex(a => a.id === id);
  if (index === -1) return;

  Object.entries(updates).forEach(([key, value]) => {
    if (key === 'is_published' || key === 'is_featured') {
      data.articles[index][key] = value ? 1 : 0;
    } else {
      data.articles[index][key] = value;
    }
  });
  data.articles[index].updated_at = new Date().toISOString();
  saveData(data);
}

export function deleteArticle(id: number) {
  const data = loadData();
  data.articles = data.articles.filter(a => a.id !== id);
  saveData(data);
}

export function getArticleCount() {
  const data = loadData();
  return data.articles.filter(a => a.is_published === 1).length;
}

export function getAllSlugs() {
  const data = loadData();
  return data.articles
    .filter(a => a.is_published === 1)
    .map(a => ({ slug: a.slug }));
}
