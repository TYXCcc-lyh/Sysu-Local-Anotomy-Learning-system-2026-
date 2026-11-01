# -*- coding: utf-8 -*-
"""
Generate complete questions.js and questions.json from MinerU markdown.
"""
import re
import json

path = r'd:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学学习资料打印版.pdf-bed99686-e963-41df-8e5b-4af3708808ae\MinerU_markdown_202610262149617_8a2748b7.md'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

part3_text = text[44823:181462]

# Load knowledge cards to do automated linkage
with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    knowledge_cards = json.load(f)

def parse_html_table(table_html):
    cells = re.findall(r'<td[^>]*>(.*?)</td>', table_html)
    ans_map = {}
    is_x = False
    x_map = {}
    for c in cells:
        clean = re.sub(r'<[^>]+>', '', c).strip()
        if 'X型题' in clean:
            is_x = True
            continue
        m = re.match(r'^\s*(\d+)[\.\s、]+([A-Ea-e]+)\s*$', clean)
        if m:
            num = int(m.group(1))
            val = m.group(2).upper()
            if is_x:
                x_map[num] = val
            else:
                ans_map[num] = val
    return ans_map, x_map

def extract_questions(raw_text):
    pattern = r'(?:^|\n)\s*(\d+)[\.、\s]+([\s\S]*?)(?=(?:\n\s*\d+[\.、\s])|\Z)'
    questions = []
    for m in re.finditer(pattern, raw_text):
        q_num = int(m.group(1))
        q_body = m.group(2).strip()
        
        # Check if this body is an answer table remnant
        if re.match(r'^[A-E]\s+\d+[\.、\s]', q_body):
            continue
            
        opt_matches = list(re.finditer(r'(?:^|[\s\n])([A-E])[\.\、\s]+', q_body))
        if opt_matches:
            stem = q_body[:opt_matches[0].start()].strip()
            options = {}
            for i in range(len(opt_matches)):
                opt_letter = opt_matches[i].group(1)
                start_p = opt_matches[i].end()
                end_p = opt_matches[i+1].start() if i+1 < len(opt_matches) else len(q_body)
                options[opt_letter] = q_body[start_p:end_p].strip()
        else:
            stem = q_body
            options = {}
            
        # Clean stem
        stem = re.sub(r'\s+', ' ', stem).strip()
        
        if len(options) >= 2 or len(stem) > 10:
            questions.append({
                'num': q_num,
                'stem': stem,
                'options': options
            })
    return questions

def find_linked_knowledge(stem, options, chapter):
    full_text = stem + " " + " ".join(options.values())
    matched_ids = []
    
    # Priority: cards in same chapter
    for card in knowledge_cards:
        if card['chapter'] == chapter or (chapter == '头颈部' and card['chapter'] in ['头部', '颈部']):
            score = 0
            for kw in card['keyPoints']:
                if kw in full_text:
                    score += 2
            if card['title'] in full_text:
                score += 3
            if score >= 2:
                matched_ids.append({
                    'id': card['id'],
                    'title': card['title'],
                    'chapter': card['chapter']
                })
    if not matched_ids:
        # Fallback keyword match across all cards
        for card in knowledge_cards:
            for kw in card['keyPoints']:
                if len(kw) >= 3 and kw in full_text:
                    matched_ids.append({
                        'id': card['id'],
                        'title': card['title'],
                        'chapter': card['chapter']
                    })
                    break
    # Limit to top 2
    return matched_ids[:2]

def generate_explanation(stem, answer, options, linked_kbs):
    exp = f"【官方答案】：{answer}\n"
    if linked_kbs:
        exp += f"【考点精析】：本题考查核心知识点「{linked_kbs[0]['title']}」。"
    else:
        exp += f"【考点精析】：根据局解核心解剖结构关系，正确答案为 {answer}。"
        
    if answer in options:
        exp += f"\n• 关键正确选项：{options[answer]}"
    return exp

tables = re.findall(r'<table.*?</table>', part3_text, re.DOTALL)

# Preamble for thorax X-type 61-79
thorax_x_supplement = {
    61: 'ACD', 62: 'ABCE', 63: 'BDE', 64: 'CD', 65: 'ACDE', 66: 'ABC',
    67: 'BC', 68: 'DE', 69: 'AB', 70: 'AB', 71: 'ABE', 72: 'ABCD',
    73: 'BCDE', 74: 'ABDE', 75: 'BC', 76: 'ABC', 77: 'BCE', 78: 'BC', 79: 'AC'
}

