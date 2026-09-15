SEVERITY_PRIORITIES = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
}


def normalize_severity(severity: str) -> str:
    if not isinstance(severity, str):
        raise ValueError(f"Unknown severity: {severity!r}")

    normalized = severity.strip().lower()
    if normalized not in SEVERITY_PRIORITIES:
        raise ValueError(f"Unknown severity: {severity!r}")
    return normalized


def get_severity_priority(severity: str) -> int:
    return SEVERITY_PRIORITIES[normalize_severity(severity)]
