"""
Data Structures cho Pronunciation Scoring System
================================================

File này chứa các dataclass chính để lưu trữ kết quả và thông tin lỗi phát âm:
- PhonemeError: Lưu thông tin lỗi phoneme
- WordScore: Điểm số cho từng từ
- PronunciationResult: Kết quả tổng thể của việc chấm điểm
"""

from dataclasses import dataclass
from typing import List, Dict, Optional


@dataclass
class PhonemeError:
    """
    Cấu trúc lưu trữ thông tin lỗi phát âm phoneme
    
    Attributes:
        type: Loại lỗi ('substitution', 'deletion', 'insertion')
        position: Vị trí lỗi trong chuỗi phoneme
        expected: Phoneme mong đợi (None nếu là insertion)
        actual: Phoneme thực tế được phát âm (None nếu là deletion)
        severity: Mức độ nghiêm trọng từ 0.0-1.0
    """
    type: str
    position: int
    expected: Optional[str]
    actual: Optional[str]
    severity: float


@dataclass
class WordScore:
    """
    Kết quả chấm điểm cho từng từ riêng biệt
    
    Attributes:
        word: Từ gốc
        target_ipa: IPA mong đợi
        predicted_ipa: IPA được dự đoán từ audio
        accuracy: Độ chính xác (0.0-1.0)
        label: Nhãn chất lượng (1=excellent, 2=good, 3=needs_work)
        errors: Danh sách các lỗi phoneme trong từ này
    """
    word: str
    target_ipa: str
    predicted_ipa: str
    accuracy: float
    label: int
    errors: List[PhonemeError]


@dataclass
class PronunciationResult:
    """
    Kết quả tổng thể của việc đánh giá phát âm
    
    Attributes:
        overall_score: Điểm tổng thể (0-100)
        accuracy: Độ chính xác tổng thể (0.0-1.0)
        words: Danh sách điểm số cho từng từ
        global_errors: Tất cả lỗi phoneme trong câu
        target_ipa: Chuỗi IPA mong đợi hoàn chỉnh
        predicted_ipa: Chuỗi IPA được dự đoán hoàn chỉnh
        metadata: Thông tin metadata khác
    """
    overall_score: int
    accuracy: float
    words: List[WordScore]
    global_errors: List[PhonemeError]
    target_ipa: str
    predicted_ipa: str
    metadata: Dict