"""
FinanceDaily Automation - Image Handler
Downloads and manages article images with quality validation
"""
import os
import re
import hashlib
import requests
from urllib.parse import urlparse
from io import BytesIO

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

# Directory for article images - works from both script and exe
import sys
if getattr(sys, 'frozen', False):
    _base_dir = os.getcwd()  # gui_app.py sets cwd to automation dir
else:
    _base_dir = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(_base_dir, '..', 'public', 'images', 'articles')

# Category-based search keywords for Unsplash
CATEGORY_KEYWORDS = {
    1: 'stock-market-trading',
    2: 'cryptocurrency-bitcoin',
    3: 'global-economy-finance',
    4: 'money-savings-finance',
    5: 'investment-portfolio',
    6: 'real-estate-building',
    7: 'technology-computer',
    8: 'commodities-gold-oil',
}

# Known bad image URL patterns (logos, tracking pixels, placeholders)
BAD_URL_PATTERNS = [
    'logo', 'favicon', 'icon', 'avatar', 'badge', 'tracking', 'pixel',
    'spacer', 'blank', 'placeholder', 'default', 'gravatar', 'widget',
    'button', 'banner_ad', 'ipboard', '1x1', 'sprite', 'spinner',
    'branding', 'masthead', 'wp-content/plugins', 'feedburner',
]

# Known bad image domains (news aggregators, content platforms with logos)
BAD_DOMAINS = [
    'invisioncommunity.com', 'ipboard.com', 'gravatar.com',
    'wp.com/i/', 'assets.bwbx.io/s3', 'static.seekingalpha.com/uploads/sa_avatars',
]


def ensure_images_dir():
    """Create images directory if it doesn't exist"""
    os.makedirs(IMAGES_DIR, exist_ok=True)


def is_bad_image_url(url: str) -> bool:
    """Check if URL is likely a logo, icon, or low-quality image"""
    lower = url.lower()
    for pattern in BAD_URL_PATTERNS:
        if pattern in lower:
            return True
    for domain in BAD_DOMAINS:
        if domain in lower:
            return True
    return False


def validate_image_quality(image_data: bytes, min_width=500, min_height=300) -> bool:
    """
    Validate image dimensions using PIL.
    Returns True if image meets quality standards.
    """
    if not HAS_PIL:
        # Without PIL, just check file size (>30KB is likely a real photo)
        return len(image_data) > 30000

    try:
        img = Image.open(BytesIO(image_data))
        w, h = img.size
        if w < min_width or h < min_height:
            print(f"    [!] Image too small: {w}x{h} (need {min_width}x{min_height}+)")
            return False
        # Check aspect ratio - reject very narrow or very tall images (likely banners/logos)
        ratio = w / h
        if ratio > 4 or ratio < 0.3:
            print(f"    [!] Bad aspect ratio: {ratio:.1f}")
            return False
        return True
    except Exception:
        return len(image_data) > 30000


def download_image(image_url: str, slug: str) -> str | None:
    """
    Download an image from URL and save locally.
    Returns the local path (relative to public/) or None on failure.
    """
    if not image_url or not image_url.startswith('http'):
        return None

    # Reject known bad URLs before downloading
    if is_bad_image_url(image_url):
        print(f"    [!] Rejected bad image URL pattern")
        return None

    ensure_images_dir()

    try:
        # Determine file extension
        parsed = urlparse(image_url)
        path = parsed.path.lower()
        if '.png' in path:
            ext = '.png'
        elif '.webp' in path:
            ext = '.webp'
        elif '.gif' in path:
            ext = '.gif'
        else:
            ext = '.jpg'

        filename = f"{slug}{ext}"
        filepath = os.path.join(IMAGES_DIR, filename)

        # Skip if already downloaded and validated
        if os.path.exists(filepath) and os.path.getsize(filepath) > 30000:
            return f"/images/articles/{filename}"

        # Download
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': f"https://{parsed.netloc}/",
        }
        response = requests.get(image_url, headers=headers, timeout=15)
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get('content-type', '')
        if 'image' not in content_type and 'octet-stream' not in content_type:
            print(f"    [!] Not an image ({content_type})")
            return None

        # Validate image quality (dimensions + size)
        image_data = response.content
        if not validate_image_quality(image_data):
            print(f"    [!] Image failed quality check ({len(image_data)} bytes)")
            return None

        # Save image
        with open(filepath, 'wb') as f:
            f.write(image_data)

        filesize = os.path.getsize(filepath)
        print(f"    📷 Image saved: {filename} ({filesize // 1024}KB)")
        return f"/images/articles/{filename}"

    except requests.exceptions.Timeout:
        print(f"    [!] Image download timeout")
        return None
    except requests.exceptions.HTTPError as e:
        print(f"    [!] Image download HTTP error: {e.response.status_code}")
        return None
    except Exception as e:
        print(f"    [!] Image download error: {e}")
        return None


def get_fallback_image(slug: str, category_id: int = 1) -> str:
    """
    Get a high-quality fallback image from Unsplash.
    Falls back to picsum.photos if Unsplash fails.
    """
    ensure_images_dir()

    filename = f"{slug}.jpg"
    filepath = os.path.join(IMAGES_DIR, filename)

    if os.path.exists(filepath) and os.path.getsize(filepath) > 30000:
        return f"/images/articles/{filename}"

    keyword = CATEGORY_KEYWORDS.get(category_id, 'finance')

    # Try Unsplash Source (free, no key needed, 800x450 crop)
    unsplash_url = f"https://source.unsplash.com/800x450/?{keyword}"
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
        response = requests.get(unsplash_url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()

        if len(response.content) > 10000 and 'image' in response.headers.get('content-type', ''):
            with open(filepath, 'wb') as f:
                f.write(response.content)
            filesize = os.path.getsize(filepath)
            if filesize > 10000:
                print(f"    📷 Unsplash image saved: {filename} ({filesize // 1024}KB)")
                return f"/images/articles/{filename}"
    except Exception as e:
        print(f"    [!] Unsplash fallback error: {e}")

    # Last resort: picsum.photos random image
    seed = int(hashlib.md5(slug.encode()).hexdigest()[:8], 16) % 1000
    fallback_url = f"https://picsum.photos/seed/{seed}/800/450"

    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        }
        response = requests.get(fallback_url, headers=headers, timeout=15, allow_redirects=True)
        response.raise_for_status()

        with open(filepath, 'wb') as f:
            f.write(response.content)

        filesize = os.path.getsize(filepath)
        if filesize > 5000:
            print(f"    📷 Picsum fallback saved: {filename} ({filesize // 1024}KB)")
            return f"/images/articles/{filename}"
        else:
            os.remove(filepath)

    except Exception as e:
        print(f"    [!] Picsum fallback error: {e}")

    # Return empty - frontend ArticleImage component will show gradient fallback
    return ""


def get_article_image(news_item: dict, slug: str, category_id: int = 1) -> str:
    """
    Get the best available image for an article.
    Pipeline: 1) Validate NewsAPI image, 2) Unsplash fallback, 3) Picsum fallback
    Frontend has its own gradient fallback if all fail.
    """
    # Try original image from news source
    image_url = news_item.get('image_url', '')
    if image_url:
        local_path = download_image(image_url, slug)
        if local_path:
            return local_path
        print(f"    📷 NewsAPI image rejected, trying fallback...")

    # Fallback to stock photo
    return get_fallback_image(slug, category_id)
