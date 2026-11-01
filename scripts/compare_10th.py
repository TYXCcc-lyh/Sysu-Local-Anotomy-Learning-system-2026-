with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-1.md', 'r', encoding='utf-8') as f1:
    t1 = f1.read()

with open(r'D:\Desktop\学业万能工作间\万能工作间\01-讲义\局部解剖学\局部解剖学第十版md\局部解剖学第十版-2.md', 'r', encoding='utf-8') as f2:
    t2 = f2.read()

print(f"t1 len: {len(t1)}, t2 len: {len(t2)}")
print(f"Are they identical? {t1 == t2}")
if t1 != t2:
    # find where they differ
    for i in range(min(len(t1), len(t2))):
        if t1[i] != t2[i]:
            print(f"Differ at index {i}")
            print("t1 snippet:", t1[i:i+100])
            print("t2 snippet:", t2[i:i+100])
            break
