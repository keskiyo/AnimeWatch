from fastapi.testclient import TestClient

from src.main import app


client = TestClient(app)


def test_health_endpoint_reports_fastapi_backend():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "runtime": "fastapi"}


def test_catalog_endpoint_keeps_frontend_response_shape():
    response = client.get("/api/anime", params={"page": "1", "limit": "2", "sort": "date"})

    assert response.status_code == 200
    payload = response.json()
    assert set(payload) == {"data", "total", "page"}
    assert payload["page"] == 1
    assert isinstance(payload["total"], int)
    assert len(payload["data"]) <= 2
    assert {
        "id",
        "title_ru",
        "title_en",
        "poster_url",
        "status",
        "year",
        "episodes_total",
        "episodes_aired",
        "rating",
    }.issubset(payload["data"][0])


def test_kodik_player_without_token_is_unavailable_not_error():
    response = client.get("/api/player/kodik/56321/1")

    assert response.status_code == 200
    assert response.json() == {
        "available": False,
        "provider": "kodik",
        "message": "Kodik token is not configured",
    }
