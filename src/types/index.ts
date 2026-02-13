export interface Comment {
  id: number;
  name: string;
  text: string;
  avatar_color: string;
  date: string;
  likes: number;
}

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string;
  category_id: number;
  author: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  is_published: boolean;
  is_featured: boolean;
  views: number;
  source_url: string;
  reading_time: number;
  comments?: Comment[];
  created_at: string;
  updated_at: string;
  category_name?: string;
  category_slug?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  article_count?: number;
  created_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

export interface SiteConfig {
  siteName: string;
  siteUrl: string;
  adsenseId: string;
}

export interface AdSlot {
  id: string;
  format: 'horizontal' | 'vertical' | 'rectangle' | 'responsive';
  className?: string;
}

export interface MarketTicker {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}
