from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from ai_analyzer import analyze_finding
from ai_analyzer import analyze_findings
from github_pr_scanner import scan_pull_request
from github_scanner import scan_repository_files
from models import (
    GitHubPullRequestScanRequest,
    GitHubPullRequestScanResponse,
    GitHubScanRequest,
    GitHubScanResponse,
    ScanRequest,
    ScanResponse,
)
from scanner import scan_code


app = FastAPI(
    title="CodeSentinel API",
    version="1.5.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "codesentinel"
    }


@app.post(
    "/scan",
    response_model=ScanResponse
)
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

    findings = [
        finding.model_dump()
        for finding in result.findings
    ]

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


@app.post(
    "/scan/github",
    response_model=GitHubScanResponse
)
def scan_github(request: GitHubScanRequest):
    try:
        repository_result = scan_repository_files(
            request.repository_url,
            scan_code
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"GitHub scan failed: {error}"
        )

    critical = 0
    high = 0
    medium = 0
    low = 0
    total_findings = 0

    for file in repository_result["files"]:
        findings = file["findings"]

        if not findings:
            continue

        source_code = file["source_code"]

        ai_findings = []

        for finding in findings:
            try:
                analysis = analyze_finding(
                    finding,
                    source_code,
                    "python"
                )

                ai_findings.append({
                    **finding,
                    "ai_analysis": analysis
                })

            except Exception:
                ai_findings.append(finding)

        file["findings"] = ai_findings

        for finding in file["findings"]:
            severity = finding["severity"]

            total_findings += 1

            if severity == "CRITICAL":
                critical += 1
            elif severity == "HIGH":
                high += 1
            elif severity == "MEDIUM":
                medium += 1
            elif severity == "LOW":
                low += 1

    return {
        "owner": repository_result["owner"],
        "repository": repository_result["repository"],
        "files_scanned": repository_result["files_scanned"],
        "total_findings": total_findings,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "files": [
            {
                "path": file["path"],
                "score": file["score"],
                "findings": file["findings"],
                "error": file.get("error")
            }
            for file in repository_result["files"]
        ]
    }


@app.post(
    "/scan/github/pr",
    response_model=GitHubPullRequestScanResponse
)
def scan_github_pull_request(
    request: GitHubPullRequestScanRequest
):
    try:
        pull_request_result = scan_pull_request(
            request.pull_request_url,
            scan_code
        )

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Pull Request scan failed: {error}"
        )

    critical = 0
    high = 0
    medium = 0
    low = 0
    total_findings = 0

    for file in pull_request_result["files"]:
        findings = file["findings"]

        if not findings:
            continue

        source_code = file["source_code"]

        ai_findings = []

        for finding in findings:
            try:
                analysis = analyze_finding(
                    finding,
                    source_code,
                    "python"
                )

                ai_findings.append({
                    **finding,
                    "ai_analysis": analysis
                })

            except Exception:
                ai_findings.append(finding)

        file["findings"] = ai_findings

        for finding in file["findings"]:
            severity = finding["severity"]

            total_findings += 1

            if severity == "CRITICAL":
                critical += 1
            elif severity == "HIGH":
                high += 1
            elif severity == "MEDIUM":
                medium += 1
            elif severity == "LOW":
                low += 1

    security_gate_passed = (
        critical == 0 and high == 0
    )

    security_gate = (
        "PASSED"
        if security_gate_passed
        else "FAILED"
    )

    return {
        "owner": pull_request_result["owner"],
        "repository": pull_request_result["repository"],
        "pull_number": pull_request_result["pull_number"],
        "title": pull_request_result["title"],
        "state": pull_request_result["state"],
        "files_scanned": pull_request_result["files_scanned"],
        "total_findings": total_findings,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "security_gate": security_gate,
        "security_gate_passed": security_gate_passed,
        "files": [
            {
                "path": file["path"],
                "score": file["score"],
                "findings": file["findings"],
                "error": file.get("error")
            }
            for file in pull_request_result["files"]
        ]
    }