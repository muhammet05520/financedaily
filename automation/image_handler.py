"""
FinanceDaily Automation - Image Handler
Downloads and manages article images
"""
import os
import re
import hashlib
import requests
from urllib.parse import urlparse

# Directory for article images - works from both script and exe
import sys
if getattr(sys, 'frozen', False):
    _base_dir = os.getcwd()  # gui_app.py sets cwd to automation dir
else:
    _base_dir = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(_base_dir, '..', 'public', 'images', 'articles')

# Category-based fallback image keywords for Picsum
CATEGORY_FALLBACKS = {
    1: 'business',    # Markets
    2: 'technology',  # Cryptocurrency
    3: 'city',        # Economy
    4: 'money',       # Personal Finance
    5: 'chart',       # Investing
    6: 'building',    # Real Estate
    7: 'computer',    # Technology
    8: 'nature',      # Commodities
}


def ensure_images_dir():
    """Create images directory if it doesn't exist"""
    os.makedirs(IMAGES_DIR, exist_ok=True)


def download_image(image_url: str, slug: str) -> str | None:
    """
    Download an image from URL and save locally.
    Returns the local path (relative to public/) or None on failure.
    """
    if not image_url or not image_url.startswith('http'):
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

        # Skip if already downloaded
        if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
            return f"/images/articles/{filename}"

        # Download
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Referer': f"https://{parsed.netloc}/",
        }
        response = requests.get(image_url, headers=headers, timeout=15, stream=True)
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get('content-type', '')
        if 'image' not in content_type and 'octet-stream' not in content_type:
            print(f"    [!] Not an image ({content_type})")
            return None

        # Check minimum size (skip tiny images/tracking pixels)
        content_length = int(response.headers.get('content-length', 0))
        if content_length > 0 and content_length < 5000:
            print(f"    [!] Image too small ({content_length} bytes)")
            return None

        # Save image
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)

        # Verify file size
        filesize = os.path.getsize(filepath)
        if filesize < 5000:
            os.remove(filepath)
            print(f"    [!] Downloaded image too small ({filesize} bytes), removed")
            return None

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
    Generate a fallback image using a free image service.
    Downloads a relevant stock photo based on category.
    """
    ensure_images_dir()

    # Use picsum.photos for a random but consistent photo (seeded by slug hash)
    seed = int(hashlib.md5(slug.encode()).hexdigest()[:8], 16) % 1000
    fallback_url = f"https://picsum.photos/seed/{seed}/800/450"

    filename = f"{slug}.jpg"
    filepath = os.path.join(IMAGES_DIR, filename)

    if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
        return f"/images/articles/{filename}"

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
            print(f"    📷 Fallback image saved: {filename} ({filesize // 1024}KB)")
            return f"/images/articles/{filename}"
        else:
            os.remove(filepath)

    except Exception as e:
        print(f"    [!] Fallback image error: {e}")

    return ""


def get_article_image(news_item: dict, slug: str, category_id: int = 1) -> str:
    """
    Get the best available image for an article.
    Tries: 1) NewsAPI image URL, 2) Fallback stock photo
    Returns local path or empty string.
    """
    # Try original image from news source
    image_url = news_item.get('image_url', '')
    if image_url:
        local_path = download_image(image_url, slug)
        if local_path:
            return local_path

    # Fallback to stock photo
    print(f"    📷 Using fallback image...")
    return get_fallback_image(slug, category_id)
