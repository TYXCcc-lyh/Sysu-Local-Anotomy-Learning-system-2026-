with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\MinerU_markdown_zy局部解剖学_2114991686827278336.md', 'r', encoding='utf-8') as f:
    text = f.read()

import re
headers = list(re.finditer(r'^#+\s*([^\n\r]+)', text, re.M))
print(f"Total headers: {len(headers)}")
for h in headers[:40]:
    print(" ", h.group(0))
