with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find all "临床病例分析"
matches = list(re.finditer(r'临床病例分析', text))
print("Occurrences of 临床病例分析:", len(matches))
for idx, m in enumerate(matches):
    start = max(0, m.start() - 60)
    end = min(len(text), m.start() + 200)
    print(f"\n[{idx+1}] Pos {m.start()}:")
    print(text[start:end].replace('\n', ' '))
