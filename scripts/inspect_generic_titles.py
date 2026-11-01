import json

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\cases.json', 'r', encoding='utf-8') as f:
    cases = json.load(f)

for c in cases:
    if '临床解剖学辨析' in c.get('title', ''):
        print(f"[{c['id']}] {c['chapter']} {c['caseNum']}")
        print(f"  Scenario: {c.get('scenario')[:80]}...")
        print(f"  Q1: {c.get('questions', [''])[0]}")
