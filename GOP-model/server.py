import tempfile
import shutil
import os
import torchaudio
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import Optional

from scorer import PronunciationScorer

app = FastAPI(title="Pronunciation Scoring API")

# Khởi tạo scorer dùng lại cho tất cả request
scorer = PronunciationScorer()


@app.post('/score')
async def score_endpoint(text: str = Form(...), audio: UploadFile = File(...), beam_width: Optional[int] = Form(50), ignore_stress: Optional[bool] = Form(True), preprocessed: Optional[bool] = Form(False)):
    """Accepts form-data: 'text' (script) and 'audio' (wav file). Returns scoring JSON.
    Query params/form fields:
    - text: reference script
    - audio: uploaded wav file
    - beam_width: beam size for rescoring
    - ignore_stress: whether to strip stress digits from ARPAbet
    """
    # Save uploaded audio to a temporary file
    suffix = '.wav'
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        content = await audio.read()
        tmp.write(content)
    try:
        # call scoring method (synchronous) trên instance scorer
        # Note: scorer.score_pronunciation signature: (script_text, audio_path, model_name=..., thresholds=...)
        # If the uploaded audio is not preprocessed, normalize to 16k mono
        norm_tmp_path = None
        try:
            if not preprocessed:
                # normalize and produce a new temp file
                norm_tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
                norm_tmp_path = norm_tmp.name
                norm_tmp.close()
                # load, convert to mono and 16k, then save
                wav, sr = torchaudio.load(tmp_path)
                if wav.dim() == 2 and wav.size(0) > 1:
                    wav = wav.mean(dim=0, keepdim=True)
                if sr != 16000:
                    wav = torchaudio.functional.resample(wav, sr, 16000)
                torchaudio.save(norm_tmp_path, wav, 16000)

            use_path = norm_tmp_path if norm_tmp_path else tmp_path
            result = scorer.score_pronunciation(text, use_path)
            # score_pronunciation trả về dataclass PronunciationResult -> chuyển sang dict để JSONResponse serialize được
            resp = scorer.to_json(result)
            return JSONResponse(resp)
        finally:
            # remove normalized temp file if created
            if norm_tmp_path:
                try:
                    os.remove(norm_tmp_path)
                except Exception:
                    pass
    finally:
        try:
            shutil.os.remove(tmp_path)
        except Exception:
            pass


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='0.0.0.0', port=5005, log_level='info')
