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
