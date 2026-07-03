"""Scene script for Part 1 of the Last and First Men film.

The film opens with the author's Preface (three key paragraphs, read in the
"author" voice) and then presents the complete "Introduction by One of the
Last Men" (read in the "Last Man" voice), ending at the natural break before
Chapter I.  All narration is verbatim Stapledon (1930, public domain).

Each scene: narration text (or None for music-only cards), a visual, and a
camera move.  Visuals are either generated images (prompt) or rendered title
cards (card lines).
"""

import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).parent

STYLE = (
    ", 1930s golden-age science fiction book illustration, painterly gouache "
    "matte painting, muted deep indigo and amber palette, soft film grain, "
    "cinematic composition, vast scale, awe and melancholy, no text"
)

AUTHOR = {"voice": "en-GB-ThomasNeural", "rate": "-6%", "pitch": "+0Hz"}
LAST_MAN = {"voice": "en-GB-RyanNeural", "rate": "-10%", "pitch": "-4Hz"}


def paragraphs(name):
    text = (HERE / "text" / name).read_text()
    paras = [re.sub(r"\s+", " ", p).strip() for p in text.split("\n\n")]
    # drop signatures/dates (short) and all-caps section headings
    return [p for p in paras if p and len(p.split()) > 3 and p.upper() != p]


def build():
    pre = paragraphs("preface.txt")   # pre[0] = "This is a work of fiction..."
    intro = paragraphs("intro.txt")   # intro[0] = "This book has two authors..."

    # The final intro paragraph splits naturally where the aeroplane begins
    # its descent toward the reader's own age.
    split_at = "And as the plane's journey must begin"
    p12a, p12b = intro[10].split(split_at)
    p12b = split_at + p12b

    scenes = [
        dict(
            id="title", kind="card", move="in",
            card=["LAST AND FIRST MEN", "", "A Story of the Near and Far Future",
                  "", "W. OLAF STAPLEDON", "", "· 1930 ·"],
            text="Last and First Men. A story of the near and far future. "
                 "By William Olaf Stapledon. First published in nineteen thirty.",
            **LAST_MAN,
        ),
        dict(
            id="card_preface", kind="card", move="in", hold=4.5,
            card=["PREFACE"], text=None,
        ),
        dict(
            id="preface_1", kind="image", move="in", text=pre[0], **AUTHOR,
            prompt="a writer's study at night in 1930, a man at a wooden desk "
                   "under warm lamplight with a manuscript, a tall window open "
                   "to a deep starry sky" + STYLE, seed=101,
        ),
        dict(
            id="preface_2", kind="image", move="panlr", text=pre[1], **AUTHOR,
            prompt="a lone astronomer inside a great observatory dome, "
                   "telescope aimed through the opening at a luminous field of "
                   "stars, charts and books scattered below" + STYLE, seed=102,
        ),
        dict(
            id="preface_3", kind="image", move="out",
            text=pre[10] + " West Kirby. July, nineteen thirty.", **AUTHOR,
            prompt="close view of a handwritten manuscript page and a fountain "
                   "pen on a desk, candlelight, a window beyond showing the "
                   "night sky and one bright star" + STYLE, seed=103,
        ),
        dict(
            id="card_intro", kind="card", move="in", hold=5.0,
            card=["INTRODUCTION", "", "BY ONE OF THE LAST MEN"], text=None,
        ),
        dict(
            id="intro_1", kind="image", move="in", text=intro[0], **LAST_MAN,
            prompt="a man in 1930s clothes writing at a desk in a small dark "
                   "room, above and behind him an immense translucent cosmic "
                   "figure of light spanning the sky, two beings joined by a "
                   "thread of light" + STYLE, seed=201,
        ),
        dict(
            id="intro_2", kind="image", move="in", text=intro[1], **LAST_MAN,
            prompt="a human head in silhouette in profile, filaments of "
                   "starlight descending from a spiral galaxy into the mind, "
                   "dark background, visionary" + STYLE, seed=202,
        ),
        dict(
            id="intro_3", kind="image", move="panlr", text=intro[2], **LAST_MAN,
            prompt="a great spiral of dissolving clock faces and calendar "
                   "pages unwinding into a galaxy of stars, surreal, deep "
                   "indigo void" + STYLE, seed=203,
        ),
        dict(
            id="intro_4", kind="image", move="panlr", text=intro[3], **LAST_MAN,
            prompt="an immense landscape divided by light, on one side a "
                   "golden shining city in sunlight, on the other side the "
                   "same city ruined under a black storm, epic" + STYLE, seed=204,
        ),
        dict(
            id="intro_5", kind="image", move="out", text=intro[4], **LAST_MAN,
            prompt="a vast slow river winding across an endless twilight "
                   "plain beneath the full arch of the Milky Way, a tiny "
                   "human figure on the bank" + STYLE, seed=205,
        ),
        dict(
            id="intro_6", kind="image", move="panud", text=intro[5], **LAST_MAN,
            prompt="ranges of mountains receding plain beyond plain into "
                   "violet haze at dusk, above them a black sky pricked with "
                   "thousands of stars" + STYLE, seed=206,
        ),
        dict(
            id="intro_7", kind="image", move="out", text=intro[6], **LAST_MAN,
            prompt="a tiny glowing city on the dark rim of the Earth seen "
                   "from high above, beyond it an enormous nebula filling "
                   "the heavens, overwhelming scale" + STYLE, seed=207,
        ),
        dict(
            id="intro_8", kind="image", move="in", text=intro[7], **LAST_MAN,
            prompt="the young primordial Earth seen from space, volcanic "
                   "continents and dark oceans on the night side, the dawn "
                   "line burning on the horizon of the globe" + STYLE, seed=208,
        ),
        dict(
            id="intro_9", kind="image", move="panud", text=intro[8], **LAST_MAN,
            prompt="a lone climber on green foothills looking up, above the "
                   "clouds rise impossible colossal snow peaks and precipices "
                   "ascending into a field of stars" + STYLE, seed=209,
        ),
        dict(
            id="intro_10", kind="image", move="panlr", text=intro[9], **LAST_MAN,
            prompt="strange luminous abstract forms of many shapes drifting "
                   "in a dark void, each glowing differently like minds of "
                   "unknown kinds, mysterious, beautiful" + STYLE, seed=210,
        ),
        dict(
            id="intro_12a", kind="image", move="panlr", text=p12a, **LAST_MAN,
            prompt="a small 1930s silver monoplane flying very high above an "
                   "immense continent of rivers and plains at dawn, seen from "
                   "above the aircraft, the curve of the earth far below" + STYLE,
            seed=212,
        ),
        dict(
            id="intro_12b", kind="image", move="in", text=p12b, **LAST_MAN,
            prompt="aerial view descending toward the rooftops and smoking "
                   "chimneys of a great 1930s city at evening, a dark storm "
                   "front gathering on the horizon" + STYLE, seed=213,
        ),
        dict(
            id="end_card", kind="card", move="out", hold=11.0,
            card=["HERE ENDS THE INTRODUCTION", "",
                  "THE CHRONICLE BEGINS WITH", "",
                  "CHAPTER I · BALKAN EUROPE"], text=None,
        ),
    ]
    return scenes


if __name__ == "__main__":
    out = HERE / "build" / "scenes.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(build(), indent=2))
    total_words = sum(len((s["text"] or "").split()) for s in build())
    print(f"{len(build())} scenes, {total_words} narrated words "
          f"(~{total_words/140:.1f} min of narration)", file=sys.stderr)
