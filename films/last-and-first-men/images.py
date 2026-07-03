"""Generate scene imagery via the Pollinations image API.

The service is flaky (intermittent 500s), so every image is retried with
backoff and occasional seed jitter until it succeeds.
"""

import concurrent.futures
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

HERE = Path(__file__).parent
BUILD = HERE / "build"
IMAGES = BUILD / "images"

WIDTH, HEIGHT = 1280, 720
MAX_ATTEMPTS = 40
WORKERS = 4


def fetch(scene):
    out = IMAGES / f"{scene['id']}.jpg"
    if out.exists() and out.stat().st_size > 30000:
        return scene["id"], "cached"
    prompt, seed = scene["prompt"], scene["seed"]
    for attempt in range(MAX_ATTEMPTS):
        # keep the requested seed for reproducibility, but jitter it if the
        # same request keeps failing late in the retry budget
        s = seed if attempt < 10 else seed + attempt
        url = (
            "https://image.pollinations.ai/prompt/"
            + urllib.parse.quote(prompt)
            + f"?width={WIDTH}&height={HEIGHT}&nologo=true&seed={s}"
        )
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            data = urllib.request.urlopen(req, timeout=120).read()
            if data[:3] == b"\xff\xd8\xff" and len(data) > 30000:
                out.write_bytes(data)
                return scene["id"], f"ok ({len(data) // 1024} KB, {attempt + 1} tries)"
        except Exception as e:  # noqa: BLE001 - the API 500s at random
            print(f"    {scene['id']} attempt {attempt + 1}: "
                  f"{str(e)[:60]}", file=sys.stderr)
        time.sleep(5)
    return scene["id"], "FAILED"


def main():
    IMAGES.mkdir(parents=True, exist_ok=True)
    scenes = json.loads((BUILD / "scenes.json").read_text())
    todo = [s for s in scenes if s["kind"] == "image"]
    failed = []
    with concurrent.futures.ThreadPoolExecutor(WORKERS) as pool:
        for sid, status in pool.map(fetch, todo):
            print(f"{sid}: {status}", flush=True)
            if status == "FAILED":
                failed.append(sid)
    if failed:
        sys.exit(f"failed: {failed}")


if __name__ == "__main__":
    main()
