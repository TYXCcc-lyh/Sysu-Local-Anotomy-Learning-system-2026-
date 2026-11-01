with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\MinerU_markdown_zy局部解剖学_2114991686827278336.md', 'r', encoding='utf-8') as f:
    text = f.read()

import re

# Find sections around 45000-60000
for pos in [45939, 49016, 58161, 97234]:
    print(f"\n==================== At pos {pos} ====================")
    print(text[pos-100:pos+800].replace('\n', ' '))
