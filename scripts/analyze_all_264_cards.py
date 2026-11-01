import json

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Total cards: {len(cards)}")

by_chapter = {}
for c in cards:
    ch = c['chapter']
    by_chapter.setdefault(ch, []).append(c)

for ch, items in by_chapter.items():
    print(f"\n================ Chapter: {ch} (Total: {len(items)}) ================")
    for idx, card in enumerate(items):
        title = card['title']
        front = card['front']
        # Extract a clean, readable name for the mind map node
        clean_name = title.replace('解剖核心 - ', '').replace('【大纲要点】：', '').strip()
        if len(clean_name) > 30:
            clean_name = clean_name[:28] + '...'
        print(f"  {idx+1:02d}. [{card['id']}] {clean_name}")
