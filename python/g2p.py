import json

from fastapi import FastAPI, Response
from pydantic import BaseModel
from misaki import espeak

app = FastAPI()

g2p = espeak.EspeakG2P(language="hi")


class G2PRequest(BaseModel):
    text: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "hindi-g2p",
    }


@app.post("/g2p")
def convert(request: G2PRequest):
    if not request.text.strip():
        return Response(
            content=json.dumps(
                {"error": "Text is required."},
                ensure_ascii=False,
            ),
            status_code=400,
            media_type="application/json; charset=utf-8",
        )

    phonemes = g2p(request.text)

    return Response(
        content=json.dumps(
            {"phonemes": phonemes},
            ensure_ascii=False,
        ),
        media_type="application/json; charset=utf-8",
    )