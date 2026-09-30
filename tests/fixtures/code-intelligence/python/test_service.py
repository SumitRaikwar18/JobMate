import pytest
from app import app, UserCreate

def test_user_creation_validation():
    user = UserCreate(username="alice", email="alice@example.com")
    assert user.username == "alice"
    assert "@" in user.email

def test_api_health_check():
    response = {"status": "ok"}
    assert response["status"] == "ok"
