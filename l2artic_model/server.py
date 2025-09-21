import tempfile
import shutil
from fastapi import FastAPI, File, UploadFile, Form
from fastapi.responses import JSONResponse
from typing import Optional

from Gop import score_pronunciation

app = FastAPI(title="Pronunciation Scoring API")


@app.post('/score')
async def score_endpoint(text: str = Form(...), audio: UploadFile = File(...), beam_width: Optional[int] = Form(50), ignore_stress: Optional[bool] = Form(True)):
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
        # call scoring function (synchronous)
        result = score_pronunciation(text, tmp_path, beam_width=int(beam_width), ignore_stress=bool(ignore_stress))
        return JSONResponse(result)
    finally:
        try:
            shutil.os.remove(tmp_path)
        except Exception:
            pass


if __name__ == '__main__':
    import uvicorn
    uvicorn.run('server:app', host='0.0.0.0', port=5005, log_level='info')
