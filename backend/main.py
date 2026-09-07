from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models import ScanRequest, ScanResponse
from scanner import scan_code
from ai_analyzer import analyze_findings

app = FastAPI(title="CodeSentinel API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "codesentinel"}

@app.post("/scan", response_model=ScanResponse)
def scan(request: ScanRequest):
    if not request.code.strip():
        raise HTTPException(
            status_code=400,
            detail="Source code cannot be empty."
        )

    result = scan_code(
        request.code,
        request.language
    )

    findings = [finding.model_dump() for finding in result.findings]

    try:
        ai_findings = analyze_findings(
            findings,
            request.code,
            request.language
        )

        result.findings = ai_findings
        result.ai_enabled = True
        result.ai_error = None

    except Exception as error:
        result.ai_enabled = False
        result.ai_error = str(error)

    return result