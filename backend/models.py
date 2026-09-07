from pydantic import BaseModel, Field
from typing import List, Optional

class ScanRequest(BaseModel):
    code: str = Field(min_length=1)
    language: str = "python"

class AIAnalysis(BaseModel):
    explanation: str
    attack_impact: str
    secure_fix: str
    fixed_code: str
    developer_tip: str

class Finding(BaseModel):
    id: str
    vulnerability: str
    severity: str
    line: int
    code: str
    description: str
    recommendation: str
    category: str
    cwe: Optional[str] = None
    ai_analysis: Optional[AIAnalysis] = None

class ScanResponse(BaseModel):
    score: int
    summary: dict
    findings: List[Finding]
    ai_enabled: bool = False
    ai_error: Optional[str] = None