import re

for fname in [
    r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md',
    r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-2.md'
]:
    with open(fname, 'r', encoding='utf-8') as f:
        t = f.read()
    print(f"\n=== File: {fname} (Length: {len(t)}) ===")
    
    # Find all chapter titles
    chapters = list(re.finditer(r'^#+\s*第[一二三四五六七八九十]+章\s*([^\n\r]+)', t, re.M))
    for c in chapters:
        print("  Chapter:", c.group(0))
        
    # Find all "临床病例分析" section headers
    case_sections = list(re.finditer(r'^#+\s*第[一二三四五六七八九十]+节\s*临床病例分析|临床病例分析', t, re.M))
    print(f"  \"临床病例分析\" mentions: {len(case_sections)}")
    
    # Find all "病例 X" patterns
    cases = list(re.finditer(r'^#+\s*病例\s*(\d+[-—–\d]*)', t, re.M))
    print(f"  \"病例 X-X\" count: {len(cases)}")
    for c in cases[:10]:
        print("   ", c.group(0))
