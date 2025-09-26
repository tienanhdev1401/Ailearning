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
        thresholds: Tuple[float, float] = (0.15, 0.35),
        segmentation_policy: str = 'alignment'  # 'marker' or 'alignment'
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
        
        # Bước 1: Decode audio thành predicted phonemes (flat)
        predicted_tokens = self.ctc_decoder.decode_audio(audio_path, model_name)
        # Build a single string from tokens, converting boundary markers to spaces so
        # tokenizer can split properly when model emitted boundaries; otherwise just
        # join tokens with spaces.
        token_str = ' '.join([t.replace('▁', ' ').replace('|', ' ').strip() for t in predicted_tokens if t is not None])
        predicted_phones = self.phoneme_mapper.tokenize_ipa(token_str)

        # Bước 2: Chuyển text thành target phonemes
        words = re.findall(r"\w+", script_text.lower())
        target_phones_per_word = self._get_target_pronunciations(words)

        # Bước 3: Segment predicted flat phonemes into per-word chunks using markers/tokens
        predicted_chunks = self.segment_predicted_by_words(predicted_tokens, predicted_phones, target_phones_per_word, policy=segmentation_policy)

        # Bước 4: So sánh từng chunk với nhau và tính lỗi
        word_scores = self._calculate_word_scores_from_chunks(words, target_phones_per_word, predicted_chunks, thresholds)
        errors = []
        for tphones, pchunk in zip(target_phones_per_word, predicted_chunks):
            errors.extend(self.aligner.align_with_errors(tphones, pchunk))

        # Bước 5: Tính điểm tổng thể
        flat_target = [p for word_phones in target_phones_per_word for p in word_phones]
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
            predicted_ipa=' '.join([p for ch in predicted_chunks for p in ch]),
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
    # Note: legacy function `_calculate_word_scores` (aligning entire predicted sequence
    # to the flat target and distributing errors) has been removed in favor of the
    # chunk-based flow implemented in `_calculate_word_scores_from_chunks`.

    def _calculate_word_scores_from_chunks(
        self,
        words: List[str],
        target_per_word: List[List[str]],
        predicted_chunks: List[List[str]],
        thresholds: Tuple[float, float]
    ) -> List[WordScore]:
        """
        Tính điểm khi predicted đã được chunked tương ứng với từng từ.
        Mỗi predicted_chunks[i] tương ứng với target_per_word[i].
        """
        word_scores = []
        for i, word in enumerate(words):
            target_phones = target_per_word[i] if i < len(target_per_word) else []
            predicted_phones = predicted_chunks[i] if i < len(predicted_chunks) else []

            # Align target_phones vs predicted_phones to compute errors
            errors = self.aligner.align_with_errors(target_phones, predicted_phones)
            total_error = sum(e.severity for e in errors)
            total_phones = len(target_phones)

            accuracy = max(0.0, 1.0 - (total_error / total_phones)) if total_phones > 0 else 1.0
            error_rate = total_error / total_phones if total_phones > 0 else 0.0
            if error_rate <= thresholds[0]:
                label = 1
            elif error_rate <= thresholds[1]:
                label = 2
            else:
                label = 3

            # If there is no predicted phones for this word, use None so JSON emits null
            predicted_ipa = ' '.join(predicted_phones) if predicted_phones else None

            word_scores.append(WordScore(
                word=word,
                target_ipa=' '.join(target_phones),
                predicted_ipa=predicted_ipa,
                accuracy=accuracy,
                label=label,
                errors=errors
            ))

        return word_scores

    def segment_predicted_by_words(self, predicted_tokens: List[str], predicted_phones: List[str], target_per_word: List[List[str]], policy: str = 'marker') -> List[List[str]]:
        """
        Segment predicted phonemes into exactly len(target_per_word) chunks corresponding
        to words in the script. This function prefers marker-based grouping using
        `predicted_tokens` (which may contain '▁' or '|' markers). If markers are not
        present, it will partition `predicted_phones` evenly (with simple heuristics)
        and split/merge chunks until the number of chunks equals number of words.

        Returns a list of lists of phonemes (length == number of words).
        """
        num_words = len(target_per_word)

        # Helper: tokenize a token string into phonemes
        def token_to_phones(tok: str) -> List[str]:
            s = tok.replace('|', '').replace('▁', ' ').strip()
            # tokenize_ipa expects chunk(s) separated by spaces
            phones = self.phoneme_mapper.tokenize_ipa(s)
            return phones

        # Normalize predicted_tokens: expand tokens that contain spaces into atomic tokens
        # while preserving leading markers like '▁' or '|'. This keeps behavior
        # consistent whether the decoder returns grouped tokens or atomic ones.
        use_tokens = []
        for t in predicted_tokens:
            if not t:
                continue
            s = t.strip()
            if ' ' in s:
                parts = s.split()
                # preserve leading marker if present on the original token
                has_lead_marker = s.startswith('▁') or s.startswith('|')
                for i, p in enumerate(parts):
                    if i == 0 and has_lead_marker:
                        # ensure marker is attached to first part
                        if p.startswith('▁') or p.startswith('|'):
                            use_tokens.append(p)
                        else:
                            # attach the same leading marker as original
                            lead = '▁' if s.startswith('▁') else '|'
                            use_tokens.append(lead + p)
                    else:
                        use_tokens.append(p)
            else:
                use_tokens.append(s)
        chunks = []
        if any('▁' in t or t.startswith('|') for t in use_tokens):
            current = []
            for t in use_tokens:
                clean = t
                if '▁' in t or t.startswith('|'):
                    # start new chunk
                    if current:
                        # flatten current tokens into phones
                        phones = []
                        for tok in current:
                            phones.extend(token_to_phones(tok))
                        chunks.append(phones)
                    current = [clean]
                else:
                    current.append(clean)
            if current:
                phones = []
                for tok in current:
                    phones.extend(token_to_phones(tok))
                chunks.append(phones)
        else:
            # No markers: fallback to splitting predicted_phones evenly
            if num_words == 0:
                return []
            L = len(predicted_phones)
            if L == 0:
                return [[] for _ in range(num_words)]
            base = L // num_words
            rem = L % num_words
            idx = 0
            for i in range(num_words):
                sz = base + (1 if i < rem else 0)
                if sz > 0:
                    chunks.append(predicted_phones[idx:idx+sz])
                else:
                    chunks.append([])
                idx += sz

        # Now adjust chunks to have exactly num_words
        # If too many chunks: merge smallest adjacent until match
        while len(chunks) > num_words:
            # merge the two smallest adjacent chunks (prefer right-side)
            min_pair_idx = None
            min_pair_size = None
            for i in range(len(chunks)-1):
                size = len(chunks[i]) + len(chunks[i+1])
                if min_pair_size is None or size < min_pair_size:
                    min_pair_size = size
                    min_pair_idx = i
            # merge at min_pair_idx
            chunks[min_pair_idx] = chunks[min_pair_idx] + chunks[min_pair_idx+1]
            del chunks[min_pair_idx+1]

        # If there are fewer chunks than words, assume the model produced fewer
        # spoken words than the script. Do NOT split existing chunks; instead
        # append empty chunks so the remaining target words receive no predicted
        # phones (they will be reported as null predicted_ipa).
        if len(chunks) < num_words:
            chunks.extend([[] for _ in range(num_words - len(chunks))])

        # Finally, ensure length == num_words
        if len(chunks) != num_words:
            # if still mismatch, normalize by merging/slicing into exactly num_words
            flat = [p for ch in chunks for p in ch]
            L = len(flat)
            base = L // num_words if num_words else 0
            rem = L % num_words if num_words else 0
            new_chunks = []
            idx = 0
            for i in range(num_words):
                sz = base + (1 if i < rem else 0)
                if sz > 0:
                    new_chunks.append(flat[idx:idx+sz])
                else:
                    new_chunks.append([])
                idx += sz
            chunks = new_chunks

        return chunks

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