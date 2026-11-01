import re
import json

with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md', 'r', encoding='utf-8') as f:
    t = f.read()

cases_10th = []
# Match ## 病例 X-X
m_cases = list(re.finditer(r'(?:^|\n)#+\s*病例\s*(\d+[-—–\d]*)([\s\S]*?)(?=(?:\n#+\s*病例|\n#+\s*第[一二三四五六七八九十]+[章节]|\Z))', t))
print("Matched 10th ed cases:", len(m_cases))

ch_map = { '1': '头部', '2': '颈部', '3': '胸部', '6': '背部', '7': '上肢', '8': '下肢' }

for m in m_cases:
    num_str = m.group(1).strip()
    body = m.group(2).strip()
    ch_num = num_str.split('-')[0].strip()
    chapter = ch_map.get(ch_num, '其他')
    
    # Clean images
    body = re.sub(r'!\[.*?\]\(.*?\)', '', body)
    body = re.sub(r'本章临床病例分析解析', '', body).strip()
    
    # Split scenario and questions
    q_split = re.split(r'请从解剖学角度思考分析[:：]?', body)
    scenario = q_split[0].strip()
    
    # Diagnosis
    diag_m = re.search(r'诊断为([^\n。；]+)', scenario)
    diagnosis = diag_m.group(1).strip() if diag_m else ""
    
    # Questions
    questions = []
    if len(q_split) > 1:
        q_text = q_split[1].strip()
        q_items = re.findall(r'(?:^|\n)\s*[\(（](\d+)[\)）]\s*([\s\S]*?)(?=(?:\n\s*[\(（]\d+[\)）])|\Z)', q_text)
        questions = [f"({num}) {q.strip()}" for num, q in q_items]
        
    cases_10th.append({
        'id': f"CASE-10TH-{num_str}",
        'is10thEdition': True,
        'chapter': chapter,
        'caseNum': f"第十版 病例 {num_str}",
        'diagnosis': diagnosis,
        'scenario': scenario,
        'questions': questions
    })

print(f"Extracted {len(cases_10th)} cases from 局部解剖学第十版-1.md:")
for c in cases_10th:
    print(f"  {c['caseNum']} [{c['chapter']}]: {c['diagnosis']} ({len(c['questions'])} 问)")

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\scripts\cases_10th_extracted.json', 'w', encoding='utf-8') as f:
    json.dump(cases_10th, f, ensure_ascii=False, indent=2)
