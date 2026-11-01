import re

for fname in [
    'd:/Desktop/学业万能工作间/万能工作间/01-讲义/局部解剖学/局部解剖学试题详解/上肢篇/源文件/body_upper_limb_quiz.html',
    'd:/Desktop/学业万能工作间/万能工作间/01-讲义/局部解剖学/局部解剖学试题详解/下肢篇/源文件/body_lower_limb_quiz.html',
    'd:/Desktop/学业万能工作间/万能工作间/01-讲义/局部解剖学/局部解剖学试题详解/脊柱篇/源文件/body_spine_quiz.html'
]:
    with open(fname, 'r', encoding='utf-8') as f:
        t = f.read()
    cases = list(re.finditer(r'<div class="case-card">([\s\S]*?)</div>\s*</div>', t))
    print(fname, 'cases count:', len(cases))
    for c in cases:
        chd = re.search(r'<div class="chd">([\s\S]*?)</div>', c.group(0))
        title = chd.group(1) if chd else 'No title'
        print('  Title:', title.strip())
