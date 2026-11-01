with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md', 'r', encoding='utf-8') as f:
    text = f.read()

import re
pos = text.find('病例 2-1')
print("Snippet around 病例 2-1:")
print(text[pos:pos+1500])
