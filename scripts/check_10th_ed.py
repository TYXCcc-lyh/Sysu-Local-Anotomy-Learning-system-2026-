import re

with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md', 'r', encoding='utf-8') as f:
    t = f.read()

print('Length of 局部解剖学第十版-1.md:', len(t))

chapters = list(re.finditer(r'^#+\s*第[一二三四五六七八九十]+章.*', t, re.M))
print('Chapters found:', len(chapters))
for c in chapters:
    print(' ', c.group(0))

keywords = ['病例', '案例', '思考题', '复习思考题', '临床联系', '分析题', '思考']
for kw in keywords:
    matches = list(re.finditer(kw, t))
    print(f'Keyword "{kw}": {len(matches)} occurrences')
    for m in matches[:5]:
        start = max(0, m.start() - 40)
        end = min(len(t), m.start() + 60)
        print('   ', t[start:end].replace('\n', ' '))
