import json

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Total Flashcards: {len(cards)}")
ch_groups = {}
for c in cards:
    ch = c['chapter']
    ch_groups.setdefault(ch, []).append(c)

for ch, items in ch_groups.items():
    print(f"\n================ {ch} ({len(items)} cards) ================")
    for idx, c in enumerate(items):
        print(f"  {idx+1:02d}. [{c['id']}] {c['title']}")
