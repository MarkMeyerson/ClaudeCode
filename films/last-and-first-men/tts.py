"""Generate narration audio for every scene with Microsoft Edge neural TTS."""

import asyncio
import json
import os
import subprocess
import sys
from pathlib import Path

import edge_tts

HERE = Path(__file__).parent
BUILD = HERE / "build"
AUDIO = BUILD / "audio"


async def synth(scene):
    out = AUDIO / f"{scene['id']}.mp3"
    if out.exists() and out.stat().st_size > 1000:
        return
    for attempt in range(5):
        try:
            tts = edge_tts.Communicate(
                scene["text"], scene["voice"],
                rate=scene["rate"], pitch=scene["pitch"],
                proxy=os.environ.get("HTTPS_PROXY"),
            )
            await tts.save(str(out))
            if out.stat().st_size > 1000:
                return
        except Exception as e:  # noqa: BLE001 - retry any transport error
            print(f"  {scene['id']} attempt {attempt}: {e}", file=sys.stderr)
            await asyncio.sleep(3 * (attempt + 1))
    raise RuntimeError(f"TTS failed for {scene['id']}")


def duration(path):
    return float(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)]).strip())


async def main():
    AUDIO.mkdir(parents=True, exist_ok=True)
    scenes = json.loads((BUILD / "scenes.json").read_text())
    durs = {}
    for scene in scenes:
        if not scene["text"]:
            continue
        await synth(scene)
        durs[scene["id"]] = duration(AUDIO / f"{scene['id']}.mp3")
        print(f"{scene['id']}: {durs[scene['id']]:.2f}s")
    (BUILD / "narration_durations.json").write_text(json.dumps(durs, indent=2))
    print(f"total narration: {sum(durs.values())/60:.2f} min")


if __name__ == "__main__":
    asyncio.run(main())
