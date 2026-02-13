"""
FinanceDaily Automation - AI Article Writer
Uses OpenAI API to generate high-quality financial articles
"""
import re
from openai import OpenAI
from config import OPENAI_API_KEY, AI_MODEL, AI_TEMPERATURE, MIN_ARTICLE_WORDS, MAX_ARTICLE_WORDS


def get_client():
    """Get OpenAI client"""
    if not OPENAI_API_KEY:
        return None
    return OpenAI(api_key=OPENAI_API_KEY)


def generate_article(news_item: dict, category_name: str) -> dict | None:
    """
    Generate a full article based on a news item using AI.
    Returns article data or None if AI is not configured.
    """
    client = get_client()
    
    if not client:
        print("  [!] OpenAI API key not configured, using enhanced content")
        return enhance_without_ai(news_item, category_name)

    try:
        prompt = f"""You are a professional financial journalist writing for FinanceDaily, a reputable financial news website. 
Write a comprehensive, well-researched article based on the following news:

HEADLINE: {news_item['title']}
SUMMARY: {news_item.get('description', '')}
SOURCE CONTENT: {news_item.get('content', '')}
CATEGORY: {category_name}

REQUIREMENTS:
1. Write {MIN_ARTICLE_WORDS}-{MAX_ARTICLE_WORDS} words
2. Use a professional, authoritative tone
3. Include relevant market context and data
4. Add expert-style analysis and insights
5. Include practical takeaways for investors/readers
6. Use proper HTML formatting with <h2>, <p>, <ul>, <li>, <strong> tags
7. Do NOT copy the original text - rewrite everything in your own words
8. Add 2-3 subheadings (h2 tags) to structure the content
9. Include a "Key Takeaways" or "What This Means for Investors" section
10. Make it SEO-friendly with natural keyword usage

FORMAT YOUR RESPONSE AS JSON with these fields:
{{
  "title": "An engaging, SEO-optimized headline (different from original)",
  "excerpt": "A compelling 1-2 sentence summary (150 chars max)",
  "content": "Full HTML article content",
  "meta_title": "SEO title for search engines (60 chars max)",
  "meta_description": "SEO description (155 chars max)",
  "meta_keywords": "comma-separated relevant keywords"
}}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks."""

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "You are a professional financial journalist. Always respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=AI_TEMPERATURE,
            max_tokens=2000,
        )

        content = response.choices[0].message.content.strip()
        
        # Clean up response - remove markdown code blocks if present
        if content.startswith('```'):
            content = re.sub(r'^```(?:json)?\s*', '', content)
            content = re.sub(r'\s*```$', '', content)

        import json
        article_data = json.loads(content)
        
        print(f"  ✓ AI generated: {article_data['title'][:60]}...")
        return article_data

    except Exception as e:
        print(f"  [!] AI generation error: {e}")
        return enhance_without_ai(news_item, category_name)


def generate_seo_metadata(title: str, content: str, category: str) -> dict:
    """Generate SEO metadata for an article"""
    client = get_client()
    
    if not client:
        return {
            'meta_title': title[:60],
            'meta_description': content[:155].replace('<p>', '').replace('</p>', ''),
            'meta_keywords': f"{category.lower()}, finance, {title.split()[0].lower()}, news, analysis",
        }

    try:
        prompt = f"""Generate SEO metadata for this financial article:
Title: {title}
Category: {category}

Return JSON with:
- meta_title: SEO title (max 60 chars, include "FinanceDaily")
- meta_description: Meta description (max 155 chars, compelling)
- meta_keywords: 6-8 relevant keywords, comma-separated

Return ONLY valid JSON."""

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "SEO specialist. Respond with valid JSON only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200,
        )

        content_resp = response.choices[0].message.content.strip()
        if content_resp.startswith('```'):
            content_resp = re.sub(r'^```(?:json)?\s*', '', content_resp)
            content_resp = re.sub(r'\s*```$', '', content_resp)

        import json
        return json.loads(content_resp)

    except Exception as e:
        print(f"  [!] SEO metadata generation error: {e}")
        return {
            'meta_title': f"{title[:50]} | FinanceDaily",
            'meta_description': title[:155],
            'meta_keywords': f"{category.lower()}, finance, news",
        }


