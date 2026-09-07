import subprocess
import sys
from pathlib import Path

from scanner import scan_code


EXCLUDED_FILES = {
    "scanner.py",
    "test_scanner.py",
    "ci_scan.py",
}


def get_changed_files():
    try:
        if "GITHUB_BASE_REF" in __import__("os").environ:
            base_ref = __import__("os").environ["GITHUB_BASE_REF"]

            subprocess.run(
                [
                    "git",
                    "fetch",
                    "origin",
                    f"{base_ref}:{base_ref}"
                ],
                check=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL
            )

            output = subprocess.check_output(
                [
                    "git",
                    "diff",
                    "--name-only",
                    f"origin/{base_ref}...HEAD"
                ],
                text=True
            )
        else:
            base = subprocess.check_output(
                ["git", "rev-parse", "HEAD^"],
                text=True,
                stderr=subprocess.DEVNULL
            ).strip()

            head = subprocess.check_output(
                ["git", "rev-parse", "HEAD"],
                text=True
            ).strip()

            output = subprocess.check_output(
                [
                    "git",
                    "diff",
                    "--name-only",
                    base,
                    head
                ],
                text=True
            )

        files = [
            Path(file.strip())
            for file in output.splitlines()
            if file.strip().endswith(".py")
        ]

    except subprocess.CalledProcessError:
        files = [
            Path(file)
            for file in subprocess.check_output(
                ["git", "ls-files", "*.py"],
                text=True
            ).splitlines()
        ]

    return [
        file_path
        for file_path in files
        if file_path.name not in EXCLUDED_FILES
    ]


def main():
    files = get_changed_files()

    if not files:
        print("No application Python files to scan.")
        return

    total_findings = 0
    critical = 0
    high = 0
    medium = 0
    low = 0
    scanned_files = 0

    for file_path in files:
        if not file_path.exists():
            continue

        scanned_files += 1

        code = file_path.read_text(
            encoding="utf-8"
        )

        result = scan_code(
            code,
            "python"
        )

        print(f"\nFile: {file_path}")
        print(f"Security score: {result.score}")
        print(f"Findings: {len(result.findings)}")

        for finding in result.findings:
            print(
                f"[{finding.severity}] "
                f"{finding.vulnerability} "
                f"line {finding.line} "
                f"{finding.cwe or ''}"
            )

            total_findings += 1

            if finding.severity == "CRITICAL":
                critical += 1
            elif finding.severity == "HIGH":
                high += 1
            elif finding.severity == "MEDIUM":
                medium += 1
            elif finding.severity == "LOW":
                low += 1

    print("\nSecurity Scan Summary")
    print(f"Python files scanned: {scanned_files}")
    print(f"Total findings: {total_findings}")
    print(f"Critical: {critical}")
    print(f"High: {high}")
    print(f"Medium: {medium}")
    print(f"Low: {low}")

    if critical > 0 or high > 0:
        print(
            "\nSecurity gate FAILED."
        )
        print(
            "Pull Request contains critical or high severity vulnerabilities."
        )
        sys.exit(1)

    print("\nSecurity gate PASSED.")
    print(
        "No critical or high severity vulnerabilities were detected."
    )


if __name__ == "__main__":
    main()