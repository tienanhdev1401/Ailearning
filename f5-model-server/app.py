from flask import Flask, request, jsonify
from transformers import T5Tokenizer, T5ForConditionalGeneration
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Cho phép tất cả origin, hoặc bạn có thể cấu hình cụ thể

MODEL_PATH = "./my_model"
tokenizer = T5Tokenizer.from_pretrained(MODEL_PATH)
model = T5ForConditionalGeneration.from_pretrained(MODEL_PATH)

@app.route("/generate", methods=["POST"])
def generate_text():
    data = request.json
    input_text = data.get("text", "")
    if not input_text:
        return jsonify({"error": "Missing 'text' field"}), 400

    input_ids = tokenizer(
        input_text,
        return_tensors="pt",
        truncation=True,
        max_length=400   # đủ để chứa ~200 từ tiếng Việt
    ).input_ids
    # outputs = model.generate(input_ids, max_length=100)
    outputs = model.generate(
        input_ids,
        max_new_tokens=400,     # khoảng 200 từ
        do_sample=True,
        temperature=0.8,
        top_p=0.9
    )
    result = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return jsonify({"result": result})

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001)
