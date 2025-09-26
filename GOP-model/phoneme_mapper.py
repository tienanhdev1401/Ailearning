"""
Phoneme Mapper Module
====================

Module xử lý việc mapping và chuẩn hóa phoneme:
- Chuyển đổi giữa ARPAbet và IPA
- Tokenize chuỗi IPA
- Tính độ tương đồng giữa các phoneme
"""

import json
import os
from typing import List, Dict, Tuple


class PhonemeMapper:
    """
    Lớp xử lý mapping và chuẩn hóa phoneme
    
    Chức năng chính:
    - Load mapping data từ file JSON
    - Chuyển đổi ARPAbet <-> IPA
    - Tokenize chuỗi IPA
    - Tính toán độ tương đồng phoneme
    """
    
    def __init__(self, data_path: str):
        """
        Khởi tạo PhonemeMapper
        
        Args:
            data_path: Đường dẫn đến thư mục chứa data
        """
        self.data_path = data_path
        self._load_mappings()
        
    def _load_mappings(self):
        """Load phoneme mappings từ file JSON"""
        # Thử tìm file data theo hai vị trí:
        module_path = os.path.join(os.path.dirname(__file__), 'data', 'ipa_data.json')
        project_path = os.path.join(os.getcwd(), 'data', 'ipa_data.json')

        if os.path.exists(module_path):
            json_path = module_path
        elif os.path.exists(project_path):
            json_path = project_path
        else:
            raise FileNotFoundError(
                f"Không tìm thấy ipa_data.json. Tìm ở: {module_path} hoặc {project_path}"
            )

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        # Load các mapping chính
        self.arpabet_to_ipa = data['arpabet_to_ipa']
        self.ipa_phones = data['ipa_phones']
        self.merge_pairs = {tuple(x[:2]): x[2] for x in data.get('default_merge_pairs', [])}
        # equiv_pairs in JSON are triples [a, b, canonical]
        raw_equiv = data.get('default_equiv_pairs', [])
        self.equiv_pairs = {tuple(x[:2]): x[2] for x in raw_equiv}

        # Build canonical mapping: map each phoneme in equiv triples to the canonical form
        self.canonical_map = {}
        for triple in raw_equiv:
            if len(triple) >= 3:
                a, b, c = triple[0], triple[1], triple[2]
                self.canonical_map[a] = c
                self.canonical_map[b] = c
                # ensure canonical maps to itself
                self.canonical_map[c] = c
        
        # Tạo mapping ngược
        self.ipa_to_arpabet = {}
        for k, v in self.arpabet_to_ipa.items():
            if v and v not in self.ipa_to_arpabet:
                self.ipa_to_arpabet[v] = k
                
        # Tạo ma trận tương đồng phoneme
        self._build_similarity_matrix()
    
    def _build_similarity_matrix(self):
        """
        Xây dựng ma trận tương đồng phoneme để đánh giá mức độ nghiêm trọng của lỗi
        """
        # Các nhóm vowel (nguyên âm) tương tự
        vowel_groups = [
            ['i', 'ɪ'], ['e', 'ɛ'], ['æ', 'ʌ'], ['ɑ', 'ɔ'], ['u', 'ʊ'], ['o', 'ɔ']
        ]
        
        # Các nhóm consonant (phụ âm) tương tự
        consonant_groups = [
            ['p', 'b'], ['t', 'd'], ['k', 'ɡ'], ['f', 'v'], ['θ', 'ð'], ['s', 'z']
        ]
        
        self.similarity = {}
        
        # Gán độ tương đồng trong cùng nhóm
        for group in vowel_groups + consonant_groups:
            for i, p1 in enumerate(group):
                for j, p2 in enumerate(group):
                    if i != j:
                        self.similarity[(p1, p2)] = 0.7  # Âm tương tự

        # Các cặp tương đương (equiv_pairs) và merge pairs sẽ được load sau,
        # nhưng đảm bảo dictionary tồn tại
        if not hasattr(self, 'equiv_pairs'):
            self.equiv_pairs = {}
        if not hasattr(self, 'merge_pairs'):
            self.merge_pairs = {}
    
    def get_similarity(self, p1: str, p2: str) -> float:
        """
        Tính độ tương đồng giữa hai phoneme
        
        Args:
            p1, p2: Hai phoneme cần so sánh
            
        Returns:
            float: Độ tương đồng (0.0-1.0), 1.0 = giống hệt, 0.0 = hoàn toàn khác
        """
        # normalize via canonical map
        p1c = self.canonical_map.get(p1, p1)
        p2c = self.canonical_map.get(p2, p2)
        if p1c == p2c:
            return 1.0
        # Nếu là cặp tương đương (equiv_pairs), trả giá trị cao
        # check equiv pairs in either direction
        if (p1, p2) in self.equiv_pairs or (p2, p1) in self.equiv_pairs:
            return 0.9

        # fallback to similarity matrix on canonical forms
        return self.similarity.get((p1c, p2c), self.similarity.get((p1, p2), 0.0))  # Mặc định: không tương đồng
    
    def tokenize_ipa(self, text: str) -> List[str]:
        """
        Tokenize chuỗi IPA thành danh sách các phoneme
        Sử dụng thuật toán greedy matching từ dài nhất đến ngắn nhất
        
        Args:
            text: Chuỗi IPA cần tokenize
            
        Returns:
            List[str]: Danh sách các phoneme
        """
        if not text:
            return []
            
        phones = []
        # Sắp xếp phoneme theo độ dài giảm dần để match từ dài nhất trước
        phones_by_len = sorted(self.ipa_phones, key=len, reverse=True)
        
        # Xử lý từng chunk (được phân tách bởi space)
        for chunk in text.strip().split():
            i = 0
            while i < len(chunk):
                matched = None
                
                # Tìm phoneme dài nhất match từ vị trí i
                for phone in phones_by_len:
                    if chunk.startswith(phone, i):
                        matched = phone
                        break
                
                if matched:
                    phones.append(matched)
                    i += len(matched)
                else:
                    # Nếu không match được, thêm ký tự đơn lẻ
                    phones.append(chunk[i])
                    i += 1
                    
        # Sau khi token hóa thô, áp dụng các luật merge 
        merged = []
        i = 0
        while i < len(phones):
            if i + 1 < len(phones):
                pair = (phones[i], phones[i+1])
                # Nếu có cặp merge, gộp
                if pair in self.merge_pairs:
                    merged.append(self.merge_pairs[pair])
                    i += 2
                    continue
                # Thử đảo cặp
                rev_pair = (phones[i+1], phones[i])
                if rev_pair in self.merge_pairs:
                    merged.append(self.merge_pairs[rev_pair])
                    i += 2
                    continue

            # Nếu không merge được, thêm phone hiện tại
            merged.append(phones[i])
            i += 1

        # Tiếp: collapse các cặp theo equiv_pairs
        collapsed = []
        i = 0
        while i < len(merged):
            if i + 1 < len(merged):
                pair = (merged[i], merged[i+1])
                if pair in self.equiv_pairs:
                    collapsed.append(self.equiv_pairs[pair])
                    i += 2
                    continue
                rev = (merged[i+1], merged[i])
                if rev in self.equiv_pairs:
                    collapsed.append(self.equiv_pairs[rev])
                    i += 2
                    continue

            collapsed.append(merged[i])
            i += 1

        return collapsed
    
    def arpabet_to_ipa_list(self, arpabet_tokens: List[str], ignore_stress: bool = True) -> List[str]:
        """
        Chuyển đổi danh sách ARPAbet tokens thành IPA
        
        Args:
            arpabet_tokens: Danh sách ARPAbet tokens
            ignore_stress: Có bỏ qua stress markers (số) không
            
        Returns:
            List[str]: Danh sách phoneme IPA tương ứng
        """
        result = []
        for token in arpabet_tokens:
            if ignore_stress:
                # Loại bỏ các số (stress markers)
                clean_token = ''.join(ch for ch in token if not ch.isdigit())
            else:
                clean_token = token
                
            # Tìm IPA tương ứng
            ipa = self.arpabet_to_ipa.get(clean_token)
            result.append(ipa if ipa else f'[{clean_token}]')  # Giữ nguyên nếu không tìm thấy
            
        return result