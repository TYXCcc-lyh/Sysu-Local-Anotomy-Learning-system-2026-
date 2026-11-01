import re

with open(r'd:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学学习资料打印版.pdf-bed99686-e963-41df-8e5b-4af3708808ae\MinerU_markdown_202610262149617_8a2748b7.md', 'r', encoding='utf-8') as f:
    text = f.read()

part4_text = text[181462:]

# Find chapter positions
chapters = [
    ('下肢', 14),
    ('上肢', 4997),
    ('头部', 11434),
    ('颈部', 16137),
    ('胸部', 22126),
    ('腹部', 26874),
    ('盆部与会阴', 32237),
    ('背部', 35618),
    ('结束', len(part4_text))
]

for i in range(len(chapters) - 1):
    ch_name, s = chapters[i]
    _, e = chapters[i+1]
    ch_sub = part4_text[s:e]
    
    # Find all '临床解剖学问题' in this chapter
    problem_positions = [m.start() for m in re.finditer(r'#{0,3}\s*临床解剖学问题[:：]?', ch_sub)]
    print(f"\n================ Chapter {ch_name} (Total cases with questions: {len(problem_positions)}) ================")
    
    for idx, pos in enumerate(problem_positions):
        # find the start of this case: look backwards from pos
        prev_pos = problem_positions[idx - 1] if idx > 0 else 0
        scenario_area = ch_sub[prev_pos:pos]
        
        # Check if there is a '病例X' in scenario_area
        case_tag_m = list(re.finditer(r'#{0,3}\s*病例\s*(\d+)', scenario_area))
        if case_tag_m:
            case_tag = f"病例{case_tag_m[-1].group(1)}"
            scenario_text = scenario_area[case_tag_m[-1].end():].strip()
        else:
            case_tag = f"【缺号病例 {idx+1}】"
            # scenario is after previous questions
            # Find the end of previous questions (e.g. after numbered items)
            lines = [l.strip() for l in scenario_area.split('\n') if l.strip()]
            # usually the last paragraph(s) before '临床解剖学问题'
            scenario_text = '\n'.join(lines[-3:]) if lines else ''
            
        # Extract questions
        next_pos = problem_positions[idx + 1] if idx + 1 < len(problem_positions) else len(ch_sub)
        q_area = ch_sub[pos:next_pos]
        # remove the '临床解剖学问题' header
        q_lines = q_area.split('\n')[1:]
        q_items = []
        for l in q_lines:
            l_s = l.strip()
            if re.match(r'^\d+[\.、]', l_s):
                q_items.append(l_s)
            elif q_items and not l_s.startswith('#') and not re.match(r'^病例\s*\d+', l_s) and not '患者' in l_s and not '一' in l_s and not '某' in l_s:
                # continuation
                pass
            elif re.match(r'^#{0,3}\s*病例\s*\d+', l_s) or (len(l_s) > 20 and any(kw in l_s for kw in ['患者', '一女性', '一男性', '一青年', '一老年', '一名', '一儿童', '足球', '检查时', '某'])):
                # next scenario started
                break
                
        print(f"  [{idx+1}] {case_tag}: {scenario_text[:60].replace(chr(10), ' ')}... ({len(q_items)} questions)")
