"""Tests for tweet-browser.py — CLI interface, session I/O, error output format.

Browser-use actions are NOT tested here (require a real browser + Venice key).
These tests cover the plumbing: argparse, base64 session encode/decode, JSON output.
"""
import base64
import importlib.util
import json
import os
import subprocess
import sys
from pathlib import Path

import pytest

SCRIPT = Path(__file__).parents[2] / "scripts" / "tweet-browser.py"


def load_module(tmp_path):
    """Import tweet-browser.py as a module (lazy imports mean no browser-use needed)."""
    os.chdir(tmp_path)
    spec = importlib.util.spec_from_file_location("tweet_browser", SCRIPT)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


class TestCLI:
    def test_help_exits_zero(self):
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--help"],
            capture_output=True, text=True,
        )
        assert r.returncode == 0
        assert "--action" in r.stdout

    def test_missing_action_exits_nonzero(self):
        r = subprocess.run(
            [sys.executable, str(SCRIPT)],
            capture_output=True, text=True,
        )
        assert r.returncode != 0

    def test_unknown_action_exits_nonzero(self):
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--action", "bogus"],
            capture_output=True, text=True,
        )
        assert r.returncode == 1

    def test_post_no_text_or_file_exits_one(self, tmp_path):
        env = {**os.environ, "VENICE_API_KEY": "fake"}
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--action", "post"],
            capture_output=True, text=True, cwd=str(tmp_path), env=env,
        )
        assert r.returncode == 1
        data = json.loads(r.stderr.strip())
        assert data["status"] == "error"

    def test_engagement_no_url_exits_one(self, tmp_path):
        env = {**os.environ, "VENICE_API_KEY": "fake"}
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--action", "engagement"],
            capture_output=True, text=True, cwd=str(tmp_path), env=env,
        )
        assert r.returncode == 1
        err = json.loads(r.stderr.strip())
        assert err["status"] == "error"


class TestSession:
    def test_load_returns_none_when_file_missing(self, tmp_path):
        (tmp_path / "memory").mkdir()
        mod = load_module(tmp_path)
        assert mod.load_session() is None

    def test_save_creates_base64_file(self, tmp_path):
        (tmp_path / "memory").mkdir()
        mod = load_module(tmp_path)
        data = {"cookies": [{"name": "auth_token", "value": "abc123"}], "origins": []}
        mod.save_session(data)
        session_file = tmp_path / "memory" / "x-session.json"
        assert session_file.exists()
        raw = session_file.read_text().strip()
        decoded = base64.b64decode(raw.encode())
        assert json.loads(decoded) == data

    def test_load_after_save_roundtrip(self, tmp_path):
        (tmp_path / "memory").mkdir()
        mod = load_module(tmp_path)
        data = {"cookies": [{"name": "ct0", "value": "xyz789"}], "origins": []}
        mod.save_session(data)
        loaded = mod.load_session()
        assert loaded == data

    def test_load_with_corrupt_file_returns_none(self, tmp_path):
        (tmp_path / "memory").mkdir()
        (tmp_path / "memory" / "x-session.json").write_text("not-valid-base64!!!")
        mod = load_module(tmp_path)
        assert mod.load_session() is None

    def test_post_no_session_outputs_error_json(self, tmp_path):
        """Post action without a session must print JSON error to stderr, exit 1."""
        (tmp_path / "memory").mkdir()
        env = {**os.environ, "VENICE_API_KEY": "fake_key_no_network"}
        r = subprocess.run(
            [sys.executable, str(SCRIPT), "--action", "post", "--text", "hello"],
            capture_output=True, text=True, cwd=str(tmp_path), env=env,
        )
        assert r.returncode == 1
        data = json.loads(r.stderr.strip())
        assert data["status"] == "error"
        assert "session" in data["reason"].lower()
