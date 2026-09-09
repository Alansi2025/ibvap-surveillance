#!/usr/bin/env python3
"""
Entry point to launch the IBVAP Tactical Backend.
"""

import sys
import uvicorn

if __name__ == "__main__":
    port = 8000
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    print(f"[*] Launching IBVAP AI Video Analytics Server on http://0.0.0.0:{port}")
    uvicorn.run("server:app", host="0.0.0.0", port=port, reload=False)
