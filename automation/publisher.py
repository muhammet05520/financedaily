"""
FinanceDaily Automation - Publisher
Publishes articles to the FinanceDaily site via API
"""
import re
import random
import requests
from base64 import b64encode
from config import SITE_URL, ADMIN_USERNAME, ADMIN_PASSWORD, CATEGORIES


def get_auth_header() -> str:
    """Generate Basic Auth header"""
    credentials = b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
    return f"Basic {credentials}"


def slugify(text: str) -> str:
    """Convert text to URL-friendly slug"""
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text[:80]  # Limit slug length


def detect_category(title: str, content: str) -> dict:
    """Detect the best category for an article based on keywords"""
    text = f"{title} {content}".lower()
    
    best_match = None
    best_score = 0

    for slug, cat_info in CATEGORIES.items():
        score = sum(1 for keyword in cat_info['keywords'] if keyword.lower() in text)
        if score > best_score:
            best_score = score
            best_match = cat_info

    # Default to Markets if no match
    return best_match or CATEGORIES['markets']


def estimate_reading_time(content: str) -> int:
    """Estimate reading time in minutes"""
    text = re.sub(r'<[^>]+>', '', content)
    words = len(text.split())
    return max(1, round(words / 200))


def publish_article(article_data: dict, category_id: int = None) -> bool:
    """
    Publish an article via the FinanceDaily API
    
    Args:
        article_data: dict with title, excerpt, content, meta_title, meta_description, meta_keywords
        category_id: optional category ID, will auto-detect if not provided
    
    Returns:
        True if published successfully
    """
    try:
        # Auto-detect category if not provided
        if not category_id:
            cat = detect_category(article_data['title'], article_data.get('content', ''))
            category_id = cat['id']

        # Generate slug
        slug = slugify(article_data['title'])

        # Prepare payload
        payload = {
            'title': article_data['title'],
            'slug': slug,
            'excerpt': article_data.get('excerpt', '')[:200],
            'content': article_data['content'],
            'featured_image': article_data.get('featured_image', ''),
            'category_id': category_id,
            'author': 'FinanceDaily Team',
            'meta_title': article_data.get('meta_title', article_data['title'])[:60],
            'meta_description': article_data.get('meta_description', '')[:160],
            'meta_keywords': article_data.get('meta_keywords', ''),
            'is_published': True,
            'is_featured': False,
            'reading_time': estimate_reading_time(article_data['content']),
            'source_url': article_data.get('source_url', ''),
            'views': random.randint(1200, 100000),
        }

        # POST to API
        url = f"{SITE_URL}/api/articles"
        headers = {
            'Content-Type': 'application/json',
            'Authorization': get_auth_header(),
        }

        response = requests.post(url, json=payload, headers=headers, timeout=10)
        
        if response.status_code == 201:
            data = response.json()
            print(f"  ✅ Published: {article_data['title'][:60]}...")
            return True
        elif response.status_code == 409:
            print(f"  ⏭️  Already exists: {article_data['title'][:40]}...")
            return False
        else:
            print(f"  ❌ Failed ({response.status_code}): {response.text[:100]}")
            return False

    except requests.ConnectionError:
        print(f"  ❌ Connection error - Is the site running at {SITE_URL}?")
        return False
    except Exception as e:
        print(f"  ❌ Publish error: {e}")
        return False


def check_site_health() -> bool:
    """Check if the FinanceDaily site is running"""
    try:
        response = requests.get(f"{SITE_URL}/api/categories", timeout=5)
        return response.status_code == 200
    except:
        return False
