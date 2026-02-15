"""
FinanceDaily Automation - Publisher
Publishes articles directly to the local JSON database and pushes to GitHub
"""
import re
import os
import json
import random
import subprocess
from datetime import datetime
from config import CATEGORIES

# Path to the local database - works from both script and exe
import sys
if getattr(sys, 'frozen', False):
    _script_dir = os.getcwd()  # gui_app.py sets cwd to automation dir
else:
    _script_dir = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(_script_dir, '..', 'database', 'data.json')
PROJECT_ROOT = os.path.join(_script_dir, '..')


def load_database() -> dict:
    """Load the JSON database"""
    try:
        with open(DB_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"articles": [], "nextId": 1}


def save_database(data: dict):
    """Save the JSON database"""
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


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
    Publish an article directly to the local JSON database
    
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

        # Load existing database
        db = load_database()

        # Check if article already exists (by slug)
        for existing in db['articles']:
            if existing.get('slug') == slug:
                print(f"  ⏭️  Already exists: {article_data['title'][:40]}...")
                return False

        # Get next ID
        next_id = db.get('nextId', len(db['articles']) + 1)

        # Create article object
        now = datetime.now().strftime('%Y-%m-%dT%H:%M:%S.000Z')
        article = {
            'id': next_id,
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
            'is_published': 1,
            'is_featured': 0,
            'reading_time': estimate_reading_time(article_data['content']),
            'source_url': article_data.get('source_url', ''),
            'views': random.randint(1200, 100000),
            'comments': article_data.get('comments', []),
            'created_at': now,
            'updated_at': now,
        }

        # Add to database
        db['articles'].append(article)
        db['nextId'] = next_id + 1

        # Save database
        save_database(db)

        print(f"  ✅ Published: {article_data['title'][:60]}...")
        return True

    except Exception as e:
        print(f"  ❌ Publish error: {e}")
        return False


def check_site_health() -> bool:
    """Always returns True since we write locally now"""
    return True


def git_push_changes() -> bool:
    """Commit and push changes to GitHub, then trigger Vercel deploy"""
    try:
        git_exe = r"C:\Program Files\Git\bin\git.exe"
        
        # Add all changes
        subprocess.run(
            [git_exe, 'add', '-A'],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )

        # Commit
        now = datetime.now().strftime('%Y-%m-%d %H:%M')
        result = subprocess.run(
            [git_exe, 'commit', '-m', f'Auto-publish articles - {now}'],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )

        if 'nothing to commit' in result.stdout:
            print("   ℹ️  No changes to commit")
            return True

        # Push to GitHub
        result = subprocess.run(
            [git_exe, 'push', 'origin', 'master'],
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True,
            timeout=60
        )

        if result.returncode == 0:
            print("   ✅ Pushed to GitHub")
            # Trigger Vercel deploy via API
            trigger_vercel_deploy()
            return True
        else:
            print(f"   ❌ Git push failed: {result.stderr[:200]}")
            return False

    except Exception as e:
        print(f"   ❌ Git error: {e}")
        return False


def trigger_vercel_deploy():
    """Trigger Vercel production deployment via API after git push"""
    try:
        import requests as req

        # Read Vercel CLI auth token
        appdata = os.environ.get('APPDATA', '')
        auth_path = os.path.join(appdata, 'com.vercel.cli', 'Data', 'auth.json')
        if not os.path.exists(auth_path):
            print("   ⚠️  Vercel auth not found, skipping deploy")
            return

        with open(auth_path, 'r') as f:
            token = json.load(f).get('token', '')
        if not token:
            print("   ⚠️  Vercel token empty, skipping deploy")
            return

        # Trigger deployment from GitHub repo
        r = req.post(
            'https://api.vercel.com/v13/deployments',
            headers={
                'Authorization': f'Bearer {token}',
                'Content-Type': 'application/json'
            },
            json={
                'name': 'financedaily',
                'target': 'production',
                'project': 'prj_yzWuSUfPkRoZxRkMzd4CxaxIxVBd',
                'gitSource': {
                    'type': 'github',
                    'repo': 'muhammet05520/financedaily',
                    'ref': 'master',
                    'repoId': 1156621102
                }
            },
            timeout=30
        )

        if r.status_code == 200:
            print("   🚀 Vercel deploy triggered! (~30s build)")
        else:
            print(f"   ⚠️  Vercel deploy failed ({r.status_code}), site will update on next manual deploy")

    except Exception as e:
        print(f"   ⚠️  Vercel deploy error: {e}")
