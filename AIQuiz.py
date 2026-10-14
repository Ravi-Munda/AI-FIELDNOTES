#!/usr/bin/env python3
"""Cross-platform local server for the AI Fieldnotes web app.

Run with: python AIQuiz.py
On macOS or Linux, use: python3 AIQuiz.py
"""

from __future__ import annotations

import argparse
import json
import mimetypes
import os
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

APP_DIR = Path(__file__).resolve().parent
QUESTION_FILE = APP_DIR / "questions.json"
QUESTION_COUNT = len(json.loads(QUESTION_FILE.read_text(encoding="utf-8")))
mimetypes.add_type("application/manifest+json", ".webmanifest")


class QuizHandler(BaseHTTPRequestHandler):
    server_version = "AIFieldnotes/1.0"

    def do_GET(self) -> None:
        request_path = unquote(urlparse(self.path).path)
        if request_path == "/health":
            self._send_bytes(
                json.dumps({"status": "ok", "questions": QUESTION_COUNT}).encode("utf-8"),
                "application/json; charset=utf-8",
                "no-store",
            )
            return

        if request_path == "/":
            request_path = "/index.html"
        relative_path = request_path.lstrip("/")
        target = (APP_DIR / relative_path).resolve()
        try:
            target.relative_to(APP_DIR)
        except ValueError:
            self.send_error(404, "Not found")
            return
        if not target.is_file():
            self.send_error(404, "Not found")
            return

        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        if target.suffix == ".webmanifest":
            content_type = "application/manifest+json"
        cache_control = "no-cache" if target.name in {"index.html", "sw.js"} else "public, max-age=3600"
        self._send_bytes(target.read_bytes(), content_type, cache_control)

    def _send_bytes(self, body: bytes, content_type: str, cache_control: str) -> None:
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", cache_control)
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, fmt: str, *args: object) -> None:
        print("%s - %s" % (self.address_string(), fmt % args))


def main() -> None:
    parser = argparse.ArgumentParser(description="Run the AI Fieldnotes website.")
    parser.add_argument("--host", default="127.0.0.1", help="Network interface (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8000")), help="Port to use")
    parser.add_argument("--no-browser", action="store_true", help="Do not open a browser automatically")
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), QuizHandler)
    display_host = "localhost" if args.host in {"127.0.0.1", "0.0.0.0"} else args.host
    url = "http://%s:%s" % (display_host, args.port)
    print("AI Fieldnotes is ready at " + url)
    print("Press Ctrl+C to stop the local server.")
    if not args.no_browser:
        try:
            webbrowser.open(url, new=2)
        except Exception:
            pass
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping AI Fieldnotes.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
