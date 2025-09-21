from flask import Flask, request, jsonify
from gramformer import Gramformer
import torch
import re

app = Flask(__name__)

def set_seed(seed):
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

set_seed(1212)

# Khởi tạo Gramformer
gf = Gramformer(models=1, use_gpu=False)

def preprocess_text(text):
    """Xử lý text để bắt lỗi xuống dòng và các vấn đề format"""
    # Thay thế xuống dòng bằng dấu cách
    text = re.sub(r'\n+', ' ', text)
    # Loại bỏ khoảng trắng thừa
    text = re.sub(r'\s+', ' ', text)
    # Trim text
    text = text.strip()
    return text

@app.route('/check-grammar', methods=['POST'])
def check_grammar():
    try:
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({'error': 'Missing text parameter'}), 400
        
        input_text = data['text']
        
        if not input_text or not input_text.strip():
            return jsonify({'error': 'Text cannot be empty'}), 400
        
        # Xử lý text trước khi kiểm tra
        processed_text = preprocess_text(input_text)
        
        # Kiểm tra và sửa lỗi ngữ pháp
        corrected_sentences = gf.correct(processed_text, max_candidates=1)
        
        correction = corrected_sentences[0] if corrected_sentences else processed_text
        
        return jsonify({
            'input': input_text,
            'correction': correction
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Grammar checker API is running'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5002, debug=True)
