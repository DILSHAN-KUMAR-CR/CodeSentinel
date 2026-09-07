import re
from models import Finding, ScanResponse

SEVERITY_WEIGHT = {
    "CRITICAL": 35,
    "HIGH": 20,
    "MEDIUM": 10,
    "LOW": 5
}

def make_finding(fid, vulnerability, severity, line, code, description, recommendation, category, cwe=None):
    return Finding(
        id=fid,
        vulnerability=vulnerability,
        severity=severity,
        line=line,
        code=code.strip(),
        description=description,
        recommendation=recommendation,
        category=category,
        cwe=cwe
    )

def scan_code(code, language="python"):
    findings = []
    lines = code.splitlines()

    for index, raw in enumerate(lines, start=1):
        line = raw.strip()

        if re.search(r'(?i)\b(password|passwd|pwd|secret|token|api[_-]?key)\s*=\s*["\'][^"\']{3,}["\']', line):
            findings.append(make_finding(
                f"SEC-{len(findings)+1}",
                "Hardcoded Credential",
                "HIGH",
                index,
                raw,
                "A credential-like value is directly stored in source code.",
                "Move secrets to environment variables or a managed secrets store.",
                "Secrets",
                "CWE-798"
            ))

        if re.search(r'(?i)\b(api[_-]?key|access[_-]?token|secret[_-]?key)\s*[:=]\s*["\'][^"\']{8,}["\']', line):
            if not any(f.line == index and f.vulnerability == "Hardcoded Credential" for f in findings):
                findings.append(make_finding(
                    f"SEC-{len(findings)+1}",
                    "Hardcoded Secret",
                    "CRITICAL",
                    index,
                    raw,
                    "A secret or API credential appears to be embedded in source code.",
                    "Revoke exposed credentials and load secrets from a secure environment or vault.",
                    "Secrets",
                    "CWE-798"
                ))

        if re.search(r'(?i)(select|insert|update|delete).*(\+|format\(|f["\'])', line):
            findings.append(make_finding(
                f"SEC-{len(findings)+1}",
                "SQL Injection",
                "CRITICAL",
                index,
                raw,
                "SQL text appears to be constructed with dynamic input.",
                "Use parameterized queries or prepared statements.",
                "Injection",
                "CWE-89"
            ))

        if re.search(r'\b(eval|exec)\s*\(', line):
            findings.append(make_finding(
                f"SEC-{len(findings)+1}",
                "Dangerous Dynamic Execution",
                "HIGH",
                index,
                raw,
                "Dynamic execution can allow attacker-controlled code to run.",
                "Avoid eval and exec. Use explicit parsing or a safe allowlist.",
                "Code Execution",
                "CWE-95"
            ))

        if re.search(r'(?i)password\s*==\s*["\'](?:123456|password|admin|admin123|qwerty)["\']', line):
            findings.append(make_finding(
                f"SEC-{len(findings)+1}",
                "Weak Authentication",
                "HIGH",
                index,
                raw,
                "Authentication logic contains a weak hardcoded password.",
                "Use salted password hashing, secure credential storage, and strong authentication policies.",
                "Authentication",
                "CWE-521"
            ))

        if re.search(r'(?i)debug\s*=\s*true', line):
            findings.append(make_finding(
                f"SEC-{len(findings)+1}",
                "Debug Mode Enabled",
                "MEDIUM",
                index,
                raw,
                "Debug mode may expose internal application information.",
                "Disable debug mode in production environments.",
                "Configuration",
                "CWE-489"
            ))

        if re.search(r'(?i)(verify\s*=\s*false|ssl[_-]?verify\s*=\s*false)', line):
            findings.append(make_finding(
                f"SEC-{len(findings)+1}",
                "TLS Verification Disabled",
                "HIGH",
                index,
                raw,
                "Certificate verification appears to be disabled.",
                "Enable TLS certificate verification and validate trusted certificates.",
                "Transport Security",
                "CWE-295"
            ))

    total_penalty = sum(SEVERITY_WEIGHT.get(f.severity, 0) for f in findings)
    score = max(0, 100 - total_penalty)

    summary = {
        "critical": sum(f.severity == "CRITICAL" for f in findings),
        "high": sum(f.severity == "HIGH" for f in findings),
        "medium": sum(f.severity == "MEDIUM" for f in findings),
        "low": sum(f.severity == "LOW" for f in findings),
        "total": len(findings)
    }

    return ScanResponse(score=score, summary=summary, findings=findings)