chapters_meta = [
    {
        'chapter': '下肢',
        'a_start': 0, 'a_end': 10580,
        'x_start': 10580, 'x_end': 16788,
        'a_table_idx': 0, 'x_table_idx': 1
    },
    {
        'chapter': '上肢',
        'a_start': 19550, 'a_end': 30048,
        'x_start': 30048, 'x_end': 36811,
        'a_table_idx': 2, 'x_table_idx': 3
    },
    {
        'chapter': '头颈部',
        'a_start': 40098, 'a_end': 52007,
        'x_start': 52007, 'x_end': 56556,
        'a_table_idx': 4, 'x_table_idx': 5
    },
    {
        'chapter': '胸部',
        'a_start': 59526, 'a_end': 74924,
        'x_start': 74924, 'x_end': 81326,
        'a_table_idx': 6, 'x_table_idx': 7,
        'x_supplement': thorax_x_supplement
    },
    {
        'chapter': '腹部',
        'a_start': 85337, 'a_end': 102329,
        'x_start': 102329, 'x_end': 113822,
        'compound_table_idx': 8
    },
    {
        'chapter': '背部（脊柱区）',
        'a_start': 120304, 'a_end': 120806,
        'special': 'back'
    },
    {
        'chapter': '盆部和会阴',
        'a_start': 120806, 'a_end': 129086,
        'x_start': 129086, 'x_end': 134343,
        'a_table_idx': 9, 'x_table_idx': 10,
        'special': 'pelvis'
    }
]

all_questions = []

for meta in chapters_meta:
    ch = meta['chapter']
    
    if meta.get('special') == 'back':
        sub = part3_text[meta['a_start']:meta['a_end']]
        qs = extract_questions(sub)
        ans_map = {1: 'E', 2: 'D'}
        for q in qs[:2]:
            linked = find_linked_knowledge(q['stem'], q['options'], ch)
            ans = ans_map.get(q['num'], 'E')
            q_obj = {
                'id': f'Q-BK-A-{q["num"]:03d}',
                'chapter': '背部（脊柱区）',
                'type': 'A',
                'typeLabel': 'A型题 (单选题)',
                'num': q['num'],
                'stem': q['stem'],
                'options': q['options'],
                'answer': ans,
                'explanation': generate_explanation(q['stem'], ans, q['options'], linked),
                'linkedKnowledge': linked
            }
            all_questions.append(q_obj)
        continue

    # A-type
    a_sub = part3_text[meta['a_start']:meta['a_end']]
    a_qs = extract_questions(a_sub)
    if 'compound_table_idx' in meta:
        a_ans, x_ans = parse_html_table(tables[meta['compound_table_idx']])
    else:
        a_ans, _ = parse_html_table(tables[meta['a_table_idx']])
        if meta.get('special') == 'pelvis':
            preamble_ans = {1:'E', 2:'B', 3:'A', 4:'D', 5:'D', 6:'B', 7:'B', 8:'B', 9:'E', 10:'B', 11:'A', 12:'C'}
            a_ans.update(preamble_ans)

    for q in a_qs:
        ans = a_ans.get(q['num'], '')
        linked = find_linked_knowledge(q['stem'], q['options'], ch)
        q_obj = {
            'id': f'Q-{ch}-A-{q["num"]:03d}',
            'chapter': ch,
            'type': 'A',
            'typeLabel': 'A型题 (单选题)',
            'num': q['num'],
            'stem': q['stem'],
            'options': q['options'],
            'answer': ans,
            'explanation': generate_explanation(q['stem'], ans, q['options'], linked),
            'linkedKnowledge': linked
        }
        all_questions.append(q_obj)

    # X-type
    x_sub = part3_text[meta['x_start']:meta['x_end']]
    x_qs = extract_questions(x_sub)
    if 'compound_table_idx' in meta:
        _, x_ans = parse_html_table(tables[meta['compound_table_idx']])
    else:
        a_tmp, x_tmp = parse_html_table(tables[meta['x_table_idx']])
        x_ans = {**a_tmp, **x_tmp}
        
    if 'x_supplement' in meta:
        x_ans.update(meta['x_supplement'])

    for q in x_qs:
        ans = x_ans.get(q['num'], '')
        linked = find_linked_knowledge(q['stem'], q['options'], ch)
        q_obj = {
            'id': f'Q-{ch}-X-{q["num"]:03d}',
            'chapter': ch,
            'type': 'X',
            'typeLabel': 'X型题 (多选题)',
            'num': q['num'],
            'stem': q['stem'],
            'options': q['options'],
            'answer': ans,
            'explanation': generate_explanation(q['stem'], ans, q['options'], linked),
            'linkedKnowledge': linked
        }
        all_questions.append(q_obj)

print(f"Total questions generated: {len(all_questions)}")
with_ans = sum(1 for q in all_questions if q['answer'])
print(f"Questions with valid answers: {with_ans} / {len(all_questions)} ({with_ans/len(all_questions)*100:.1f}%)")

# Write to js
output_js = f"window.ANATOMY_QUESTIONS = {json.dumps(all_questions, ensure_ascii=False, indent=2)};\n"
with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\questions.js', 'w', encoding='utf-8') as f:
    f.write(output_js)

# Write to json
with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\questions.json', 'w', encoding='utf-8') as f:
    json.dump(all_questions, f, ensure_ascii=False, indent=2)

print("questions.js and questions.json generated successfully!")
