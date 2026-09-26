import json
import time

from fastapi import FastAPI, Response
from pydantic import BaseModel
from misaki import espeak

app = FastAPI()

g2p = espeak.EspeakG2P(language="hi")


class G2PRequest(BaseModel):
    text: str


@app.get("/")
@app.head("/")
def root():
    return {
        "status": "ok",
        "service": "hindi-g2p",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "hindi-g2p",
    }


@app.post("/g2p")
def convert(request: G2PRequest):
    t0 = time.perf_counter()

    if not request.text.strip():
        return Response(
            content=json.dumps({"error": "Text is required."}, ensure_ascii=False),
            status_code=400,
            media_type="application/json; charset=utf-8",
        )

    result = g2p(request.text)
    phonemes = result[0] if isinstance(result, tuple) else result

    print(f"[G2P] len={len(request.text)} took {(time.perf_counter() - t0)*1000:.0f}ms")

    return Response(
        content=json.dumps({"phonemes": phonemes}, ensure_ascii=False),
        media_type="application/json; charset=utf-8",
    )