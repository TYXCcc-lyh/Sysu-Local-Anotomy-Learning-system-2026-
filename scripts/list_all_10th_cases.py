import re

with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md', 'r', encoding='utf-8') as f:
    t = f.read()

# Find all cases
cases = list(re.finditer(r'(?:^|\n)#+\s*病例\s*(\d+[-—–\d]*)([\s\S]*?)(?=(?:\n#+\s*病例|\n#+\s*第[一二三四五六七八九十]+[章节]|\Z))', t))
print(f"Total cases extracted from 局部解剖学第十版-1.md: {len(cases)}")
for idx, c in enumerate(cases):
    case_id = c.group(1)
    body = c.group(2).strip()
    # Find diagnosis or questions
    diag_m = re.search(r'诊断为([^\n。；]+)', body)
    diag = diag_m.group(1) if diag_m else "未明"
    # Find questions
    q_m = re.findall(r'[\(（](\d+)[\)）]\s*([^；。\n]+)', body)
    q_str = f"{len(q_m)}问: " + "; ".join([q[1][:15] for q in q_m[:3]])
    print(f"[{idx+1}] 病例 {case_id}: 诊断: {diag.strip()} | {q_str}")
