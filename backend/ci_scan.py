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
            ["git", "diff", "--name-only", base, head],
            text=True
        )

        files = [
            Path(file.strip()).name
            for file in output.splitlines()
            if file.strip().endswith(".py")
        ]

    except subprocess.CalledProcessError:
        files = [
            Path(file).name
            for file in subprocess.check_output(
                ["git", "ls-files", "*.py"],
                text=True
            ).splitlines()
        ]

    return [
        Path(file_path)
        for file_path in files
        if file_path not in EXCLUDED_FILES
    ]


def main():
    files = get_changed_files()

    if not files:
        print("No application Python files to scan.")
        return

    total_findings = 0
    critical = 0
    high = 0
    scanned_files = 0

    for file_path in files:
        if not file_path.exists():
            continue

        scanned_files += 1

        code = file_path.read_text(encoding="utf-8")
        result = scan_code(code, "python")

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

            if finding.severity == "HIGH":
                high += 1

    print("\nSecurity Scan Summary")
    print(f"Python files scanned: {scanned_files}")
    print(f"Total findings: {total_findings}")
    print(f"Critical: {critical}")
    print(f"High: {high}")

    if critical > 0 or high > 0:
        print("\nSecurity scan failed because critical or high severity findings were detected.")
        sys.exit(1)

    print("\nSecurity scan passed.")


if __name__ == "__main__":
    main()