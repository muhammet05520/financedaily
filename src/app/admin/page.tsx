'use client';

import { useState, useEffect } from 'react';

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  category_name: string;
  is_published: boolean;
  is_featured: boolean;
  views: number;
  created_at: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
  article_count: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'articles' | 'create'>('articles');
  const [message, setMessage] = useState('');

  // New article form
  const [newArticle, setNewArticle] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    category_id: 1,
    meta_title: '',
    meta_description: '',
    meta_keywords: '',
    is_published: true,
    is_featured: false,
  });

  const authHeader = `Basic ${btoa(`${username}:${password}`)}`;

  const login = () => {
    setIsAuthenticated(true);
    fetchArticles();
    fetchCategories();
  };

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/articles?limit=100');
      const data = await res.json();
      if (data.success) setArticles(data.data);
    } catch (error) {
      console.error('Failed to fetch articles');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data.success) setCategories(data.data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
  };

  const createArticle = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(newArticle),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('Article created successfully!');
        setNewArticle({
          title: '', slug: '', excerpt: '', content: '',
          category_id: 1, meta_title: '', meta_description: '',
          meta_keywords: '', is_published: true, is_featured: false,
        });
        fetchArticles();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Failed to create article');
    }
    setLoading(false);
  };

  const deleteArticle = async (id: number) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    try {
      const res = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: authHeader },
      });
      const data = await res.json();
      if (data.success) {
        fetchArticles();
        setMessage('Article deleted');
      }
    } catch (error) {
      setMessage('Failed to delete');
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-500 mt-1">FinanceDaily CMS</p>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && login()}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                onClick={login}
                className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500">Manage your articles and content</p>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Sign Out
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Total Articles</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{articles.length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Published</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{articles.filter(a => a.is_published).length}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-sm text-gray-500">Total Views</p>
            <p className="text-3xl font-bold text-primary-600 mt-1">{articles.reduce((sum, a) => sum + a.views, 0).toLocaleString()}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
          <button
            onClick={() => setActiveTab('articles')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'articles' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Articles ({articles.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'create' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            + New Article
          </button>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 p-4 rounded-xl text-sm ${
            message.includes('Error') || message.includes('Failed')
              ? 'bg-red-50 text-red-700 border border-red-100'
              : 'bg-green-50 text-green-700 border border-green-100'
          }`}>
            {message}
          </div>
        )}

        {/* Articles tab */}
        {activeTab === 'articles' && (
          <div className="bg-white rounded-xl border border-gray-100 overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Views</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {articles.map((article) => (
                  <tr key={article.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4">
                      <a
                        href={`/article/${article.slug}`}
                        target="_blank"
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                      >
                        {article.title}
                      </a>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs text-gray-500">{article.category_name}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        article.is_published
                          ? 'bg-green-50 text-green-700'
                          : 'bg-yellow-50 text-yellow-700'
                      }`}>
                        {article.is_published ? 'Published' : 'Draft'}
                      </span>
                      {article.is_featured && (
                        <span className="ml-1 text-xs font-medium px-2 py-1 rounded-full bg-amber-50 text-amber-700">
                          Featured
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{article.views.toLocaleString()}</td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {new Date(article.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => deleteArticle(article.id)}
                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {articles.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <p className="text-sm">No articles yet. Create your first article or run the automation tool.</p>
              </div>
            )}
          </div>
        )}

        {/* Create tab */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <div className="space-y-5 max-w-3xl">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input
                  type="text"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({
                    ...newArticle,
                    title: e.target.value,
                    slug: generateSlug(e.target.value),
                    meta_title: e.target.value,
                  })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Article title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={newArticle.slug}
                  onChange={(e) => setNewArticle({ ...newArticle, slug: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newArticle.category_id}
                  onChange={(e) => setNewArticle({ ...newArticle, category_id: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Excerpt</label>
                <textarea
                  value={newArticle.excerpt}
                  onChange={(e) => setNewArticle({
                    ...newArticle,
                    excerpt: e.target.value,
                    meta_description: e.target.value,
                  })}
                  rows={2}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Brief description of the article"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content (HTML) *</label>
                <textarea
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  rows={12}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
                  placeholder="<p>Article content in HTML...</p>"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Meta Keywords</label>
                <input
                  type="text"
                  value={newArticle.meta_keywords}
                  onChange={(e) => setNewArticle({ ...newArticle, meta_keywords: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newArticle.is_published}
                    onChange={(e) => setNewArticle({ ...newArticle, is_published: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Published
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={newArticle.is_featured}
                    onChange={(e) => setNewArticle({ ...newArticle, is_featured: e.target.checked })}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  Featured
                </label>
              </div>
              <button
                onClick={createArticle}
                disabled={loading || !newArticle.title || !newArticle.content}
                className="px-6 py-2.5 bg-primary-600 text-white text-sm font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Creating...' : 'Create Article'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
