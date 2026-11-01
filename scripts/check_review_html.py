import re

for path in [
    r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学复习讲义\上肢篇\源文件\body_upper_limb.html',
    r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学复习讲义\下肢篇\源文件\body_lower_limb.html',
    r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学复习讲义\脊柱篇\源文件\body_spine.html'
]:
    with open(path, 'r', encoding='utf-8') as f:
        t = f.read()
    print(f"\n=== File: {path} (len: {len(t)}) ===")
    matches = list(re.finditer(r'case-card|案例|病例', t))
    print(f"Case matches: {len(matches)}")
    # Find h2 or h3 or card titles
    titles = list(re.finditer(r'<div class="case-card">[\s\S]*?<div class="chd">([\s\S]*?)</div>', t))
    print(f"Case cards: {len(titles)}")
    for ti in titles:
        print("  ", ti.group(1).strip())
