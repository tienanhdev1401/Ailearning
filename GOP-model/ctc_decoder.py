"""
CTC Decoder Module
==================

Module xử lý việc decode audio thành phoneme sử dụng CTC-based models:
- Load và cache các model từ HuggingFace
- Xử lý audio input (resampling, normalization)
- Decode CTC logits thành phoneme sequence
- Fallback mechanism khi decode chính thất bại
"""

import torch
import torchaudio
from typing import List, Tuple
from transformers import pipeline, AutoProcessor, AutoModelForCTC


class CTCDecoder:
    """
    Lớp xử lý CTC-based phoneme recognition từ audio
    
    Chức năng chính:
    - Load và cache model components để tránh reload nhiều lần
    - Decode audio thành chuỗi phoneme
    - Xử lý CTC collapse và filtering
    """
    
    def __init__(self):
        """Khởi tạo CTCDecoder với model cache rỗng"""
        self._model_cache = {}
    
    def get_model_components(self, model_name: str) -> Tuple:
        """
        Load và cache model components
        
        Args:
            model_name: Tên model từ HuggingFace Hub
            
        Returns:
            Tuple: (processor, model)
        """
        if model_name in self._model_cache:
            return self._model_cache[model_name]
            
        # Load model components
        processor = AutoProcessor.from_pretrained(model_name)
        model = AutoModelForCTC.from_pretrained(model_name)
        model.eval()  # Chuyển sang evaluation mode
        
        # Cache để sử dụng lại
        self._model_cache[model_name] = (processor, model)
        return processor, model
    
    def decode_audio(self, audio_path: str, model_name: str, target_sr: int = 16000) -> List[str]:
        """
        Decode audio file thành phoneme sequence
        
        Args:
            audio_path: Đường dẫn file audio
            model_name: Tên model để sử dụng
            target_sr: Sample rate mục tiêu (Hz)
            
        Returns:
            List[str]: Danh sách phoneme tokens
        """
        try:
            processor, model = self.get_model_components(model_name)
            
            # Load và preprocess audio
            wav, sr = torchaudio.load(audio_path)
            
            # Chuyển stereo thành mono nếu cần
            if wav.dim() == 2 and wav.size(0) > 1:
                wav = wav.mean(dim=0, keepdim=True)
                
            # Resample nếu sample rate khác target
            if sr != target_sr:
                wav = torchaudio.functional.resample(wav, sr, target_sr)
                
            wav = wav.squeeze(0)  # Remove batch dimension
            
            # Chuẩn bị input cho model
            inputs = processor(wav.numpy(), sampling_rate=target_sr, return_tensors="pt")
            
            # Forward pass qua model
            with torch.no_grad():
                outputs = model(**inputs)
                logits = outputs.logits.squeeze(0)
                
            # Prepare for CTC decoding
            vocab = processor.tokenizer.get_vocab()
            id2token = {i: t for t, i in vocab.items()}
            blank_id = processor.tokenizer.pad_token_id or vocab.get('<pad>', 0)
            
            # Greedy CTC decoding
            pred_ids = torch.argmax(logits, dim=-1).tolist()
            
            # CTC collapse - loại bỏ repeated tokens và blank tokens
            tokens = []
            prev_id = None
            
            for token_id in pred_ids:
                # Skip blank tokens và repeated tokens
                if token_id == blank_id or token_id == prev_id:
                    prev_id = token_id
                    continue
                    
                token = id2token.get(token_id, '')
                if token:
                    tokens.append(token)
                prev_id = token_id
                
            # Lọc ra các special tokens không mong muốn
            tokens = [t for t in tokens if t and t not in {'|', '▁', '<space>'}]
            return tokens
            
        except Exception as e:
            # Nếu method chính thất bại, dùng fallback
            print(f"CTC decoding failed, using fallback: {e}")
            return self._fallback_decode(audio_path, model_name)
    
    def _fallback_decode(self, audio_path: str, model_name: str) -> List[str]:
        """
        Fallback decoding sử dụng transformers pipeline
        
        Args:
            audio_path: Đường dẫn file audio
            model_name: Tên model
            
        Returns:
            List[str]: Danh sách tokens (có thể kém chính xác hơn)
        """
        try:
            # Sử dụng pipeline wrapper
            pipe = pipeline(model=model_name)
            result = pipe(audio_path)
            
            # Xử lý kết quả tùy thuộc vào format trả về
            if isinstance(result, dict):
                text = result.get('text', '')
            elif isinstance(result, list) and result:
                text = result[0].get('text', '') if isinstance(result[0], dict) else str(result[0])
            else:
                text = str(result)
                
            # Tokenization cơ bản - có thể cải thiện thêm
            return text.split() if text else []
            
        except Exception as e:
            print(f"Fallback decoding also failed: {e}")
            return []  # Trả về danh sách rỗng nếu tất cả đều fail