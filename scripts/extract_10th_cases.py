import re

def parse_10th_file(filepath):
    print(f"\n==================== Parsing: {filepath} ====================")
    with open(filepath, 'r', encoding='utf-8') as f:
        text = f.read()
        
    # Search for "临床病例分析" sections
    sec_matches = list(re.finditer(r'(?:#+\s*第[一二三四五六七八九十]+节\s*临床病例分析|#+\s*临床病例分析)', text))
    print(f"Total '临床病例分析' sections: {len(sec_matches)}")
    
    # Also find all "病例 X" or "病例X-X"
    case_matches = list(re.finditer(r'(?:^|\n)(#+\s*病例\s*(\d+[-—–\d]*)[^\n]*|\*{0,2}病例\s*(\d+[-—–\d]*)\*{0,2}[^\n]*)', text))
    print(f"Total '病例 X' matches: {len(case_matches)}")
    for m in case_matches:
        header = m.group(0).strip()
        pos = m.start()
        # Grab next 300 chars
        snippet = text[pos:pos+350].replace('\n', ' ')
        print(f"\n  --- {header} ---")
        print(f"  {snippet[:200]}")

parse_10th_file(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md')
