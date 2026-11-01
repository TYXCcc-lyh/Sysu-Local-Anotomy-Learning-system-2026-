import json
import re

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

for c in cards:
    t = c['title'].replace('解剖核心 - ', '').replace('【大纲要点】：', '').strip()
    # If title has table or is truncated
    if '<table' in t or len(t) < 5 or t.endswith(('及', '具有支', '较上肢', '髂后上', '大', '是', '止于腓', '两个支持带，', '间增', '足底肌', '连接')):
        # derive clean title from front
        front = c['front'].replace('【大纲要点】：', '').replace('简述关于「', '').replace('简述下肢解剖核心中「', '').replace('」的相关局部解剖学要点与结构毗邻？', '').replace('的解剖学位置、构成、走行及临床意义？', '').strip()
        front_clean = re.sub(r'<[^>]+>', '', front)
        first_clause = re.split(r'[，,。:：；;\n]', front_clean)[0].strip()
        print(f"[{c['id']}] OLD: {c['title']}  ===> SUGGEST: {first_clause[:35]}")
