import json
import re

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

print(f"Total cards: {len(cards)}")

def clean_card_title(card):
    t = card['title'].replace('解剖核心 - ', '').replace('【大纲要点】：', '').strip()
    if '<table' in t:
        if '十二指肠' in card['front'] and '胆总管' in card['back'] or '探查引流' in card['front']:
            return "胆总管分段（上段/后段/胰腺段/壁内段）与毗邻"
        elif '胰头' in card['front'] or '胰颈' in card['front']:
            return "胰各部（胰头/胰颈/胰体/胰尾）形态与毗邻"
        else:
            return "脏器解剖毗邻与分部汇总"
    
    # Check if starts with 掌握 / 熟悉 / 了解
    m = re.match(r'^(?:掌握|熟悉|了解)(.+)', t)
    if m:
        core = m.group(1).strip(' ：:，,。')
        return core
        
    return t

for c in cards:
    cleaned = clean_card_title(c)
    if cleaned != c['title']:
        print(f"[{c['id']}] OLD: {c['title']} ---> NEW: {cleaned}")
