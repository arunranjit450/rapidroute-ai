from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_cors_allows_frontend_origin_on_request():
    response = client.get(
        "/health",
        headers={"Origin": "http://localhost:5173"},
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert response.headers.get("access-control-allow-credentials") == "true"


def test_cors_preflight_options_for_frontend_origin():
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type",
        },
    )

    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "POST" in response.headers.get("access-control-allow-methods", "")


def test_cors_blocks_unauthorized_origin():
    response = client.get(
        "/health",
        headers={"Origin": "http://unauthorized-origin.com"},
    )

    assert response.status_code == 200
    assert "access-control-allow-origin" not in response.headers
