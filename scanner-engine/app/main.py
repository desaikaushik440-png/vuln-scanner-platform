from fastapi import FastAPI
from pydantic import BaseModel
import subprocess
import re

app = FastAPI(
    title="Vulnerability Scanner Engine",
    version="1.0.0"
)


class ScanRequest(BaseModel):
    target: str


@app.get("/")
def root():
    return {
        "message": "Scanner Engine Running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


@app.post("/scan")
def run_scan(data: ScanRequest):

    target = data.target

    try:

        # RUN NMAP
        result = subprocess.check_output(
            ["nmap", "-F", target],
            text=True
        )

        ports = []

        lines = result.splitlines()

        for line in lines:

            # MATCH:
            # 22/tcp open ssh
            match = re.search(
                r"(\d+)\/tcp\s+(\w+)\s+(.+)",
                line
            )

            if match:
                ports.append({
                    "port": int(match.group(1)),
                    "state": match.group(2),
                    "service": match.group(3)
                })

        return {
            "success": True,
            "target": target,
            "ports": ports,
            "raw_output": result
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }