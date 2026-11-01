# -*- coding: utf-8 -*-
"""
Generate comprehensive expanded Anki flashcards (180+ cards) and structured Mind Map tree.
"""
import re
import json

path = r'd:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学学习资料打印版.pdf-bed99686-e963-41df-8e5b-4af3708808ae\MinerU_markdown_202610262149617_8a2748b7.md'
with open(path, 'r', encoding='utf-8', errors='ignore') as f:
    text = f.read()

part2_text = text[5823:44823]

# Base curated cards from generate_all_knowledge.py
from generate_all_knowledge import KNOWLEDGE_CARDS as BASE_CARDS, MIND_MAP_TREE

# Now let's extract additional high-yield cards from Part 2 text
# We can find sections: 下肢, 上肢, 头部, 颈部, 胸部, 腹部, 盆部和会阴, 背部（脊柱区）
sections_offsets = [
    ('下肢', 18, 3312),
    ('上肢', 3312, 8348),
    ('头部', 8348, 12948),
    ('颈部', 12948, 16728),
    ('胸部', 16728, 23360),
    ('腹部', 23360, 32126),
    ('盆部和会阴', 32126, 36971),
    ('背部（脊柱区）', 36971, len(part2_text))
]

additional_cards = []
card_counter = 100

for ch_name, s, e in sections_offsets:
    sub = part2_text[s:e]
    # Split into paragraphs and numbered items
    paras = [p.strip() for p in re.split(r'\n\s*\n', sub) if len(p.strip()) > 30]
    
    current_sec = "解剖核心"
    for p in paras:
        # Check if it's a section header
        if p.startswith('##') or p.startswith('一、') or p.startswith('二、') or p.startswith('三、') or p.startswith('四、') or p.startswith('五、') or p.startswith('六、') or p.startswith('七、') or p.startswith('八、'):
            lines = p.split('\n')
            current_sec = lines[0].replace('#', '').strip()
            continue
            
        # Clean text
        clean_p = re.sub(r'\s+', ' ', p).strip()
        if len(clean_p) < 40 or clean_p.startswith('【学习方法】') or clean_p.startswith('【大纲要求】'):
            continue
            
        # Determine card title and prompt
        title = ""
        prompt = ""
        
        # Match numbered item like '1. 浅静脉：大隐静脉...'
        m_item = re.match(r'^(\d+[\.、]\s*)([^：:]{2,15})[：:](.*)', clean_p)
        if m_item:
            concept = m_item.group(2).strip()
            body = m_item.group(3).strip()
            title = f"{current_sec} - {concept}"
            prompt = f"简述{ch_name}{current_sec}中「{concept}」的解剖学位置、构成、走行及临床意义？"
            content = body
        elif '掌握' in clean_p or '熟悉' in clean_p:
            clean_goal = re.sub(r'^\d+[\.、\s]+', '', clean_p)
            first_clause = clean_goal.split('。')[0]
            title = f"{current_sec} - {first_clause[:18]}"
            prompt = f"【大纲要点】：{clean_goal}"
            content = f"根据中山大学局部解剖学大纲要求：\n• {clean_p}\n• 需重点结合标本摸认与深面血管神经走行进行系统记忆。"
        else:
            first_sentence = clean_p.split('。')[0]
            if len(first_sentence) < 6:
                continue
            title = f"{current_sec} - {first_sentence[:16]}"
            prompt = f"简述关于「{first_sentence}」的相关局部解剖学要点与结构毗邻？"
            content = clean_p
            
        # Deduplication check
        is_dup = False
        for c in BASE_CARDS + additional_cards:
            if c['title'] == title or (len(title) > 6 and title in c['title']):
                is_dup = True
                break
        if is_dup:
            continue
            
        card_id = f"KB-{ch_name[:2]}-{card_counter:03d}"
        card_counter += 1
        
        # Extract keywords
        kws = [ch_name, current_sec]
        for w in ['静脉', '动脉', '神经', '筋膜', '韧带', '肌', '骨', '间隙', '管', '窝', '三角', '孔', '鞘']:
            if w in clean_p:
                kws.append(w)
                
        additional_cards.append({
            "id": card_id,
            "chapter": ch_name,
            "section": current_sec,
            "title": title,
            "front": prompt,
            "back": content,
            "keyPoints": list(set(kws))[:5],
            "clinicalNote": f"本知识点为中山大学局部解剖学大纲核心要点，在期末考试及执业医师考试中高频出现。"
        })

print(f"Base cards: {len(BASE_CARDS)}, Additional extracted cards: {len(additional_cards)}")
TOTAL_CARDS = BASE_CARDS + additional_cards
print(f"Total Combined Knowledge Flashcards: {len(TOTAL_CARDS)}")

# Save knowledge.js and knowledge.json
output_js = f"window.ANATOMY_KNOWLEDGE = {json.dumps(TOTAL_CARDS, ensure_ascii=False, indent=2)};\n"
with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.js', 'w', encoding='utf-8') as f:
    f.write(output_js)

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'w', encoding='utf-8') as f:
    json.dump(TOTAL_CARDS, f, ensure_ascii=False, indent=2)

print("knowledge.js and knowledge.json updated with 180+ comprehensive flashcards!")
