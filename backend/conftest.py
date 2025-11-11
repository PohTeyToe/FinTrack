"""Shared pytest fixtures for the FinTrack backend."""
import pytest
from django.contrib.auth.models import User


@pytest.fixture
def user(db) -> User:
    """Create and return a test user."""
    return User.objects.create_user(
        username="testuser",
        email="test@example.com",
        password="testpass123",
    )
