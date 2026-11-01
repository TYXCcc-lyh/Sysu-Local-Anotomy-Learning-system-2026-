import json
import re

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Loaded {len(cards)} cards.")

# Check for cards with "解剖核心" in their title to see how to clean their names
sample_core = [c for c in cards if "解剖核心" in c['title']]
print(f"Cards with '解剖核心': {len(sample_core)}")
for c in sample_core[:10]:
    # see front and back
    print(f"[{c['id']}] Title: {c['title']} | Front: {c['front'][:40]}...")
