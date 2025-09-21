# app.py
from flask import Flask, request, jsonify
from gramformer import Gramformer
import torch
import re

app = Flask(__name__)

# ----- Utils -----
def set_seed(seed: int = 1212):
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)

def preprocess_text(text: str) -> str:
    """Làm sạch text: bỏ xuống dòng, dư khoảng trắng, trim."""
    text = re.sub(r'\n+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def to_string(x):
    """Gramformer có thể trả tuple/list; lấy chuỗi ứng viên."""
    if isinstance(x, (list, tuple)) and x:
        x = x[0]
    return str(x)

# ----- Khởi tạo model -----
set_seed(1212)
# Dùng CPU cho ổn định trên Windows; muốn GPU thì đổi use_gpu=True
gf = Gramformer(models=1, use_gpu=False)

# ----- API -----
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Grammar checker API is running'})

@app.route('/check-grammar', methods=['POST'])
def check_grammar():
    try:
        data = request.get_json() or {}
        raw_text = data.get('text', '')

        if not isinstance(raw_text, str) or not raw_text.strip():
            return jsonify({'error': 'Missing or empty "text"'}), 400

        # số phương án muốn lấy (tăng để “sáng tạo” hơn)
        n = data.get('n', 3)
        try:
            n = max(1, int(n))
        except Exception:
            n = 3

        # index phương án muốn chọn: 0-based
        # mẹo: chọn 1 (phương án thứ 2) thường “ít bảo thủ” hơn
        pick = data.get('pick', 1)
        try:
            pick = int(pick)
        except Exception:
            pick = 1

        processed = preprocess_text(raw_text)

        # Lấy các phương án từ Gramformer
        raw_cands = list(gf.correct(processed, max_candidates=n))  # iterable -> list
        # Chuẩn hoá + loại trùng
        uniq = []
        for c in raw_cands:
            s = to_string(c)
            if s not in uniq:
                uniq.append(s)

        if not uniq:
            # Không có ứng viên: trả nguyên văn sau khi preprocess
            return jsonify({
                'input': raw_text,
                'processed': processed,
                'candidates': [],
                'chosen': processed
            })

        # Chọn phương án theo pick (nếu quá giới hạn thì lùi về cuối danh sách)
        chosen_idx = min(max(0, pick), len(uniq) - 1)
        chosen = uniq[chosen_idx]

        return jsonify({
            'input': raw_text,
            'processed': processed,
            'candidates': uniq,
            'chosen_index': chosen_idx,
            'chosen': chosen
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ----- Entrypoint -----
if __name__ == '__main__':
    # Chạy server Flask
    app.run(host='0.0.0.0', port=5002, debug=True)
