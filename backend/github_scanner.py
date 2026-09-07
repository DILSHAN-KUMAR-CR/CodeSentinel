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


def parse_repository_url(repository_url):
    parsed = urlparse(repository_url)

    if parsed.scheme not in {"http", "https"}:
        raise ValueError("Invalid GitHub repository URL.")

    if parsed.netloc.lower() != "github.com":
        raise ValueError("URL must belong to github.com.")

    parts = [
        part
        for part in parsed.path.strip("/").split("/")
        if part
    ]

    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL.")

    owner = parts[0]
    repository = parts[1]

    if repository.endswith(".git"):
        repository = repository[:-4]

    return owner, repository


def get_repository_tree(repository_url):
    owner, repository = parse_repository_url(repository_url)

    api_url = (
        f"https://api.github.com/repos/"
        f"{owner}/{repository}/git/trees/HEAD?recursive=1"
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
            "GitHub repository was not found or is not public."
        )

    response.raise_for_status()

    data = response.json()

    if data.get("truncated"):
        raise ValueError(
            "The repository is too large to scan in the current version."
        )

    return owner, repository, data.get("tree", [])


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


def fetch_file_content(download_url):
    response = requests.get(
        download_url,
        timeout=20,
        headers={
            "Accept": "application/vnd.github+json"
        }
    )

    response.raise_for_status()

    data = response.json()

    if data.get("encoding") != "base64":
        raise ValueError("Unsupported GitHub file encoding.")

    return base64.b64decode(
        data["content"]
    ).decode(
        "utf-8",
        errors="replace"
    )


def collect_python_files(repository_url):
    owner, repository, tree = get_repository_tree(
        repository_url
    )

    files = []

    for item in tree:
        if item.get("type") != "blob":
            continue

        path = item.get("path", "")

        if not should_scan_file(path):
            continue

        files.append({
            "path": path,
            "url": (
                f"https://api.github.com/repos/"
                f"{owner}/{repository}/contents/{path}"
            )
        })

    return owner, repository, files


def scan_repository_files(repository_url, scan_function):
    owner, repository, files = collect_python_files(
        repository_url
    )

    results = []

    for file in files:
        try:
            code = fetch_file_content(
                file["url"]
            )

            scan_result = scan_function(
                code,
                "python"
            )

            results.append({
                "path": file["path"],
                "source_code": code,
                "score": scan_result.score,
                "findings": [
                    finding.model_dump()
                    for finding in scan_result.findings
                ]
            })

        except Exception as error:
            results.append({
                "path": file["path"],
                "source_code": "",
                "score": 0,
                "findings": [],
                "error": str(error)
            })

    return {
        "owner": owner,
        "repository": repository,
        "files_scanned": len(results),
        "files": results
    }