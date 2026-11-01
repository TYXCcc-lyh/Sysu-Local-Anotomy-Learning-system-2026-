with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md', 'r', encoding='utf-8') as f:
    t = f.read()

import re
matches = list(re.finditer(r'(?:第六章|第七章|第八章|第四章|第五章).*', t))
for m in matches:
    print(f"Match at {m.start()}: {m.group(0)}")
    # see what comes after
    snippet = t[m.start():m.start()+400].replace('\n', ' ')
    print("  Snippet:", snippet[:180])
