"""
FinanceDaily Automation - Configuration
"""
import os
import sys
from dotenv import load_dotenv

# Find .env.local - works both as script and as exe
if getattr(sys, 'frozen', False):
    _base = os.path.dirname(sys.executable)
else:
    _base = os.path.dirname(os.path.abspath(__file__))

# Try multiple possible locations for .env.local
for _try_path in [
    os.path.join(_base, '..', '.env.local'),
    os.path.join(_base, '.env.local'),
    os.path.join(os.getcwd(), '..', '.env.local'),
    os.path.join(os.getcwd(), '.env.local'),
]:
    if os.path.exists(_try_path):
        load_dotenv(_try_path)
        break
else:
    load_dotenv()  # fallback to default

# Site configuration
SITE_URL = os.getenv('SITE_URL', 'http://localhost:3000')
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'changeme123')

# API Keys
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')
NEWS_API_KEY = os.getenv('NEWS_API_KEY', '')
FINNHUB_API_KEY = os.getenv('FINNHUB_API_KEY', '')

# Content settings
ARTICLES_PER_RUN = 5  # Number of articles to generate per run
MIN_ARTICLE_WORDS = 600
MAX_ARTICLE_WORDS = 1200

# Categories mapping
CATEGORIES = {
    'markets': {'id': 1, 'name': 'Markets', 'keywords': ['stock market', 'S&P 500', 'Wall Street', 'shares', 'equity']},
    'cryptocurrency': {'id': 2, 'name': 'Cryptocurrency', 'keywords': ['bitcoin', 'crypto', 'ethereum', 'blockchain', 'defi']},
    'economy': {'id': 3, 'name': 'Economy', 'keywords': ['economy', 'GDP', 'federal reserve', 'inflation', 'employment']},
    'personal-finance': {'id': 4, 'name': 'Personal Finance', 'keywords': ['saving', 'budget', 'credit', 'loans', 'retirement']},
    'investing': {'id': 5, 'name': 'Investing', 'keywords': ['investment', 'portfolio', 'ETF', 'mutual fund', 'dividend']},
    'real-estate': {'id': 6, 'name': 'Real Estate', 'keywords': ['real estate', 'housing', 'mortgage', 'property', 'REIT']},
    'technology': {'id': 7, 'name': 'Technology', 'keywords': ['fintech', 'AI finance', 'banking', 'payment', 'digital']},
    'commodities': {'id': 8, 'name': 'Commodities', 'keywords': ['gold', 'oil', 'silver', 'commodity', 'metals']},
}

# News sources - topics to search
NEWS_TOPICS = [
    'stock market',
    'cryptocurrency bitcoin',  
    'federal reserve economy',
    'personal finance investing',
    'real estate market',
    'fintech',
    'gold oil commodities',
]

# OpenAI settings
AI_MODEL = 'gpt-4o-mini'  # Cost-effective model, can upgrade to gpt-4o
AI_TEMPERATURE = 0.7
