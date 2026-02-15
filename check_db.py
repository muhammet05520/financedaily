import json

with open('database/data.json', 'r', encoding='utf-8') as f:
    db = json.load(f)

articles = db['articles']
articles.sort(key=lambda a: a.get('created_at', ''), reverse=True)
print(f"Total articles: {len(articles)}")
print(f"\nNewest 10:")
for a in articles[:10]:
    aid = a["id"]
    pub = a.get("is_published", "?")
    cat = a.get("category_id", "?")
    created = a["created_at"][:16]
    title = a["title"][:60]
    print(f"  id={aid} | pub={pub} | cat={cat} | {created} | {title}")

print(f"\nOldest 3:")
for a in articles[-3:]:
    aid = a["id"]
    pub = a.get("is_published", "?")
    created = a["created_at"][:16]
    title = a["title"][:60]
    print(f"  id={aid} | pub={pub} | {created} | {title}")
