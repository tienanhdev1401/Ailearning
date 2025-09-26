"""
Pronunciation Scorer Module
===========================

Module chính để chấm điểm phát âm:
- Tích hợp tất cả components: PhonemeMapper, Aligner, CTCDecoder
- Xử lý text-to-phoneme conversion
- Tính toán điểm số word-level và overall
- Export kết quả ra JSON format
"""

import nltk
import re
from typing import List, Dict, Tuple
from g2p_en import G2p

from data_structures import PhonemeError, WordScore, PronunciationResult
from phoneme_mapper import PhonemeMapper
from alignment import PronunciationAligner
from ctc_decoder import CTCDecoder


class PronunciationScorer:
    """
    Engine chính cho pronunciation scoring system
    
    Tích hợp tất cả các component để:
    - Chuyển đổi text thành target phonemes
    - Decode audio thành predicted phonemes  
    - Căn chỉnh và tính điểm
    - Xuất kết quả có cấu trúc
    """
    
    def __init__(self, data_path: str = None):
        """
        Khởi tạo PronunciationScorer
        
        Args:
            data_path: Đường dẫn đến thư mục data (mặc định là thư mục hiện tại)
        """
        self.phoneme_mapper = PhonemeMapper(data_path or '.')
        self.aligner = PronunciationAligner(self.phoneme_mapper)
        self.ctc_decoder = CTCDecoder()
        self.g2p = G2p()  # Grapheme-to-phoneme converter
        
        # Đảm bảo CMUDict được download
        self._ensure_cmudict()
    
    def _ensure_cmudict(self):
        """Đảm bảo CMUDict đã được download từ NLTK"""
        try:
            from nltk.corpus import cmudict
            cmudict.dict()
        except:
            print("Downloading CMUDict...")
            nltk.download('cmudict', quiet=True)
    
    def score_pronunciation(
        self, 
        script_text: str, 
        audio_path: str, 
        model_name: str = "mrrubino/wav2vec2-large-xlsr-53-l2-arctic-phoneme",
        thresholds: Tuple[float, float] = (0.15, 0.35)
    ) -> PronunciationResult:
        """
        Chấm điểm chất lượng phát âm
        
        Args:
            script_text: Văn bản mong đợi được đọc
            audio_path: Đường dẫn file audio
            model_name: Tên model HuggingFace để sử dụng
            thresholds: (excellent_threshold, good_threshold) cho phân loại
        
        Returns:
            PronunciationResult: Kết quả chấm điểm đầy đủ
        """
        
        # Bước 1: Decode audio thành predicted phonemes
        predicted_tokens = self.ctc_decoder.decode_audio(audio_path, model_name)
        # Normalize tokens from CTCDecoder: strip special markers and join without spaces
        norm_tokens = [t.replace('▁', '').replace('|', '').strip() for t in predicted_tokens if t]
        joined = ''.join(norm_tokens)
        predicted_phones = self.phoneme_mapper.tokenize_ipa(joined)
        
        # Bước 2: Chuyển text thành target phonemes
        words = re.findall(r"\w+", script_text.lower())
        target_phones_per_word = self._get_target_pronunciations(words)
        
        # Bước 3: Căn chỉnh và tính lỗi
        flat_target = [p for word_phones in target_phones_per_word for p in word_phones]
        errors = self.aligner.align_with_errors(flat_target, predicted_phones)
        
        # Bước 4: Tính điểm cho từng từ
        word_scores = self._calculate_word_scores(
            words, target_phones_per_word, predicted_phones, thresholds
        )
        
        # Bước 5: Tính điểm tổng thể
        total_errors = sum(error.severity for error in errors)
        total_phonemes = len(flat_target)
        accuracy = max(0.0, 1.0 - (total_errors / total_phonemes)) if total_phonemes > 0 else 0.0
        overall_score = int(accuracy * 100)
        
        return PronunciationResult(
            overall_score=overall_score,
            accuracy=accuracy,
            words=word_scores,
            global_errors=errors,
            target_ipa=' '.join(flat_target),
            predicted_ipa=' '.join(predicted_phones),
            metadata={
                'model_used': model_name,
                'thresholds': thresholds,
                'total_phonemes': total_phonemes,
                'error_count': len(errors)
            }
        )
    
    def _get_target_pronunciations(self, words: List[str]) -> List[List[str]]:
        """
        Lấy target pronunciations cho mỗi từ
        
        Args:
            words: Danh sách các từ cần lấy pronunciation
            
        Returns:
            List[List[str]]: Danh sách phonemes cho mỗi từ
        """
        from nltk.corpus import cmudict
        cmu_dict = cmudict.dict()
        
        result = []
        for word in words:
            word_lower = word.lower()
            
            if word_lower in cmu_dict:
                # Sử dụng pronunciation đầu tiên từ CMUDict
                arpabet = cmu_dict[word_lower][0]
                ipa_phones = self.phoneme_mapper.arpabet_to_ipa_list(arpabet, ignore_stress=True)
            else:
                # Fallback sang G2P nếu không tìm thấy trong CMUDict
                g2p_result = self.g2p(word_lower)
                arpabet = [token for token in g2p_result if re.match(r"^[A-Z]+\d?$", token)]
                if arpabet:
                    ipa_phones = self.phoneme_mapper.arpabet_to_ipa_list(arpabet, ignore_stress=True)
                else:
                    # Phương án cuối cùng: giữ nguyên từ
                    ipa_phones = [word_lower]
                    
            result.append(ipa_phones)
        
        return result
    
    def _calculate_word_scores(
        self, 
        words: List[str], 
        target_per_word: List[List[str]], 
        predicted_phones: List[str],
        thresholds: Tuple[float, float]
    ) -> List[WordScore]:
        """
        Tính điểm pronunciation cho TẤT CẢ các từ
        
        Args:
            words: Danh sách các từ
            target_per_word: Target phonemes cho mỗi từ
            predicted_phones: Toàn bộ predicted phonemes
            thresholds: (excellent_threshold, good_threshold)
            
        Returns:
            List[WordScore]: Điểm số cho từng từ
        """
        
        # Tạo flat target với mapping đến từ
        flat_target = []
        phone_to_word = []  # Mapping từ phoneme index đến word index
        word_phone_ranges = []  # Track phone ranges cho mỗi từ
        
        start_idx = 0
        for word_idx, phones in enumerate(target_per_word):
            end_idx = start_idx + len(phones)
            word_phone_ranges.append((start_idx, end_idx))
            
            for phone in phones:
                flat_target.append(phone)
                phone_to_word.append(word_idx)
            start_idx = end_idx
        
        # Lấy alignment operations
        operations = self.aligner._get_edit_operations(flat_target, predicted_phones)
        
        # Khởi tạo lỗi và predicted phones cho TẤT CẢ từ
        word_errors = [[] for _ in words]
        word_predicted_phones = [[] for _ in words]
        
        target_idx = 0
        predicted_idx = 0
        
        # Xử lý từng operation
        for op, expected, actual in operations:
            if op == 'M':  # Match
                word_idx = phone_to_word[target_idx] if target_idx < len(phone_to_word) else len(words) - 1
                word_predicted_phones[word_idx].append(actual)
                target_idx += 1
                predicted_idx += 1
            elif op == 'S':  # Substitution
                word_idx = phone_to_word[target_idx] if target_idx < len(phone_to_word) else len(words) - 1
                severity = 1.0 - self.phoneme_mapper.get_similarity(expected, actual)
                
                word_errors[word_idx].append(PhonemeError(
                    type='substitution',
                    position=target_idx,
                    expected=expected,
                    actual=actual,
                    severity=severity
                ))
                word_predicted_phones[word_idx].append(actual)
                target_idx += 1
                predicted_idx += 1
            elif op == 'D':  # Deletion
                word_idx = phone_to_word[target_idx] if target_idx < len(phone_to_word) else len(words) - 1
                
                word_errors[word_idx].append(PhonemeError(
                    type='deletion',
                    position=target_idx,
                    expected=expected,
                    actual=None,
                    severity=1.0
                ))
                target_idx += 1
            elif op == 'I':  # Insertion
                # Gán insertion cho từ trước đó hoặc từ đầu tiên
                word_idx = phone_to_word[target_idx - 1] if target_idx > 0 and target_idx - 1 < len(phone_to_word) else 0
                word_errors[word_idx].append(PhonemeError(
                    type='insertion',
                    position=target_idx,
                    expected=None,
                    actual=actual,
                    severity=0.8
                ))
                word_predicted_phones[word_idx].append(actual)
                predicted_idx += 1
        
        # Tính điểm cho TẤT CẢ từ (bao gồm cả những từ phát âm hoàn hảo)
        word_scores = []
        for i, (word, target_phones) in enumerate(zip(words, target_per_word)):
            total_error = sum(error.severity for error in word_errors[i])
            total_phones = len(target_phones)
            
            accuracy = max(0.0, 1.0 - (total_error / total_phones)) if total_phones > 0 else 1.0
            
            # Xác định label dựa trên error rate
            error_rate = total_error / total_phones if total_phones > 0 else 0.0
            if error_rate <= thresholds[0]:
                label = 1  # excellent
            elif error_rate <= thresholds[1]:
                label = 2  # good
            else:
                label = 3  # needs work
            
            # Tạo predicted IPA string cho từ này
            predicted_ipa = ' '.join(word_predicted_phones[i]) if word_predicted_phones[i] else ''
            
            word_scores.append(WordScore(
                word=word,
                target_ipa=' '.join(target_phones),
                predicted_ipa=predicted_ipa,
                accuracy=accuracy,
                label=label,
                errors=word_errors[i]
            ))
        
        return word_scores

    def to_json(self, result: PronunciationResult) -> dict:
        """
        Chuyển đổi kết quả thành format JSON có thể serialize
        
        Args:
            result: PronunciationResult cần chuyển đổi
            
        Returns:
            dict: Dictionary có thể serialize thành JSON
        """
        return {
            "overall_score": result.overall_score,
            "accuracy": round(result.accuracy, 3),
            "target_ipa": result.target_ipa,
            "predicted_ipa": result.predicted_ipa,
            "words": [
                {
                    "word": word.word,
                    "target_ipa": word.target_ipa,
                    "predicted_ipa": word.predicted_ipa,
                    "accuracy": round(word.accuracy, 3),
                    "label": word.label,
                    "error_count": len(word.errors),
                    "errors": [
                        {
                            "type": error.type,
                            "position": error.position,
                            "expected": error.expected,
                            "actual": error.actual,
                            "severity": round(error.severity, 2)
                        }
                        for error in word.errors
                    ]
                }
                for word in result.words
            ],
        }