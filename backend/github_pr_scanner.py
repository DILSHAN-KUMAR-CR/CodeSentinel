import base64
from pathlib import Path
from urllib.parse import urlparse

import requests


EXCLUDED_DIRECTORIES = {
    ".git",
    ".github",
    "node_modules",
    ".venv",
    "venv",
    "__pycache__",
    "dist",
    "build",
    "sample-code",
}

EXCLUDED_FILES = {
    "scanner.py",
    "test_scanner.py",
    "ci_scan.py",
}


def parse_pull_request_url(pull_request_url):
    parsed = urlparse(pull_request_url)

    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Invalid GitHub Pull Request URL.")

    if parsed.netloc.lower() != "github.com":
        raise ValueError("URL must belong to github.com.")

    parts = [
        part
        for part in parsed.path.strip("/").split("/")
        if part
    ]

    if len(parts) < 4:
        raise ValueError("Invalid GitHub Pull Request URL.")

    if parts[2].lower() != "pull":
        raise ValueError("URL must point to a GitHub Pull Request.")

    owner = parts[0]
    repository = parts[1]

    try:
        pull_number = int(parts[3])
    except ValueError:
        raise ValueError("Invalid Pull Request number.")

    return owner, repository, pull_number


def get_pull_request(pull_request_url):
    owner, repository, pull_number = parse_pull_request_url(
        pull_request_url
    )

    api_url = (
        f"https://api.github.com/repos/"
        f"{owner}/{repository}/pulls/{pull_number}"
    )

    response = requests.get(
        api_url,
        timeout=20,
        headers={
            "Accept": "application/vnd.github+json"
        }
    )

    if response.status_code == 404:
        raise ValueError(
            "GitHub Pull Request was not found or is not public."
        )

    response.raise_for_status()

    return response.json()


def get_pull_request_files(
    owner,
    repository,
    pull_number
):
    api_url = (
        f"https://api.github.com/repos/"
        f"{owner}/{repository}/pulls/"
        f"{pull_number}/files"
    )

    response = requests.get(
        api_url,
        timeout=20,
        headers={
            "Accept": "application/vnd.github+json"
        }
    )

    response.raise_for_status()

    return response.json()


def should_scan_file(path):
    file_path = Path(path)

    if file_path.suffix.lower() != ".py":
        return False

    if file_path.name in EXCLUDED_FILES:
        return False

    if any(
        directory in EXCLUDED_DIRECTORIES
        for directory in file_path.parts
    ):
        return False

    return True


def fetch_file_content(
    owner,
    repository,
    path,
    commit_sha
):
    api_url = (
        f"https://api.github.com/repos/"
        f"{owner}/{repository}/contents/{path}"
    )

    response = requests.get(
        api_url,
        timeout=20,
        headers={
            "Accept": "application/vnd.github+json"
        },
        params={
            "ref": commit_sha
        }
    )

    response.raise_for_status()

    data = response.json()

    if data.get("encoding") != "base64":
        raise ValueError(
            "Unsupported GitHub file encoding."
        )

    return base64.b64decode(
        data["content"]
    ).decode(
        "utf-8",
        errors="replace"
    )


def scan_pull_request(
    pull_request_url,
    scan_function
):
    pull_request = get_pull_request(
        pull_request_url
    )

    owner, repository, pull_number = (
        parse_pull_request_url(
            pull_request_url
        )
    )

    files = get_pull_request_files(
        owner,
        repository,
        pull_number
    )

    head_sha = pull_request["head"]["sha"]

    results = []

    for file in files:
        path = file.get("filename", "")

        if not should_scan_file(path):
            continue

        if file.get("status") == "removed":
            continue

        try:
            code = fetch_file_content(
                owner,
                repository,
                path,
                head_sha
            )

            scan_result = scan_function(
                code,
                "python"
            )

            results.append({
                "path": path,
                "source_code": code,
                "score": scan_result.score,
                "findings": [
                    finding.model_dump()
                    for finding in scan_result.findings
                ]
            })

        except Exception as error:
            results.append({
                "path": path,
                "source_code": "",
                "score": 0,
                "findings": [],
                "error": str(error)
            })

    return {
        "owner": owner,
        "repository": repository,
        "pull_number": pull_number,
        "title": pull_request.get(
            "title",
            ""
        ),
        "state": pull_request.get(
            "state",
            ""
        ),
        "files_scanned": len(results),
        "files": results
    }