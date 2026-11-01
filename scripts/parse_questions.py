import re
import json

path = r'd:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学学习资料打印版.pdf-bed99686-e963-41df-8e5b-4af3708808ae\MinerU_markdown_202610262149617_8a2748b7.md'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

part3_text = text[44823:181462]

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
    # Splits by numbers at start of line or after newline
    pattern = r'(?:^|\n)\s*(\d+)[\.、\s]+([\s\S]*?)(?=(?:\n\s*\d+[\.、\s])|\Z)'
    questions = []
    for m in re.finditer(pattern, raw_text):
        q_num = int(m.group(1))
        q_body = m.group(2).strip()
        
        # Check if this body is actually an answer list (e.g. '1.E 3.A 5.D...')
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
        # Filter out accidental non-questions (like pure numbers or table artifacts)
        if len(options) >= 2 or len(stem) > 10:
            questions.append({
                'num': q_num,
                'stem': stem,
                'options': options
            })
    return questions

# Let's inspect each chapter block:
chapters_meta = [
    {
        'chapter': '下肢',
        'a_start': 0,
        'a_end': 10580,
        'x_start': 10580,
        'x_end': 16788,
        'a_table_idx': 0,
        'x_table_idx': 1
    },
    {
        'chapter': '上肢',
        'a_start': 19550,
        'a_end': 30048,
        'x_start': 30048,
        'x_end': 36811,
        'a_table_idx': 2,
        'x_table_idx': 3
    },
    {
        'chapter': '头颈部',
        'a_start': 40098,
        'a_end': 52007,
        'x_start': 52007,
        'x_end': 56556,
        'a_table_idx': 4,
        'x_table_idx': 5
    },
    {
        'chapter': '胸部',
        'a_start': 59526,
        'a_end': 74924,
        'x_start': 74924,
        'x_end': 81326,
        'a_table_idx': 6,
        'x_table_idx': 7
    },
    {
        'chapter': '腹部',
        'a_start': 85337,
        'a_end': 102329,
        'x_start': 102329,
        'x_end': 113822,
        'compound_table_idx': 8
    },
    {
        'chapter': '背部（脊柱区）',
        'a_start': 120304,
        'a_end': 120806,
        'special': 'back'
    },
    {
        'chapter': '盆部和会阴',
        'a_start': 120806,
        'a_end': 129086,
        'x_start': 129086,
        'x_end': 134343,
        'a_table_idx': 9,
        'x_table_idx': 10,
        'special': 'pelvis'
    }
]

tables = re.findall(r'<table.*?</table>', part3_text, re.DOTALL)
print('Total HTML tables:', len(tables))

all_parsed_questions = []

for meta in chapters_meta:
    ch = meta['chapter']
    print(f'Processing chapter: {ch}')
    if meta.get('special') == 'back':
        # Back region: 2 questions
        sub = part3_text[meta['a_start']:meta['a_end']]
        qs = extract_questions(sub)
        ans_map = {1: 'E', 2: 'D'}
        for q in qs[:2]:
            q_obj = {
                'id': f'Q-BACK-A-{q["num"]:03d}',
                'chapter': '背部（脊柱区）',
                'type': 'A',
                'typeLabel': 'A型题 (单选)',
                'num': q['num'],
                'stem': q['stem'],
                'options': q['options'],
                'answer': ans_map.get(q['num'], 'E'),
                'chapter_id': 'back'
            }
            all_parsed_questions.append(q_obj)
        print(f'  Added {len(qs[:2])} questions for {ch}')
        continue

    # A-type questions
    a_sub = part3_text[meta['a_start']:meta['a_end']]
    a_qs = extract_questions(a_sub)
    
    # Answers for A-type
    if 'compound_table_idx' in meta:
        a_ans, x_ans = parse_html_table(tables[meta['compound_table_idx']])
    else:
        a_ans, _ = parse_html_table(tables[meta['a_table_idx']])
        if meta.get('special') == 'pelvis':
            # Pelvis has 1..12 in text before table 9
            # 1.E 3.A 5.D 7.B 9.E 11.A / 2.B 4.D 6.B 8.B 10.B 12.C
            preamble_ans = {1:'E', 2:'B', 3:'A', 4:'D', 5:'D', 6:'B', 7:'B', 8:'B', 9:'E', 10:'B', 11:'A', 12:'C'}
            a_ans.update(preamble_ans)

    for q in a_qs:
        ans = a_ans.get(q['num'], '')
        q_obj = {
            'id': f'Q-{ch}-A-{q["num"]:03d}',
            'chapter': ch,
            'type': 'A',
            'typeLabel': 'A型题 (单选)',
            'num': q['num'],
            'stem': q['stem'],
            'options': q['options'],
            'answer': ans,
            'chapter_id': ch
        }
        all_parsed_questions.append(q_obj)

    # X-type questions
    x_sub = part3_text[meta['x_start']:meta['x_end']]
    x_qs = extract_questions(x_sub)
    if 'compound_table_idx' in meta:
        _, x_ans = parse_html_table(tables[meta['compound_table_idx']])
    else:
        x_ans, _ = parse_html_table(tables[meta['x_table_idx']])

    for q in x_qs:
        ans = x_ans.get(q['num'], '')
        q_obj = {
            'id': f'Q-{ch}-X-{q["num"]:03d}',
            'chapter': ch,
            'type': 'X',
            'typeLabel': 'X型题 (多选)',
            'num': q['num'],
            'stem': q['stem'],
            'options': q['options'],
            'answer': ans,
            'chapter_id': ch
        }
        all_parsed_questions.append(q_obj)

    print(f'  {ch}: A-type {len(a_qs)} (matched ans: {sum(1 for q in a_qs if a_ans.get(q["num"]))}), X-type {len(x_qs)} (matched ans: {sum(1 for q in x_qs if x_ans.get(q["num"]))})')

print(f'\nGrand Total Questions parsed: {len(all_parsed_questions)}')
with_answers = sum(1 for q in all_parsed_questions if q['answer'])
print(f'Questions with answers: {with_answers} / {len(all_parsed_questions)} ({with_answers/len(all_parsed_questions)*100:.1f}%)')
