with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\MinerU_markdown_zy局部解剖学_2114991686827278336.md', 'r', encoding='utf-8') as f:
    t = f.read()

import re
matches = list(re.finditer(r'病例|临床病例', t))
print(f"Total '病例' in zy局部解剖学.md: {len(matches)}")
for m in matches:
    pos = m.start()
    print("--- MATCH AT", pos, "---")
    print(t[max(0, pos-50):min(len(t), pos+200)].replace('\n', ' '))
