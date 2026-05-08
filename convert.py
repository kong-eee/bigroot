import json
from docx import Document
import re
import os

def parse_law_docx(file_path, output_name):
    if not os.path.exists(file_path):
        print(f"❌ 에러: {file_path} 파일을 찾을 수 없습니다. 폴더에 파일이 있는지 확인해 주세요.")
        return

    doc = Document(file_path)
    law_data = []
    current_article = None
    
    # 조문 번호와 제목을 찾는 정규표현식 (예: 제1조(목적))
    article_pattern = re.compile(r'제(\d+)조(?:의\d+)?\((.*?)\)')

    for para in doc.paragraphs:
        text = para.text.strip()
        if not text:
            continue
            
        match = article_pattern.match(text)
        if match:
            if current_article:
                law_data.append(current_article)
            
            current_article = {
                "id": f"{output_name}_{match.group(1)}",
                "title": text,
                "content": "",
                "keywords": [match.group(2)]
            }
        else:
            if current_article:
                current_article["content"] += text + " "

    if current_article:
        law_data.append(current_article)

    with open(f"{output_name}.json", "w", encoding="utf-8") as f:
        json.dump(law_data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ 변환 성공! {len(law_data)}개의 조문이 '{output_name}.json'으로 저장되었습니다.")

# --- 여기서 파일 이름을 수정하세요 ---
# convert.py의 마지막 줄
parse_law_docx('final_law.docx', 'housing_law')