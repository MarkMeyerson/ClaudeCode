# Last and First Men — Part 1 (Film Pipeline)

A ~12-minute film of the opening of Olaf Stapledon's *Last and First Men*
(1930, public domain): three key paragraphs of the author's Preface, followed
by the complete **Introduction by One of the Last Men**, ending at the natural
break before Chapter I ("Balkan Europe"). All narration is verbatim Stapledon.

## How it's made

| Stage | Tool | Notes |
|---|---|---|
| Text | Project Gutenberg Australia | extracted to `text/` |
| Script | `scenes.py` | 20 scenes: exact narration + image prompt + camera move per scene |
| Narration | `tts.py` — Microsoft Edge neural TTS (`edge-tts`) | two voices: an "author" voice (Thomas) for the Preface, a deeper "Last Man" voice (Ryan, −4Hz) for the Introduction |
| Imagery | `images.py` — Pollinations image API | 14 painted-matte-style stills, 1280×720, retried through the API's intermittent 500s |
| Underscore | `music.py` — numpy synthesis | slowly evolving minor-mode drone: detuned sine partials, 55 Hz pedal, filtered noise wash |
| Assembly | `assemble.py` — ffmpeg + Pillow | starfield title cards, Ken Burns zoom/pan (via 4K upscale + `zoompan`), 1s crossfades, narration placed on the timeline per scene, music bed, loudness-normalized mix |

The original request was ElevenLabs + Hugging Face; neither API key is
available in this environment, so the pipeline substitutes the free Edge
neural TTS endpoint and the Pollinations image API (both verified reachable
through the sandbox egress proxy).

## Reproduce

```sh
pip install edge-tts pillow numpy   # plus ffmpeg on the system
python3 scenes.py                   # build/scenes.json
python3 tts.py                      # build/audio/*.mp3 + durations
python3 images.py                   # build/images/*.jpg
python3 assemble.py                 # build/last_and_first_men_part1.mp4
```

`build/` is generated output and is gitignored.

## Continuing the film

Part 2 would begin at `THE CHRONICLE — Chapter I: Balkan Europe`
(offset recorded in `text/`; see `scenes.py` for the segmentation pattern).
