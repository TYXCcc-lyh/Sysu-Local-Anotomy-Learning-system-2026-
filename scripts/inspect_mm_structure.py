import json

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\mindmap.js', 'r', encoding='utf-8') as f:
    text = f.read()

json_str = text.replace('window.ANATOMY_MINDMAP = ', '').rstrip(';\n ')
mm = json.loads(json_str)

print("Existing mind map top-level children:")
for c in mm.get('children', []):
    print(f"  {c['name']} ({c.get('chapter')}) - subchildren: {len(c.get('children', []))}")
    for sub in c.get('children', []):
        print(f"    - {sub['name']} ({len(sub.get('children', []))} items)")
