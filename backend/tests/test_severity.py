import pytest

from backend.dispatch.severity import get_severity_priority, normalize_severity


@pytest.mark.parametrize(
    ("severity", "priority"),
    [
        ("critical", 4),
        ("high", 3),
        ("medium", 2),
        ("low", 1),
    ],
)
def test_get_severity_priority(severity: str, priority: int) -> None:
    assert get_severity_priority(severity) == priority


@pytest.mark.parametrize(
    ("severity", "normalized"),
    [
        ("CRITICAL", "critical"),
        ("HiGh", "high"),
        (" medium ", "medium"),
    ],
)
def test_normalize_severity_handles_case_and_whitespace(
    severity: str, normalized: str
) -> None:
    assert normalize_severity(severity) == normalized


def test_invalid_severity_raises_value_error() -> None:
    with pytest.raises(ValueError, match="Unknown severity"):
        get_severity_priority("urgent")
