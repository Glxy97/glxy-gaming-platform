from fastapi.testclient import TestClient

payload = [
    {
        "pdf_name": "field_one",
        "display_label": None,
        "group_name": None,
        "field_type": "text",
        "required": True,
        "validation_pattern": None,
        "datapad_field_id": None,
        "suggestions": None,
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0,
        "status": "draft",
    }
]


def test_ai_suggest_labels(client: TestClient) -> None:
    response = client.post("/api/ai/suggest-labels", json=payload)
    assert response.status_code == 200
    body = response.json()
    assert body[0]["display_label"] == "Field One"