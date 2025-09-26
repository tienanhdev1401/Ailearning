"""
Pronunciation Alignment Module
==============================

Module xử lý việc căn chỉnh (alignment) giữa phoneme target và predicted:
- Sử dụng thuật toán Dynamic Programming để tìm edit distance
- Phân loại các loại lỗi: substitution, deletion, insertion
- Tính toán severity của từng lỗi dựa trên phonetic similarity
"""

from typing import List, Tuple
from data_structures import PhonemeError
from phoneme_mapper import PhonemeMapper


class PronunciationAligner:
    """
    Lớp xử lý alignment giữa target và predicted phoneme sequences
    
    Sử dụng thuật toán edit distance với dynamic programming để:
    - Tìm cách căn chỉnh tối ưu giữa hai chuỗi phoneme
    - Phân loại các loại lỗi phát âm
    - Tính toán mức độ nghiêm trọng của từng lỗi
    """
    
    def __init__(self, phoneme_mapper: PhonemeMapper):
        """
        Khởi tạo PronunciationAligner
        
        Args:
            phoneme_mapper: Instance của PhonemeMapper để tính similarity
        """
        self.mapper = phoneme_mapper
    
    def align_with_errors(self, target: List[str], predicted: List[str]) -> List[PhonemeError]:
        """
        Căn chỉnh hai chuỗi phoneme và trả về thông tin lỗi chi tiết
        
        Args:
            target: Chuỗi phoneme mong đợi
            predicted: Chuỗi phoneme được dự đoán từ audio
            
        Returns:
            List[PhonemeError]: Danh sách các lỗi phát âm được phát hiện
        """
        operations = self._get_edit_operations(target, predicted)
        errors = []
        
        target_idx = 0
        
        # Xử lý từng operation để tạo PhonemeError
        for op, expected, actual in operations:
            if op == 'M':  # Match - không có lỗi
                target_idx += 1
            elif op == 'S':  # Substitution - phát âm sai
                similarity = self.mapper.get_similarity(expected, actual)
                severity = 1.0 - similarity  # Càng giống thì severity càng thấp
                
                errors.append(PhonemeError(
                    type='substitution',
                    position=target_idx,
                    expected=expected,
                    actual=actual,
                    severity=severity
                ))
                target_idx += 1
            elif op == 'D':  # Deletion - bỏ sót âm
                errors.append(PhonemeError(
                    type='deletion',
                    position=target_idx,
                    expected=expected,
                    actual=None,
                    severity=1.0  # Deletion luôn nghiêm trọng
                ))
                target_idx += 1
            elif op == 'I':  # Insertion - thêm âm không cần thiết
                errors.append(PhonemeError(
                    type='insertion',
                    position=max(0, target_idx - 1),
                    expected=None,
                    actual=actual,
                    severity=0.8  # Insertion ít nghiêm trọng hơn deletion
                ))
                
        return errors
    
    def _get_edit_operations(self, target: List[str], predicted: List[str]) -> List[Tuple[str, str, str]]:
        """
        Tìm các edit operations sử dụng dynamic programming
        
        Args:
            target: Chuỗi target
            predicted: Chuỗi predicted
            
        Returns:
            List[Tuple[str, str, str]]: Danh sách operations (operation, expected, actual)
                - 'M': Match
                - 'S': Substitution 
                - 'D': Deletion
                - 'I': Insertion
        """
        n, m = len(target), len(predicted)
        
        # Tạo bảng DP cho edit distance
        dp = [[0] * (m + 1) for _ in range(n + 1)]
        
        # Khởi tạo base cases
        for i in range(1, n + 1):
            dp[i][0] = i  # Deletion cost
        for j in range(1, m + 1):
            dp[0][j] = j  # Insertion cost
            
        # Fill DP table
        for i in range(1, n + 1):
            for j in range(1, m + 1):
                cost = 0 if target[i-1] == predicted[j-1] else 1
                dp[i][j] = min(
                    dp[i-1][j] + 1,      # deletion
                    dp[i][j-1] + 1,      # insertion
                    dp[i-1][j-1] + cost  # substitution/match
                )
        
        # Backtrack để lấy operations
        operations = []
        i, j = n, m
        
        while i > 0 or j > 0:
            # Kiểm tra operation nào được sử dụng
            if i > 0 and j > 0:
                cost = 0 if target[i-1] == predicted[j-1] else 1
                if dp[i][j] == dp[i-1][j-1] + cost:
                    # Substitution hoặc Match
                    op = 'M' if target[i-1] == predicted[j-1] else 'S'
                    operations.append((op, target[i-1], predicted[j-1]))
                    i -= 1
                    j -= 1
                    continue
            
            if i > 0 and dp[i][j] == dp[i-1][j] + 1:
                # Deletion
                operations.append(('D', target[i-1], None))
                i -= 1
            else:
                # Insertion
                operations.append(('I', None, predicted[j-1]))
                j -= 1
                
        operations.reverse()  # Đảo lại để có thứ tự đúng
        return operations