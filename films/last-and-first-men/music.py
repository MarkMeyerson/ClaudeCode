"""Synthesize the ambient underscore: a slowly evolving minor-mode drone.

Pure numpy — detuned sine partials over a deep pedal tone, with a faint
low-passed noise wash, drifting through a four-chord cycle. Written as a
stereo WAV sized to the film's runtime.
"""

import sys
import wave
from pathlib import Path

import numpy as np

SR = 44100
HERE = Path(__file__).parent
BUILD = HERE / "build"

# A-minor-ish cycle, low register (Hz): Am, F, C, Em
CHORDS = [
    [110.00, 130.81, 164.81, 220.00],
    [87.31, 110.00, 130.81, 174.61],
    [98.00, 130.81, 164.81, 196.00],
    [82.41, 123.47, 164.81, 196.00],
]
CHORD_SECONDS = 45.0
XFADE_SECONDS = 10.0

rng = np.random.default_rng(1930)


def partial(freq, n, phase_seed):
    t = np.arange(n) / SR
    voice = np.zeros(n)
    for mult, amp in ((1.0, 1.0), (2.0, 0.28), (3.0, 0.10)):
        detune = 1 + rng.normal(0, 0.0012)
        lfo = 0.75 + 0.25 * np.sin(2 * np.pi * rng.uniform(0.03, 0.09) * t
                                   + phase_seed * mult)
        voice += amp * lfo * np.sin(2 * np.pi * freq * mult * detune * t
                                    + phase_seed)
    return voice


def chord_pad(freqs, n):
    pad = np.zeros(n)
    for f in freqs:
        pad += partial(f, n, rng.uniform(0, 2 * np.pi))
    return pad / len(freqs)


def render(total_seconds):
    n = int(total_seconds * SR)
    left = np.zeros(n)
    right = np.zeros(n)
    step = int(CHORD_SECONDS * SR)
    fade = int(XFADE_SECONDS * SR)
    ramp = np.linspace(0, 1, fade)

    pos = 0
    idx = 0
    while pos < n:
        seg_len = min(step + fade, n - pos)
        chord = CHORDS[idx % len(CHORDS)]
        for chan in (left, right):
            seg = chord_pad(chord, seg_len)
            env = np.ones(seg_len)
            head = min(fade, seg_len)
            env[:head] = ramp[:head]
            tail = min(fade, seg_len)
            env[seg_len - tail:] = ramp[:tail][::-1]
            chan[pos:pos + seg_len] += seg * env
        pos += step
        idx += 1

    t = np.arange(n) / SR
    pedal = 0.35 * np.sin(2 * np.pi * 55.0 * t) * \
        (0.7 + 0.3 * np.sin(2 * np.pi * 0.017 * t))
    left += pedal
    right += pedal

    # faint wind: heavily smoothed noise
    for chan in (left, right):
        noise = rng.normal(0, 1, n)
        kernel = np.ones(2400) / 2400
        noise = np.convolve(noise, kernel, mode="same")
        chan += 0.9 * noise

    stereo = np.stack([left, right], axis=1)
    # global fade in/out
    edge = int(4 * SR)
    env = np.ones(n)
    env[:edge] = np.linspace(0, 1, edge)
    env[-edge:] = np.linspace(1, 0, edge)
    stereo *= env[:, None]
    stereo /= np.abs(stereo).max() + 1e-9
    return (stereo * 0.85 * 32767).astype(np.int16)


def main():
    total = float(sys.argv[1]) if len(sys.argv) > 1 else 780.0
    data = render(total)
    out = BUILD / "music.wav"
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())
    print(f"music: {total:.1f}s -> {out}")


if __name__ == "__main__":
    main()
