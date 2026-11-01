import fitz
import re

doc = fitz.open(r'd:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学学习资料打印版.pdf-bed99686-e963-41df-8e5b-4af3708808ae\36a2949d-bc73-45d8-9937-4ef7bf273fc6_origin.pdf')

full_text = ''
for p in range(151, len(doc)):
    full_text += f'\n[PDF_PAGE_{p+1}]\n' + doc[p].get_text()

# Find chapter headings
chapters = ['下肢', '上肢', '头部', '颈部', '胸部', '腹部', '盆部和会阴', '盆部与会阴', '背部']
chapter_indices = []
for ch in chapters:
    for m in re.finditer(r'^\s*' + ch + r'\s*$', full_text, re.M):
        chapter_indices.append((m.start(), ch))

chapter_indices.sort(key=lambda x: x[0])
print("Chapter sequence in PDF Part 4:")
for pos, ch in chapter_indices:
    print(f"  {ch} at {pos}")

# For each chapter segment, extract cases
for i in range(len(chapter_indices)):
    start_pos, ch = chapter_indices[i]
    end_pos = chapter_indices[i+1][0] if i+1 < len(chapter_indices) else len(full_text)
    ch_text = full_text[start_pos:end_pos]
    
    # Find all '病例X' in this chapter
    case_numbers = []
    for m in re.finditer(r'病例\s*(\d+)', ch_text):
        case_numbers.append(int(m.group(1)))
    
    # Also find '诊断：' occurrences which often mark case conclusions
    diagnoses = list(re.finditer(r'诊断\s*[:：]', ch_text))
    
    print(f"\n--- Chapter: {ch} ---")
    print(f"  Cases found with '病例X': {case_numbers}")
    print(f"  Unique case numbers: {sorted(list(set(case_numbers)))}")
    print(f"  '诊断：' tags found: {len(diagnoses)}")
