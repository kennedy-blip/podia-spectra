"""
PODIA-SPECTRA — Vercel Python 3.12 Serverless Biomechanics Solver
"""
from http.server import BaseHTTPRequestHandler
import json
from python_biomechanics.spring_mass_tibial_shock import solve_spring_mass_model
from python_biomechanics.plantar_knee_kinetics import (
    solve_windlass_and_arch,
    solve_patellofemoral_kinetics,
)


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_len = int(self.headers.get("Content-Length", 0))
        raw_body = self.rfile.read(content_len) if content_len > 0 else b"{}"
        try:
            payload = json.loads(raw_body.decode("utf-8"))
        except Exception:
            payload = {}

        mode = payload.get("mode", "spring_mass")
        if mode == "windlass":
            result = solve_windlass_and_arch(**payload.get("params", {}))
        elif mode == "patellofemoral":
            result = solve_patellofemoral_kinetics(**payload.get("params", {}))
        else:
            result = solve_spring_mass_model(**payload.get("params", {}))

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps({"status": "ok", "engine": "python3.12", "result": result}).encode("utf-8"))
