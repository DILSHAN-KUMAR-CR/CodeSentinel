import json
import os
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

load_dotenv(dotenv_path=ENV_FILE)

def analyze_finding(finding, source_code, language):
    api_key = os.getenv("OPENAI_API_KEY")

    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured.")

    client = OpenAI(api_key=api_key)

    prompt = f"""
You are a cybersecurity code-review assistant.

Analyze the following static-analysis finding.

Programming language:
{language}

Finding:
{json.dumps(finding, indent=2)}

Relevant source code:
{source_code}

Return ONLY valid JSON with these fields:

{{
  "explanation": "Clear explanation of why this code is vulnerable.",
  "attack_impact": "Explain what an attacker could potentially do.",
  "secure_fix": "Explain the recommended secure approach.",
  "fixed_code": "Provide a secure replacement for the vulnerable code.",
  "developer_tip": "Give one practical security tip."
}}

Do not invent facts that are not supported by the finding or source code.
Keep the explanation concise and developer-friendly.
"""

    response = client.responses.create(
        model="gpt-5.6-luna",
        input=prompt
    )

    text = response.output_text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {
            "explanation": text,
            "attack_impact": "The AI response could not be parsed into structured fields.",
            "secure_fix": finding.get(
                "recommendation",
                "Review and remediate the finding."
            ),
            "fixed_code": "",
            "developer_tip": "Validate security-sensitive changes with tests and static analysis."
        }

def analyze_findings(findings, source_code, language):
    if not findings:
        return []

    results = []

    for finding in findings:
        analysis = analyze_finding(
            finding,
            source_code,
            language
        )

        results.append({
            **finding,
            "ai_analysis": analysis
        })

    return results