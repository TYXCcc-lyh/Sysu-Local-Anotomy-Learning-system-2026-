import json

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

for c in cards:
    cid = c['id']
    # Check if id has numbers > 139
    if any(prefix in cid for prefix in ['头部', '颈部', '胸部', '腹部']):
        print(f"[{cid}] ({c['chapter']}) Title: {c['title']} | Front: {c['front'][:40]}")
