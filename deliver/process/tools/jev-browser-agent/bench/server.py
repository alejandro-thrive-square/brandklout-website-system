"""Serve the fixtures on two origins and record what the agent did.

127.0.0.1:8801 and localhost:8802 are different sites, so an iframe from one inside the other runs
out of process, the way Elfsight's editor does. Fixtures POST /report; the bench reads /events.
"""

import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

FIXTURES = Path(__file__).with_name("fixtures")
EVENTS = {}
LOCK = threading.Lock()


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, value):
        body = json.dumps(value).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        raw = self.rfile.read(int(self.headers.get("Content-Length") or 0))
        if self.path.startswith("/report"):
            event = json.loads(raw or b"{}")
            with LOCK:
                EVENTS.setdefault(event.get("task"), []).append(event)
            return self._json({"ok": True})
        if self.path.startswith("/reset"):
            with LOCK:
                EVENTS.clear()
            return self._json({"ok": True})
        self.send_error(404)

    def do_GET(self):
        if self.path.startswith("/events"):
            with LOCK:
                return self._json(EVENTS)
        return super().do_GET()


def serve(ports=(8801, 8802)):
    servers = []
    for port in ports:
        server = ThreadingHTTPServer(("127.0.0.1", port), partial(Handler, directory=str(FIXTURES)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        servers.append(server)
    return servers


if __name__ == "__main__":
    serve()
    print("fixtures on http://127.0.0.1:8801 and http://localhost:8802", flush=True)
    threading.Event().wait()
