# -*- coding: utf-8 -*-
"""
Generate complete 264-Card Mind Map & polished Knowledge Data.
Ensures:
1. 100% of the 264 flashcards are mapped to exact nodes with kbId in the Mind Map!
2. All card titles are cleaned and standardized.
3. Both data/mindmap.js and data/knowledge.js are updated and valid.
"""
import json
import re

# Load knowledge cards
with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'r', encoding='utf-8') as f:
    cards = json.load(f)

# Import clean titles
from prepare_mindmap_titles import clean_titles

card_dict = {}
for c in cards:
    cid = c['id']
    if cid in clean_titles:
        c['title'] = clean_titles[cid]
    else:
        # Strip generic prefixes if any
        c['title'] = c['title'].replace('解剖核心 - ', '').replace('【大纲要点】：', '').strip()
    card_dict[cid] = c

print(f"Polished {len(cards)} flashcard titles.")

# Save updated knowledge.json and knowledge.js
with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.json', 'w', encoding='utf-8') as f:
    json.dump(cards, f, ensure_ascii=False, indent=2)

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\knowledge.js', 'w', encoding='utf-8') as f:
    f.write('window.ANATOMY_KNOWLEDGE = ')
    json.dump(cards, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print("Saved updated knowledge.json and knowledge.js.")

# Helper to create a card node
def make_card_node(cid, custom_name=None):
    if cid not in card_dict:
        raise ValueError(f"Card ID {cid} not found!")
    card = card_dict[cid]
    name = custom_name or card['title']
    desc = card.get('front', '')
    # clean desc for hover/inspector
    desc_clean = re.sub(r'<[^>]+>', '', desc).replace('【大纲要点】：', '').replace('简述关于「', '').replace('」的相关局部解剖学要点与结构毗邻？', '').strip()
    if len(desc_clean) > 80:
        desc_clean = desc_clean[:78] + '...'
    return {
        "name": name,
        "chapter": card['chapter'],
        "desc": desc_clean,
        "kbId": cid
    }

# Build Mind Map Tree
mindmap_tree = {
    "name": "局部解剖学 (Regional Anatomy)",
    "chapter": "全部",
    "desc": "以人体局部区域为单元，系统研究各部器官结构的层次位置、相互毗邻及临床应用。",
    "children": [
        # ================= 1. 下肢 (35 cards) =================
        {
            "name": "下肢 (Lower Limb)",
            "chapter": "下肢",
            "desc": "行走运动与支持体重器官，肌发达，稳固性大。以骨筋膜鞘为基本结构单位。",
            "children": [
                {
                    "name": "下肢概论与表面解剖",
                    "chapter": "下肢",
                    "desc": "骨性标志触诊、力学连接与浅静脉回流系统。",
                    "children": [
                        make_card_node("KB-LL-001"),
                        make_card_node("KB-下肢-102"),
                        make_card_node("KB-下肢-103"),
                        make_card_node("KB-下肢-104"),
                        make_card_node("KB-LL-005"),
                        make_card_node("KB-下肢-106"),
                        make_card_node("KB-LL-006")
                    ]
                },
                {
                    "name": "臀部与股后区",
                    "chapter": "下肢",
                    "desc": "梨状肌上孔与下孔、坐骨小孔、坐骨神经行程与分支。",
                    "children": [
                        make_card_node("KB-LL-002"),
                        make_card_node("KB-下肢-105"),
                        make_card_node("KB-LL-003"),
                        make_card_node("KB-LL-004"),
                        make_card_node("KB-下肢-101")
                    ]
                },
                {
                    "name": "股前区与股内侧区",
                    "chapter": "下肢",
                    "desc": "肌腔隙、血管腔隙、股三角、股鞘、股管与收肌管。",
                    "children": [
                        make_card_node("KB-LL-007"),
                        make_card_node("KB-下肢-107"),
                        make_card_node("KB-下肢-100"),
                        make_card_node("KB-LL-008"),
                        make_card_node("KB-下肢-108"),
                        make_card_node("KB-LL-009"),
                        make_card_node("KB-下肢-109"),
                        make_card_node("KB-LL-010"),
                        make_card_node("KB-LL-011"),
                        make_card_node("KB-下肢-110"),
                        make_card_node("KB-LL-012"),
                        make_card_node("KB-LL-013")
                    ]
                },
                {
                    "name": "膝部、腘窝与小腿",
                    "chapter": "下肢",
                    "desc": "腘窝层次境界、小腿三大骨筋膜鞘与腓总神经分支。",
                    "children": [
                        make_card_node("KB-LL-014"),
                        make_card_node("KB-下肢-111"),
                        make_card_node("KB-LL-015"),
                        make_card_node("KB-下肢-112"),
                        make_card_node("KB-LL-017")
                    ]
                },
                {
                    "name": "踝部与足部",
                    "chapter": "下肢",
                    "desc": "踝管构成与通过结构顺序、足底筋膜肌群与足弓维持。",
                    "children": [
                        make_card_node("KB-LL-016"),
                        make_card_node("KB-下肢-113"),
                        make_card_node("KB-下肢-114"),
                        make_card_node("KB-下肢-115"),
                        make_card_node("KB-LL-018"),
                        make_card_node("KB-下肢-116")
                    ]
                }
            ]
        },

        # ================= 2. 上肢 (35 cards) =================
        {
            "name": "上肢 (Upper Limb)",
            "chapter": "上肢",
            "desc": "运动灵活，骨骼小巧，关节囊松弛，肌数量多且细长，精细动作完善。",
            "children": [
                {
                    "name": "胸前区、乳房与肩部",
                    "chapter": "上肢",
                    "desc": "表面标志、乳房淋巴引流4大途径、肩袖与肌间隙。",
                    "children": [
                        make_card_node("KB-UL-001"),
                        make_card_node("KB-上肢-118"),
                        make_card_node("KB-上肢-119"),
                        make_card_node("KB-上肢-120"),
                        make_card_node("KB-上肢-125")
                    ]
                },
                {
                    "name": "腋窝与肌间隙",
                    "chapter": "上肢",
                    "desc": "腋腔五壁、三边孔与四边孔、腋淋巴结五大群。",
                    "children": [
                        make_card_node("KB-UL-002"),
                        make_card_node("KB-上肢-121"),
                        make_card_node("KB-UL-003"),
                        make_card_node("KB-上肢-123"),
                        make_card_node("KB-UL-004"),
                        make_card_node("KB-上肢-124")
                    ]
                },
                {
                    "name": "臂丛与上肢神经",
                    "chapter": "上肢",
                    "desc": "臂丛根干股束支、胸长神经、正中/尺/桡神经行程与损伤畸形。",
                    "children": [
                        make_card_node("KB-UL-005"),
                        make_card_node("KB-上肢-122"),
                        make_card_node("KB-UL-006"),
                        make_card_node("KB-UL-007"),
                        make_card_node("KB-上肢-127"),
                        make_card_node("KB-上肢-117"),
                        make_card_node("KB-UL-010")
                    ]
                },
                {
                    "name": "臂部、肘部与前臂",
                    "chapter": "上肢",
                    "desc": "臂部前臂骨筋膜鞘、肘窝境界与肘后三角、血管神经束。",
                    "children": [
                        make_card_node("KB-上肢-126"),
                        make_card_node("KB-UL-008"),
                        make_card_node("KB-上肢-128"),
                        make_card_node("KB-上肢-129"),
                        make_card_node("KB-上肢-130"),
                        make_card_node("KB-上肢-131")
                    ]
                },
                {
                    "name": "腕部与手部",
                    "chapter": "上肢",
                    "desc": "腕管与伸肌支持带、掌深浅弓、手掌筋膜间隙、指髓间隙与腱鞘。",
                    "children": [
                        make_card_node("KB-UL-009"),
                        make_card_node("KB-上肢-133"),
                        make_card_node("KB-上肢-134"),
                        make_card_node("KB-上肢-132"),
                        make_card_node("KB-UL-011"),
                        make_card_node("KB-UL-012"),
                        make_card_node("KB-上肢-135"),
                        make_card_node("KB-上肢-136"),
                        make_card_node("KB-上肢-137"),
                        make_card_node("KB-上肢-138"),
                        make_card_node("KB-上肢-139")
                    ]
                }
            ]
        },

        # ================= 3. 头部 (27 cards) =================
        {
            "name": "头部 (Head)",
            "chapter": "头部",
            "desc": "颅部容纳脑及其被膜，面部富含视听嗅味器官与丰富神经血管。",
            "children": [
                {
                    "name": "颅顶层次与软组织",
                    "chapter": "头部",
                    "desc": "SCALP五层结构、帽状腱膜、腱膜下危险区与颅顶血管神经。",
                    "children": [
                        make_card_node("KB-HD-001"),
                        make_card_node("KB-头部-140"),
                        make_card_node("KB-头部-142"),
                        make_card_node("KB-头部-143"),
                        make_card_node("KB-头部-144")
                    ]
                },
                {
                    "name": "面浅区与腮腺咬肌区",
                    "chapter": "头部",
                    "desc": "危险三角、面神经面部分支、面动静脉、腮腺穿经五层结构。",
                    "children": [
                        make_card_node("KB-HD-002"),
                        make_card_node("KB-头部-145"),
                        make_card_node("KB-HD-003"),
                        make_card_node("KB-头部-141"),
                        make_card_node("KB-头部-146"),
                        make_card_node("KB-HD-004"),
                        make_card_node("KB-头部-147"),
                        make_card_node("KB-头部-148")
                    ]
                },
                {
                    "name": "面深区与咀嚼肌间隙",
                    "chapter": "头部",
                    "desc": "颞下窝、翼腭窝、翼下颌间隙、咬肌间隙与上颌动脉三段。",
                    "children": [
                        make_card_node("KB-HD-005"),
                        make_card_node("KB-头部-149"),
                        make_card_node("KB-头部-150"),
                        make_card_node("KB-HD-008"),
                        make_card_node("KB-HD-009"),
                        make_card_node("KB-头部-151")
                    ]
                },
                {
                    "name": "颅底内面与硬脑膜窦",
                    "chapter": "头部",
                    "desc": "颅前中后三窝孔裂、海绵窦穿经结构与交通、垂体窝毗邻、小脑幕切迹。",
                    "children": [
                        make_card_node("KB-HD-006"),
                        make_card_node("KB-头部-152"),
                        make_card_node("KB-头部-153"),
                        make_card_node("KB-HD-007"),
                        make_card_node("KB-HD-010"),
                        make_card_node("KB-HD-011"),
                        make_card_node("KB-HD-012")
                    ]
                }
            ]
        },

        # ================= 4. 颈部 (27 cards) =================
        {
            "name": "颈部 (Neck)",
            "chapter": "颈部",
            "desc": "连接头与胸部的枢纽，颈深筋膜鞘与筋膜间隙丰富，内藏重要神经血管与器官。",
            "children": [
                {
                    "name": "颈筋膜与筋膜间隙",
                    "chapter": "颈部",
                    "desc": "颈深筋膜三层、气管前间隙、咽后间隙（通后纵隔）与椎前间隙。",
                    "children": [
                        make_card_node("KB-NK-001"),
                        make_card_node("KB-颈部-154"),
                        make_card_node("KB-颈部-155"),
                        make_card_node("KB-颈部-156"),
                        make_card_node("KB-NK-002"),
                        make_card_node("KB-颈部-157")
                    ]
                },
                {
                    "name": "颈前区与主要三角",
                    "chapter": "颈部",
                    "desc": "舌骨上下区、下颌下三角、肌三角与气管切开术层次。",
                    "children": [
                        make_card_node("KB-NK-003"),
                        make_card_node("KB-颈部-158"),
                        make_card_node("KB-NK-004"),
                        make_card_node("KB-NK-005")
                    ]
                },
                {
                    "name": "甲状腺与甲状旁腺",
                    "chapter": "颈部",
                    "desc": "甲状腺形态被膜、甲状腺动静脉与喉神经交叉毗邻、甲状旁腺保护。",
                    "children": [
                        make_card_node("KB-NK-006"),
                        make_card_node("KB-颈部-159"),
                        make_card_node("KB-NK-007"),
                        make_card_node("KB-颈部-160"),
                        make_card_node("KB-NK-008"),
                        make_card_node("KB-颈部-161")
                    ]
                },
                {
                    "name": "胸锁乳突肌区与颈动脉鞘",
                    "chapter": "颈部",
                    "desc": "颈动脉鞘三主件排列（内动、外静、后迷走）、颈动脉窦与小球。",
                    "children": [
                        make_card_node("KB-NK-009"),
                        make_card_node("KB-颈部-162"),
                        make_card_node("KB-颈部-163"),
                        make_card_node("KB-NK-010")
                    ]
                },
                {
                    "name": "颈外侧区与颈根部",
                    "chapter": "颈部",
                    "desc": "枕三角、锁骨上三角、副神经行程、前斜角肌膈神经、斜角肌间隙与颈根部。",
                    "children": [
                        make_card_node("KB-NK-011"),
                        make_card_node("KB-颈部-164"),
                        make_card_node("KB-颈部-165"),
                        make_card_node("KB-NK-012"),
                        make_card_node("KB-颈部-166"),
                        make_card_node("KB-颈部-167"),
                        make_card_node("KB-颈部-168")
                    ]
                }
            ]
        },

        # ================= 5. 胸部 (34 cards) =================
        {
            "name": "胸部 (Thorax)",
            "chapter": "胸部",
            "desc": "胸腔容纳心、肺及纵隔重要大血管和神经，参与呼吸与循环。",
            "children": [
                {
                    "name": "胸壁与膈",
                    "chapter": "胸部",
                    "desc": "表面标志、肋间隙神经血管排列、胸廓内动脉、乳房构造、膈肌裂孔与薄弱区。",
                    "children": [
                        make_card_node("KB-TH-001"),
                        make_card_node("KB-胸部-169"),
                        make_card_node("KB-TH-002"),
                        make_card_node("KB-胸部-170"),
                        make_card_node("KB-胸部-171"),
                        make_card_node("KB-胸部-172"),
                        make_card_node("KB-胸部-173"),
                        make_card_node("KB-TH-003"),
                        make_card_node("KB-胸部-174")
                    ]
                },
                {
                    "name": "胸膜、肺与支气管树",
                    "chapter": "胸部",
                    "desc": "肋膈隐窝与胸穿定位、肺根排列顺序、支气管肺段与左右主支气管差异。",
                    "children": [
                        make_card_node("KB-TH-004"),
                        make_card_node("KB-胸部-175"),
                        make_card_node("KB-TH-005"),
                        make_card_node("KB-胸部-176"),
                        make_card_node("KB-胸部-177"),
                        make_card_node("KB-TH-006"),
                        make_card_node("KB-胸部-178"),
                        make_card_node("KB-TH-007"),
                        make_card_node("KB-胸部-179"),
                        make_card_node("KB-胸部-180")
                    ]
                },
                {
                    "name": "纵隔划分与内容",
                    "chapter": "胸部",
                    "desc": "胸骨角平面四分法、上纵隔五层排列、后纵隔重要管道及动脉导管三角。",
                    "children": [
                        make_card_node("KB-TH-008"),
                        make_card_node("KB-胸部-181"),
                        make_card_node("KB-TH-009"),
                        make_card_node("KB-胸部-182"),
                        make_card_node("KB-TH-010"),
                        make_card_node("KB-TH-011"),
                        make_card_node("KB-胸部-183")
                    ]
                },
                {
                    "name": "心包与心脏血管",
                    "chapter": "胸部",
                    "desc": "心包腔与心包窦、心包穿刺、左右冠状动脉供血、心传导系统与牵涉痛。",
                    "children": [
                        make_card_node("KB-TH-012"),
                        make_card_node("KB-胸部-184"),
                        make_card_node("KB-TH-013"),
                        make_card_node("KB-胸部-185"),
                        make_card_node("KB-TH-014"),
                        make_card_node("KB-胸部-186"),
                        make_card_node("KB-胸部-187"),
                        make_card_node("KB-TH-015")
                    ]
                }
            ]
        },

        # ================= 6. 腹部 (60 cards) =================
        {
            "name": "腹部 (Abdomen)",
            "chapter": "腹部",
            "desc": "腹壁层次复杂，内有消化道管腔脏器、实质性腺体、大网膜与丰富门腔侧支循环。",
            "children": [
                {
                    "name": "腹前外侧壁层次与神经血管",
                    "chapter": "腹部",
                    "desc": "体表九分区、Camper/Scarpa筋膜、肌层、腹直肌鞘前后层、血管神经节段分布。",
                    "children": [
                        make_card_node("KB-AB-001"),
                        make_card_node("KB-腹部-188"),
                        make_card_node("KB-腹部-189"),
                        make_card_node("KB-腹部-190"),
                        make_card_node("KB-腹部-191"),
                        make_card_node("KB-AB-002"),
                        make_card_node("KB-腹部-192"),
                        make_card_node("KB-腹部-193"),
                        make_card_node("KB-腹部-194")
                    ]
                },
                {
                    "name": "腹股沟区、疝与精索",
                    "chapter": "腹部",
                    "desc": "腹股沟管四壁两环、直疝三角（Hesselbach）、斜疝与直疝鉴别、精索与睾丸被膜。",
                    "children": [
                        make_card_node("KB-AB-003"),
                        make_card_node("KB-腹部-195"),
                        make_card_node("KB-AB-004"),
                        make_card_node("KB-腹部-196"),
                        make_card_node("KB-AB-005"),
                        make_card_node("KB-腹部-197"),
                        make_card_node("KB-AB-006"),
                        make_card_node("KB-腹部-198"),
                        make_card_node("KB-腹部-199")
                    ]
                },
                {
                    "name": "腹膜、网膜囊与间隙交通",
                    "chapter": "腹部",
                    "desc": "小网膜韧带、网膜孔（Winslow孔）、Pringle手法、网膜囊与结肠旁沟液流。",
                    "children": [
                        make_card_node("KB-AB-007"),
                        make_card_node("KB-腹部-200"),
                        make_card_node("KB-腹部-201"),
                        make_card_node("KB-AB-008"),
                        make_card_node("KB-腹部-202"),
                        make_card_node("KB-AB-009"),
                        make_card_node("KB-腹部-203"),
                        make_card_node("KB-腹部-204"),
                        make_card_node("KB-腹部-205")
                    ]
                },
                {
                    "name": "结肠上区实质与管道脏器",
                    "chapter": "腹部",
                    "desc": "胃毗邻与淋巴动脉、十二指肠四部与Treitz韧带、肝门与Couinaud段、Calot三角、胆总管分段、胰床与脾脏。",
                    "children": [
                        make_card_node("KB-腹部-206"),
                        make_card_node("KB-AB-010"),
                        make_card_node("KB-腹部-207"),
                        make_card_node("KB-腹部-208"),
                        make_card_node("KB-腹部-209"),
                        make_card_node("KB-腹部-210"),
                        make_card_node("KB-AB-011"),
                        make_card_node("KB-腹部-211"),
                        make_card_node("KB-腹部-212"),
                        make_card_node("KB-腹部-213"),
                        make_card_node("KB-腹部-214"),
                        make_card_node("KB-AB-012"),
                        make_card_node("KB-腹部-215"),
                        make_card_node("KB-腹部-216"),
                        make_card_node("KB-腹部-217"),
                        make_card_node("KB-AB-013"),
                        make_card_node("KB-腹部-218"),
                        make_card_node("KB-腹部-219"),
                        make_card_node("KB-腹部-220"),
                        make_card_node("KB-腹部-221"),
                        make_card_node("KB-腹部-230"),
                        make_card_node("KB-AB-014"),
                        make_card_node("KB-腹部-222"),
                        make_card_node("KB-腹部-223"),
                        make_card_node("KB-腹部-224"),
                        make_card_node("KB-腹部-232"),
                        make_card_node("KB-AB-015"),
                        make_card_node("KB-腹部-225"),
                        make_card_node("KB-腹部-226"),
                        make_card_node("KB-AB-016"),
                        make_card_node("KB-腹部-227"),
                        make_card_node("KB-腹部-228")
                    ]
                },
                {
                    "name": "结肠下区空回肠与阑尾结肠",
                    "chapter": "腹部",
                    "desc": "空回肠解剖鉴别、肠系膜根、盲肠阑尾根投影、阑尾动脉、结肠特征与动脉弓。",
                    "children": [
                        make_card_node("KB-AB-017"),
                        make_card_node("KB-腹部-231"),
                        make_card_node("KB-腹部-233"),
                        make_card_node("KB-AB-018"),
                        make_card_node("KB-腹部-234"),
                        make_card_node("KB-腹部-235"),
                        make_card_node("KB-腹部-236"),
                        make_card_node("KB-腹部-237"),
                        make_card_node("KB-腹部-238")
                    ]
                },
                {
                    "name": "腹膜后隙与大血管神经",
                    "chapter": "腹部",
                    "desc": "肾位置毗邻与V-A-U排列、肾三层筋膜、输尿管狭窄供血、肾上腺、腹主动脉成对支、下腔静脉、腰交感干与乳糜池。",
                    "children": [
                        make_card_node("KB-腹部-239"),
                        make_card_node("KB-腹部-240"),
                        make_card_node("KB-腹部-241"),
                        make_card_node("KB-腹部-242"),
                        make_card_node("KB-腹部-243"),
                        make_card_node("KB-腹部-244"),
                        make_card_node("KB-腹部-245"),
                        make_card_node("KB-腹部-246"),
                        make_card_node("KB-腹部-229"),
                        make_card_node("KB-腹部-247"),
                        make_card_node("KB-腹部-251"),
                        make_card_node("KB-腹部-248"),
                        make_card_node("KB-腹部-252"),
                        make_card_node("KB-腹部-249"),
                        make_card_node("KB-腹部-250"),
                        make_card_node("KB-腹部-253"),
                        make_card_node("KB-腹部-254")
                    ]
                }
            ]
        },

        # ================= 7. 盆部和会阴 (31 cards) =================
        {
            "name": "盆部和会阴 (Pelvis & Perineum)",
            "chapter": "盆部和会阴",
            "desc": "骨盆支撑躯干并容纳泌尿、生殖系统与直肠消化系统，盆底肌与会阴结构致密。",
            "children": [
                {
                    "name": "骨盆、盆壁肌与盆底盆膈",
                    "chapter": "盆部和会阴",
                    "desc": "骨盆界线、产道径线、闭孔内肌与梨状肌、盆膈（肛提肌与尾骨肌）、盆筋膜间隙与腹膜陷凹。",
                    "children": [
                        make_card_node("KB-PV-001"),
                        make_card_node("KB-盆部-257"),
                        make_card_node("KB-盆部-258"),
                        make_card_node("KB-盆部-259"),
                        make_card_node("KB-盆部-260"),
                        make_card_node("KB-盆部-261"),
                        make_card_node("KB-盆部-262"),
                        make_card_node("KB-盆部-263"),
                        make_card_node("KB-盆部-264"),
                        make_card_node("KB-盆部-265")
                    ]
                },
                {
                    "name": "盆腔脏器与支持固定结构",
                    "chapter": "盆部和会阴",
                    "desc": "直肠两曲三横襞、直肠血供、膀胱三角、输尿管盆段、前列腺五叶、子宫四韧带与子宫动脉交叉、输卵管卵巢。",
                    "children": [
                        make_card_node("KB-盆部-266"),
                        make_card_node("KB-盆部-267"),
                        make_card_node("KB-盆部-268"),
                        make_card_node("KB-盆部-269"),
                        make_card_node("KB-盆部-270"),
                        make_card_node("KB-PV-003"),
                        make_card_node("KB-盆部-271"),
                        make_card_node("KB-PV-004"),
                        make_card_node("KB-盆部-272"),
                        make_card_node("KB-盆部-273")
                    ]
                },
                {
                    "name": "盆部血管与神经",
                    "chapter": "盆部和会阴",
                    "desc": "髂内动脉壁支脏支分布、闭孔神经与骶神经丛。",
                    "children": [
                        make_card_node("KB-盆部-255")
                    ]
                },
                {
                    "name": "会阴区、间隙与外生殖器",
                    "chapter": "盆部和会阴",
                    "desc": "肛管齿状线内外胚层差异、坐骨直肠窝（Alcock管）、会阴浅深隙与Colles筋膜、尿生殖膈、阴囊层次与会阴中心腱。",
                    "children": [
                        make_card_node("KB-PV-005"),
                        make_card_node("KB-盆部-274"),
                        make_card_node("KB-PV-002"),
                        make_card_node("KB-盆部-275"),
                        make_card_node("KB-盆部-256"),
                        make_card_node("KB-盆部-276"),
                        make_card_node("KB-盆部-277"),
                        make_card_node("KB-盆部-278"),
                        make_card_node("KB-PV-006"),
                        make_card_node("KB-盆部-279")
                    ]
                }
            ]
        },

        # ================= 8. 背部（脊柱区） (15 cards) =================
        {
            "name": "背部（脊柱区） (Back / Spine)",
            "chapter": "背部（脊柱区）",
            "desc": "人体的支柱与承重中轴，保护脊髓与脊神经根，软组织层次分明，腰穿与椎管病变好发。",
            "children": [
                {
                    "name": "脊柱区软组织与肌间三角",
                    "chapter": "背部（脊柱区）",
                    "desc": "表面骨性标志、生理弯曲、深浅层次、背肌三层、脊神经后支、听诊三角与腰上腰下三角。",
                    "children": [
                        make_card_node("KB-BK-001"),
                        make_card_node("KB-背部-280"),
                        make_card_node("KB-背部-281"),
                        make_card_node("KB-背部-282"),
                        make_card_node("KB-背部-283"),
                        make_card_node("KB-背部-284"),
                        make_card_node("KB-BK-002")
                    ]
                },
                {
                    "name": "椎管、脊髓被膜与腰椎穿刺",
                    "chapter": "背部（脊柱区）",
                    "desc": "椎管壁构成、椎骨连结韧带、脊髓被膜三层、硬膜外隙与终池、腰穿7层落空感、椎间盘突出差一号受压机制与脊髓节段对应。",
                    "children": [
                        make_card_node("KB-BK-003"),
                        make_card_node("KB-背部-285"),
                        make_card_node("KB-背部-286"),
                        make_card_node("KB-BK-004"),
                        make_card_node("KB-背部-287"),
                        make_card_node("KB-BK-005"),
                        make_card_node("KB-BK-006"),
                        make_card_node("KB-背部-288")
                    ]
                }
            ]
        }
    ]
}

# Verify that all 264 cards are present in the mind map
def collect_kb_ids(node):
    ids = []
    if 'kbId' in node:
        ids.append(node['kbId'])
    for c in node.get('children', []):
        ids.extend(collect_kb_ids(c))
    return ids

mapped_ids = collect_kb_ids(mindmap_tree)
all_ids = set(c['id'] for c in cards)
missing_ids = all_ids - set(mapped_ids)

print(f"Total cards mapped into mind map: {len(mapped_ids)}")
print(f"Unique cards mapped: {len(set(mapped_ids))}")
if missing_ids:
    print(f"ERROR: Missing {len(missing_ids)} cards: {missing_ids}")
else:
    print("SUCCESS: 100% of all 264 flashcards are mapped into the Mind Map!")

# Save to data/mindmap.json and data/mindmap.js
with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\mindmap.json', 'w', encoding='utf-8') as f:
    json.dump(mindmap_tree, f, ensure_ascii=False, indent=2)

with open(r'd:\Desktop\万能工作间\局部解剖学交互式学习系统\data\mindmap.js', 'w', encoding='utf-8') as f:
    f.write('window.ANATOMY_MINDMAP = ')
    json.dump(mindmap_tree, f, ensure_ascii=False, indent=2)
    f.write(';\n')

print("Successfully written data/mindmap.json and data/mindmap.js!")
