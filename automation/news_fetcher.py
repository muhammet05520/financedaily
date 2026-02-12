"""
FinanceDaily Automation - News Fetcher
Fetches latest financial news from NewsAPI and other sources
"""
import os
import json
import requests
import random
from datetime import datetime, timedelta
from config import NEWS_API_KEY, FINNHUB_API_KEY, NEWS_TOPICS


def fetch_news_from_newsapi(query: str, page_size: int = 5) -> list:
    """Fetch news articles from NewsAPI.org"""
    if not NEWS_API_KEY:
        print(f"  [!] NewsAPI key not configured, using placeholder for: {query}")
        return generate_placeholder_news(query)

    url = 'https://newsapi.org/v2/everything'
    params = {
        'q': query,
        'language': 'en',
        'sortBy': 'publishedAt',
        'pageSize': page_size,
        'apiKey': NEWS_API_KEY,
    }

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('status') != 'ok':
            print(f"  [!] NewsAPI error: {data.get('message', 'Unknown error')}")
            return []

        articles = []
        for article in data.get('articles', []):
            if article.get('title') and article['title'] != '[Removed]':
                articles.append({
                    'title': article['title'],
                    'description': article.get('description', ''),
                    'content': article.get('content', article.get('description', '')),
                    'source': article.get('source', {}).get('name', 'Unknown'),
                    'url': article.get('url', ''),
                    'image_url': article.get('urlToImage', ''),
                    'published_at': article.get('publishedAt', ''),
                })

        return articles

    except Exception as e:
        print(f"  [!] NewsAPI fetch error: {e}")
        return []


def fetch_market_data() -> dict:
    """Fetch real-time market data from Finnhub"""
    if not FINNHUB_API_KEY:
        return get_placeholder_market_data()

    symbols = {
        'AAPL': 'Apple',
        'GOOGL': 'Alphabet',
        'MSFT': 'Microsoft',
        'AMZN': 'Amazon',
        'TSLA': 'Tesla',
    }

    market_data = {}
    for symbol, name in symbols.items():
        try:
            url = f'https://finnhub.io/api/v1/quote?symbol={symbol}&token={FINNHUB_API_KEY}'
            response = requests.get(url, timeout=5)
            data = response.json()
            market_data[symbol] = {
                'name': name,
                'price': data.get('c', 0),
                'change': data.get('d', 0),
                'change_percent': data.get('dp', 0),
            }
        except Exception as e:
            print(f"  [!] Finnhub error for {symbol}: {e}")

    return market_data


def get_existing_titles() -> set:
    """Get titles of already published articles from database"""
    try:
        db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'database', 'data.json')
        with open(db_path, 'r', encoding='utf-8') as f:
            db = json.load(f)
        # Return set of lowercase title keywords for fuzzy matching
        titles = set()
        for article in db.get('articles', []):
            title = article.get('title', '').lower().strip()
            titles.add(title)
            # Also add key phrases (first 5 words) for fuzzy matching
            words = title.split()[:5]
            if len(words) >= 3:
                titles.add(' '.join(words))
        return titles
    except:
        return set()


def is_duplicate(title: str, existing_titles: set) -> bool:
    """Check if a news title is too similar to existing articles"""
    title_lower = title.lower().strip()
    
    # Exact match
    if title_lower in existing_titles:
        return True
    
    # Check if first 5 words match any existing article
    words = title_lower.split()[:5]
    if len(words) >= 3:
        key_phrase = ' '.join(words)
        for existing in existing_titles:
            if key_phrase in existing or existing in key_phrase:
                return True
    
    # Check word overlap (if >70% words match, it's likely the same topic)
    title_words = set(title_lower.split())
    # Remove common words
    stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'in', 'on', 'at', 'to', 'for', 'of', 'and', 'or', 'as', 'by', 'with', 'from', 'its', 'it', 'this', 'that', 'how', 'why', 'what'}
    title_words -= stop_words
    
    if len(title_words) >= 3:
        for existing in existing_titles:
            existing_words = set(existing.split()) - stop_words
            if len(existing_words) >= 3:
                overlap = title_words & existing_words
                similarity = len(overlap) / max(len(title_words), len(existing_words))
                if similarity >= 0.7:
                    return True
    
    return False


def fetch_all_news() -> list:
    """Fetch news from all topics, filtering out already published articles"""
    all_news = []
    print("\n📰 Fetching news from all topics...")

    for topic in NEWS_TOPICS:
        print(f"  → Searching: {topic}")
        news = fetch_news_from_newsapi(topic, page_size=3)
        all_news.extend(news)

    # Remove duplicates based on title (within fetched news)
    seen_titles = set()
    unique_news = []
    for article in all_news:
        title_key = article['title'].lower().strip()
        if title_key not in seen_titles:
            seen_titles.add(title_key)
            unique_news.append(article)

    print(f"  ✓ Found {len(unique_news)} unique news articles")

    # Filter out articles that are already in our database
    existing_titles = get_existing_titles()
    if existing_titles:
        new_articles = []
        for article in unique_news:
            if is_duplicate(article['title'], existing_titles):
                print(f"  ⏭️  Zaten mevcut: {article['title'][:50]}...")
            else:
                new_articles.append(article)
        
        print(f"  ✓ {len(new_articles)} YENİ makale bulundu ({len(unique_news) - len(new_articles)} atlandı)")
        return new_articles

    return unique_news


