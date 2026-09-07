from pydantic import BaseModel, Field
from typing import List, Optional


class ScanRequest(BaseModel):
    code: str = Field(min_length=1)
    language: str = "python"


class GitHubScanRequest(BaseModel):
    repository_url: str = Field(min_length=1)


class GitHubPullRequestScanRequest(BaseModel):
    pull_request_url: str = Field(min_length=1)


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


class GitHubFileResult(BaseModel):
    path: str
    score: int
    findings: List[Finding]
    error: Optional[str] = None


class GitHubScanResponse(BaseModel):
    owner: str
    repository: str
    files_scanned: int
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int
    files: List[GitHubFileResult]


class GitHubPullRequestFileResult(BaseModel):
    path: str
    score: int
    findings: List[Finding]
    error: Optional[str] = None


class GitHubPullRequestScanResponse(BaseModel):
    owner: str
    repository: str
    pull_number: int
    title: str
    state: str
    files_scanned: int
    total_findings: int
    critical: int
    high: int
    medium: int
    low: int
    security_gate: str
    security_gate_passed: bool
    files: List[GitHubPullRequestFileResult]