"""
FinanceDaily Automation - Main Script
Orchestrates news fetching, AI writing, and publishing

Usage:
  python main.py          - Run once (fetch news, generate articles, publish)
  python main.py --loop   - Run continuously (every 6 hours)
"""
import sys
import time
import random
from datetime import datetime

from config import ARTICLES_PER_RUN, OPENAI_API_KEY, NEWS_API_KEY
from news_fetcher import fetch_all_news
from ai_writer import generate_article
from publisher import publish_article, detect_category, check_site_health, slugify
from image_handler import get_article_image


def print_banner():
    print("""
╔═══════════════════════════════════════════════════╗
║        FinanceDaily Content Automation            ║
║        ─────────────────────────────              ║
║   Automated news fetching, AI writing & publishing║
╚═══════════════════════════════════════════════════╝
    """)


def print_config_status():
    """Display configuration status"""
    print("⚙️  Configuration Status:")
    print(f"   OpenAI API:  {'✅ Configured' if OPENAI_API_KEY else '⚠️  Not set (using basic content)'}")
    print(f"   NewsAPI:     {'✅ Configured' if NEWS_API_KEY else '⚠️  Not set (using placeholder news)'}")
    print(f"   Articles per run: {ARTICLES_PER_RUN}")
    print()


def run_automation():
    """Main automation pipeline"""
    start_time = datetime.now()
    print(f"\n🚀 Starting automation run at {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("─" * 50)

    # Step 1: Check if site is running
    print("\n1️⃣  Checking site health...")
    if not check_site_health():
        print("   ❌ FinanceDaily site is not running!")
        print("   → Make sure to run 'npm run dev' in the project root first")
        print("   → Site should be available at http://localhost:3000")
        return

    print("   ✅ Site is healthy and accepting requests")

    # Step 2: Fetch news
    print("\n2️⃣  Fetching latest financial news...")
    news_items = fetch_all_news()

    if not news_items:
        print("   ⚠️  No news items found. Skipping this run.")
        return

    # Step 3: Select articles to process
    selected_news = news_items[:ARTICLES_PER_RUN]
    random.shuffle(selected_news)
    print(f"\n3️⃣  Processing {len(selected_news)} articles...")

    # Step 4: Generate and publish articles
    published_count = 0
    failed_count = 0

    for i, news_item in enumerate(selected_news, 1):
        print(f"\n   [{i}/{len(selected_news)}] Processing: {news_item['title'][:50]}...")

        # Detect category
        category = detect_category(news_item['title'], news_item.get('content', ''))
        print(f"   📁 Category: {category['name']}")

        # Generate article with AI
        print(f"   🤖 Generating article...")
        article_data = generate_article(news_item, category['name'])

        if not article_data:
            print(f"   ❌ Failed to generate article")
            failed_count += 1
            continue

        # Add source URL
        article_data['source_url'] = news_item.get('url', '')

        # Download/get article image
        print(f"   🖼️  Getting image...")
        slug = slugify(article_data['title'])
        image_path = get_article_image(news_item, slug, category['id'])
        article_data['featured_image'] = image_path

        # Publish
        print(f"   📤 Publishing...")
        success = publish_article(article_data, category['id'])

        if success:
            published_count += 1
        else:
            failed_count += 1

        # Small delay between articles to be nice to APIs
        if i < len(selected_news):
            time.sleep(2)

    # Summary
    elapsed = (datetime.now() - start_time).total_seconds()
    print(f"\n{'─' * 50}")
    print(f"📊 Run Summary:")
    print(f"   ✅ Published: {published_count}")
    print(f"   ❌ Failed/Skipped: {failed_count}")
    print(f"   ⏱️  Duration: {elapsed:.1f}s")
    print(f"   🕐 Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")


def run_loop():
    """Run automation continuously"""
    interval_hours = 6
    print(f"\n🔄 Running in loop mode (every {interval_hours} hours)")
    print("   Press Ctrl+C to stop\n")

    while True:
        try:
            run_automation()
            next_run = datetime.now().strftime('%H:%M:%S')
            print(f"\n💤 Next run in {interval_hours} hours... (sleeping since {next_run})")
            time.sleep(interval_hours * 3600)
        except KeyboardInterrupt:
            print("\n\n👋 Automation stopped by user")
            break


def main():
    print_banner()
    print_config_status()

    if '--loop' in sys.argv:
        run_loop()
    else:
        run_automation()
        print("\n💡 Tip: Run with --loop flag to run continuously")
        print("   Example: python main.py --loop")


if __name__ == '__main__':
    main()