def generate_placeholder_news(query: str) -> list:
    """Generate placeholder news when API is not configured"""
    topics = {
        'stock market': [
            {
                'title': 'S&P 500 Reaches New All-Time High Amid Strong Earnings Season',
                'description': 'The S&P 500 index surged to a record high as major corporations reported better-than-expected quarterly earnings, boosting investor confidence across sectors.',
                'content': 'The S&P 500 reached new heights today, driven by exceptional earnings reports from technology and healthcare sectors. Analysts attribute the rally to strong consumer spending, improving corporate profitability, and optimistic forward guidance from major companies. Trading volume was above average as institutional investors increased their equity exposure.',
                'source': 'Market Watch',
                'url': '',
                'published_at': datetime.now().isoformat(),
            },
        ],
        'cryptocurrency bitcoin': [
            {
                'title': 'Bitcoin Adoption Accelerates as Major Banks Launch Crypto Services',
                'description': 'Leading global banks are rapidly expanding their cryptocurrency offerings, signaling a new era of institutional crypto adoption.',
                'content': 'Several major banks announced expanded cryptocurrency services this week, including custody solutions, trading platforms, and crypto-backed lending products. The move represents a significant shift in traditional finance attitudes toward digital assets. Industry experts predict this trend will accelerate as regulatory frameworks become clearer in key markets.',
                'source': 'CoinDesk',
                'url': '',
                'published_at': datetime.now().isoformat(),
            },
        ],
        'federal reserve economy': [
            {
                'title': 'Economic Growth Remains Resilient Despite Global Uncertainties',
                'description': 'Latest economic indicators show continued resilience in the US economy, with strong employment data and steady consumer spending.',
                'content': 'The US economy continues to demonstrate remarkable resilience amid global uncertainties. Employment figures exceeded expectations, while consumer confidence indicators remain elevated. The Federal Reserve is closely monitoring these trends as it considers its monetary policy path forward. Economists suggest the economy may be achieving a soft landing after the aggressive rate-hiking cycle.',
                'source': 'Reuters',
                'url': '',
                'published_at': datetime.now().isoformat(),
            },
        ],
        'personal finance investing': [
            {
                'title': 'Expert Tips for Building a Recession-Proof Investment Portfolio',
                'description': 'Financial advisors share proven strategies for protecting your wealth during economic downturns while positioning for long-term growth.',
                'content': 'With economic uncertainty on the horizon, financial experts recommend diversifying portfolios across multiple asset classes. Key strategies include maintaining adequate cash reserves, investing in quality dividend-paying stocks, and considering inflation-protected securities. The emphasis is on long-term thinking and avoiding emotional decision-making during market volatility.',
                'source': 'Investopedia',
                'url': '',
                'published_at': datetime.now().isoformat(),
            },
        ],
        'real estate market': [
            {
                'title': 'Housing Market Shows Signs of Stabilization as Mortgage Rates Ease',
                'description': 'The real estate market is finding its footing as mortgage rates begin to moderate, bringing some relief to homebuyers.',
                'content': 'After months of elevated mortgage rates, the housing market is showing signs of stabilization. Home sales have ticked up in several key markets, and inventory levels are gradually improving. Real estate analysts suggest that the worst of the housing affordability crisis may be behind us, though prices remain elevated in most metropolitan areas.',
                'source': 'Realtor',
                'url': '',
                'published_at': datetime.now().isoformat(),
            },
        ],
        'fintech': [
            {
                'title': 'AI-Powered Financial Tools Are Transforming How People Manage Money',
                'description': 'Artificial intelligence is revolutionizing personal finance management, from automated investing to intelligent budgeting.',
                'content': 'The fintech industry is experiencing a wave of AI-powered innovation. New tools are making sophisticated financial planning accessible to everyday consumers. From robo-advisors that optimize portfolios in real-time to AI chatbots that provide personalized financial advice, technology is democratizing wealth management in unprecedented ways.',
                'source': 'TechCrunch',
                'url': '',
                'published_at': datetime.now().isoformat(),
            },
        ],
        'gold oil commodities': [
            {
                'title': 'Gold Prices Climb as Investors Seek Safe-Haven Assets',
                'description': 'Gold continues its upward trajectory as geopolitical tensions and economic uncertainty drive demand for traditional safe-haven investments.',
                'content': 'Gold prices have risen for the fourth consecutive week, driven by increased demand from central banks and institutional investors seeking portfolio protection. Meanwhile, oil prices remain volatile amid shifting supply dynamics and changing demand patterns. Commodity analysts suggest that precious metals may continue to outperform as the global economic outlook remains uncertain.',
                'source': 'Bloomberg',
                'url': '',
                'published_at': datetime.now().isoformat(),
            },
        ],
    }

    return topics.get(query, topics.get('stock market', []))


def get_placeholder_market_data() -> dict:
    """Return placeholder market data"""
    return {
        'SPY': {'name': 'S&P 500', 'price': 523.42, 'change': 4.56, 'change_percent': 0.88},
        'BTC': {'name': 'Bitcoin', 'price': 101234, 'change': 2456, 'change_percent': 2.45},
        'GOLD': {'name': 'Gold', 'price': 2089.50, 'change': 7.10, 'change_percent': 0.34},
    }