def generate_comments(client, article_title: str, article_excerpt: str, category_name: str) -> list:
    """
    Generate 3-20 realistic comments for an article.
    ~70% topic-related, ~30% site-praising (natural tone).
    """
    import random
    count = random.randint(3, 20)
    praise_count = max(1, round(count * 0.3))
    topic_count = count - praise_count

    try:
        prompt = f"""Generate {count} realistic reader comments for this finance article.

ARTICLE TITLE: {article_title}
ARTICLE SUMMARY: {article_excerpt}
CATEGORY: {category_name}

RULES:
1. Generate exactly {topic_count} comments about the article topic (analysis, opinions, questions, insights)
2. Generate exactly {praise_count} comments that subtly appreciate the site/content quality (NOT "I love this site" — be natural and varied, like "Been following this coverage for a while, always solid analysis" or "This is the kind of breakdown other sites miss" or "Finally a finance site that explains things clearly")
3. Each comment must be 1-3 sentences, casual but intelligent tone
4. Vary the writing style — some short and punchy, some longer and thoughtful
5. Mix of agreement, mild disagreement, questions, and personal experience
6. Never mention "FinanceDaily" by name — just say "this site", "here", "you guys" etc.
7. Make them sound like real people, not bots

Return as JSON array of objects:
[{{"name": "First Last", "text": "comment text"}}]

Use diverse American/English names. Return ONLY valid JSON array, no markdown."""

        response = client.chat.completions.create(
            model=AI_MODEL,
            messages=[
                {"role": "system", "content": "Generate realistic website comments. Respond with valid JSON array only."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.9,
            max_tokens=1500,
        )

        content = response.choices[0].message.content.strip()
        if content.startswith('```'):
            content = re.sub(r'^```(?:json)?\s*', '', content)
            content = re.sub(r'\s*```$', '', content)

        import json
        comments = json.loads(content)

        # Add metadata to each comment
        avatar_colors = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1']
        result = []
        for i, c in enumerate(comments):
            # Random date within last 7 days
            from datetime import datetime, timedelta
            days_ago = random.randint(0, 6)
            hours_ago = random.randint(0, 23)
            comment_date = datetime.now() - timedelta(days=days_ago, hours=hours_ago)

            result.append({
                'id': i + 1,
                'name': c.get('name', f'Reader {i+1}'),
                'text': c.get('text', ''),
                'avatar_color': random.choice(avatar_colors),
                'date': comment_date.strftime('%Y-%m-%dT%H:%M:%S.000Z'),
                'likes': random.randint(0, 45),
            })

        # Sort by date (newest first)
        result.sort(key=lambda x: x['date'], reverse=True)
        # Re-assign IDs
        for i, c in enumerate(result):
            c['id'] = i + 1

        print(f"  ✓ Generated {len(result)} comments ({topic_count} topic + {praise_count} praise)")
        return result

    except Exception as e:
        print(f"  [!] Comment generation error: {e}")
        return []


def enhance_without_ai(news_item: dict, category_name: str) -> dict:
    """
    Create an enhanced article without AI when API key is not available.
    Uses the source content and adds structure.
    """
    title = news_item['title']
    description = news_item.get('description', '')
    source_content = news_item.get('content', description)
    source = news_item.get('source', 'Industry Sources')

    # Build content
    content = f"""<p>{description}</p>

<h2>Market Context</h2>
<p>{source_content}</p>

<h2>What This Means for Investors</h2>
<p>This development in the {category_name.lower()} space represents a noteworthy shift that investors should be monitoring closely. Market participants are advised to consider how this news fits into their broader investment strategy and risk management framework.</p>

<p>Key factors to watch include:</p>
<ul>
<li><strong>Short-term impact:</strong> Markets may react to this news in the coming trading sessions</li>
<li><strong>Long-term implications:</strong> Consider how this fits into broader market trends</li>
<li><strong>Portfolio positioning:</strong> Review your exposure to related sectors and asset classes</li>
</ul>

<h2>Expert Perspective</h2>
<p>Industry analysts suggest that developments like these require careful analysis before making investment decisions. It's important to consider multiple viewpoints and maintain a diversified approach to portfolio management.</p>

<p><em>This article is based on information from {source} and has been enhanced with additional market context. It is for informational purposes only and should not be considered investment advice.</em></p>"""

    return {
        'title': title,
        'excerpt': description[:150] if description else title[:150],
        'content': content,
        'meta_title': f"{title[:50]} | FinanceDaily",
        'meta_description': (description or title)[:155],
        'meta_keywords': f"{category_name.lower()}, finance, markets, analysis, news",
    }
