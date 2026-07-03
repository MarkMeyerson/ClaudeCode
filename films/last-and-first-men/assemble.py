"""Assemble the film: title cards, Ken Burns camera moves, crossfades,
narration placement, and the music bed — all driven by ffmpeg.
"""

import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

HERE = Path(__file__).parent
BUILD = HERE / "build"
SEGS = BUILD / "segments"
CARDS = BUILD / "cards"

FPS = 24
W, H = 1920, 1080
FADE = 1.0          # crossfade seconds between scenes
LEAD = 0.8          # silence before narration starts in a scene
TAIL = 1.6          # linger after narration ends
MIN_SCENE = 6.0
MUSIC_VOL = 0.26

SERIF_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
SERIF = "/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf"


def run(cmd, **kw):
    print(" ".join(str(c) for c in cmd)[:220], file=sys.stderr)
    subprocess.run([str(c) for c in cmd], check=True, **kw)


def render_card(scene):
    """Dark starfield title card with letterspaced serif text."""
    import random
    rnd = random.Random(scene["id"])
    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        # subtle vertical indigo gradient
        v = 14 + int(10 * (1 - abs(y - H / 2) / (H / 2)))
        for x in range(W):
            px[x, y] = (v - 4, v - 2, v + 8)
    draw = ImageDraw.Draw(img)
    for _ in range(420):
        x, y = rnd.randrange(W), rnd.randrange(H)
        b = rnd.randint(40, 150)
        draw.point((x, y), fill=(b, b, min(255, b + 20)))
        if b > 120:
            draw.point((x + 1, y), fill=(b // 2,) * 3)

    lines = scene["card"]
    big = scene["id"] == "title"
    sizes = []
    for i, line in enumerate(lines):
        if not line:
            sizes.append((None, 30))
            continue
        main = i == 0 and big
        font = ImageFont.truetype(SERIF_BOLD if main else SERIF,
                                  96 if main else 44)
        spaced = (" ".join(line) if main else
                  " ".join(line) if len(line) < 40 else line)
        sizes.append(((spaced, font), 130 if main else 64))
    total_h = sum(h for _, h in sizes)
    y = (H - total_h) / 2
    for entry, h in sizes:
        if entry:
            spaced, font = entry
            tw = draw.textlength(spaced, font=font)
            draw.text(((W - tw) / 2, y), spaced,
                      font=font, fill=(226, 220, 202))
        y += h
    out = CARDS / f"{scene['id']}.png"
    img.save(out)
    return out


ZOOMS = {
    "in": "z='1+0.10*on/{D}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'",
    "out": "z='1.10-0.10*on/{D}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2'",
    "panlr": "z='1.07':x='(iw-iw/zoom)*on/{D}':y='(ih-ih/zoom)/2'",
    "panud": "z='1.07':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)*on/{D}'",
}


def make_segment(scene, dur, src):
    out = SEGS / f"{scene['id']}.mp4"
    if out.exists():
        return out
    frames = max(2, round(dur * FPS))
    move = ZOOMS[scene["move"]].format(D=frames - 1)
    # gentler drift for text cards so they stay readable
    if scene["kind"] == "card":
        move = move.replace("0.10", "0.04").replace("1.07", "1.03")
    vf = (f"scale=3840:2160:flags=lanczos,"
          f"zoompan={move}:d={frames}:s={W}x{H}:fps={FPS},"
          f"format=yuv420p")
    run(["ffmpeg", "-y", "-loglevel", "error", "-i", src,
         "-vf", vf, "-frames:v", frames, "-r", FPS,
         "-c:v", "libx264", "-preset", "veryfast", "-crf", "19", out])
    return out


def main():
    scenes = json.loads((BUILD / "scenes.json").read_text())
    narr = json.loads((BUILD / "narration_durations.json").read_text())
    SEGS.mkdir(exist_ok=True)
    CARDS.mkdir(exist_ok=True)

    # -- timing ----------------------------------------------------------
    durs = []
    for s in scenes:
        if s["text"]:
            d = max(MIN_SCENE, LEAD + narr[s["id"]] + TAIL)
            if s["kind"] == "card":
                d += 1.5
        else:
            d = s["hold"]
        durs.append(d)
    starts = []
    t = 0.0
    for i, d in enumerate(durs):
        starts.append(t)
        t += d - FADE
    total = t + FADE
    print(f"runtime: {total/60:.2f} min over {len(scenes)} scenes")
    (BUILD / "timing.json").write_text(json.dumps(
        {s["id"]: {"start": st, "dur": d}
         for s, st, d in zip(scenes, starts, durs)}, indent=2))

    if not (BUILD / "music.wav").exists():
        run([sys.executable, HERE / "music.py", f"{total:.2f}"])

    # -- video segments ---------------------------------------------------
    seg_files = []
    for s, d in zip(scenes, durs):
        src = render_card(s) if s["kind"] == "card" \
            else BUILD / "images" / f"{s['id']}.jpg"
        seg_files.append(make_segment(s, d, src))

    # -- final mux: xfade chain + narration placement + music bed ---------
    cmd = ["ffmpeg", "-y", "-loglevel", "warning"]
    for f in seg_files:
        cmd += ["-i", f]
    narrated = [s for s in scenes if s["text"]]
    for s in narrated:
        cmd += ["-i", BUILD / "audio" / f"{s['id']}.mp3"]
    cmd += ["-i", BUILD / "music.wav"]

    n = len(seg_files)
    fc = []
    prev = "[0:v]"
    offset = 0.0
    for i in range(1, n):
        offset += durs[i - 1] - FADE
        label = f"[vx{i}]" if i < n - 1 else "[vout]"
        fc.append(f"{prev}[{i}:v]xfade=transition=fade:"
                  f"duration={FADE}:offset={offset:.3f}{label}")
        prev = label

    mixins = []
    for j, s in enumerate(narrated):
        at = int((starts[scenes.index(s)] + LEAD) * 1000)
        fc.append(f"[{n + j}:a]adelay={at}|{at}[na{j}]")
        mixins.append(f"[na{j}]")
    fc.append(f"[{n + len(narrated)}:a]volume={MUSIC_VOL}[mus]")
    mixins.append("[mus]")
    fc.append("".join(mixins) +
              f"amix=inputs={len(mixins)}:normalize=0:dropout_transition=0,"
              "loudnorm=I=-16:TP=-1.5:LRA=13[aout]")

    out = BUILD / "last_and_first_men_part1.mp4"
    run(cmd + ["-filter_complex", ";".join(fc),
               "-map", "[vout]", "-map", "[aout]",
               "-t", f"{total:.3f}",
               "-c:v", "libx264", "-preset", "medium", "-crf", "20",
               "-c:a", "aac", "-b:a", "192k",
               "-movflags", "+faststart", out])
    print(f"done: {out}")


if __name__ == "__main__":
    main()
