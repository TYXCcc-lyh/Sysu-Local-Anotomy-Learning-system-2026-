import json

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\cases.json', 'r', encoding='utf-8') as f:
    cases = json.load(f)

for ch in ['腹部', '盆部与会阴']:
    ch_cases = [c for c in cases if c['chapter'] == ch]
    print(f"=== {ch} ({len(ch_cases)} cases) ===")
    for idx, c in enumerate(ch_cases):
        title = c.get('title', '')
        q_count = len(c.get('questions', []))
        a_count = len(c.get('answers', []))
        sc_len = len(c.get('scenario', ''))
        print(f"  {idx+1:02d}. {title} | ScLen: {sc_len} | Qs: {q_count} | As: {a_count}")
