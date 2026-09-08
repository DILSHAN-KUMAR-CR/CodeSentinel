from datetime import datetime, timezone

from database import scan_history_collection


def save_scan_history(
    scan_type,
    score,
    critical,
    high,
    medium,
    low,
    total_findings,
    repository=None,
    pull_request=None
):
    document = {
        "scan_type": scan_type,
        "score": score,
        "critical": critical,
        "high": high,
        "medium": medium,
        "low": low,
        "total_findings": total_findings,
        "repository": repository,
        "pull_request": pull_request,
        "created_at": datetime.now(timezone.utc)
    }

    result = scan_history_collection.insert_one(document)

    return str(result.inserted_id)


def get_scan_history(limit=20):
    documents = scan_history_collection.find(
        {},
        {
            "_id": 1,
            "scan_type": 1,
            "score": 1,
            "critical": 1,
            "high": 1,
            "medium": 1,
            "low": 1,
            "total_findings": 1,
            "repository": 1,
            "pull_request": 1,
            "created_at": 1
        }
    ).sort(
        "created_at",
        -1
    ).limit(limit)

    history = []

    for document in documents:
        history.append({
            "id": str(document["_id"]),
            "scan_type": document.get(
                "scan_type",
                ""
            ),
            "score": document.get(
                "score",
                0
            ),
            "critical": document.get(
                "critical",
                0
            ),
            "high": document.get(
                "high",
                0
            ),
            "medium": document.get(
                "medium",
                0
            ),
            "low": document.get(
                "low",
                0
            ),
            "total_findings": document.get(
                "total_findings",
                0
            ),
            "repository": document.get(
                "repository"
            ),
            "pull_request": document.get(
                "pull_request"
            ),
            "created_at": document.get(
                "created_at"
            ).isoformat()
        })

    return history