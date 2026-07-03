"""Fallback image generator: SD-Turbo on CPU via Hugging Face.

Used when the Pollinations API is down. Generates at 768x432 in a few
denoising steps and lanczos-upscales; the painterly style target is
forgiving of the lower native resolution.

Usage: python3 images_local.py [scene_id ...]   (default: all missing)
"""

import json
import sys
from pathlib import Path

import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image

HERE = Path(__file__).parent
BUILD = HERE / "build"
IMAGES = BUILD / "images"


def main():
    IMAGES.mkdir(parents=True, exist_ok=True)
    scenes = json.loads((BUILD / "scenes.json").read_text())
    wanted = set(sys.argv[1:])
    todo = [
        s for s in scenes if s["kind"] == "image"
        and (s["id"] in wanted if wanted else
             not (IMAGES / f"{s['id']}.jpg").exists())
    ]
    if not todo:
        print("nothing to do")
        return

    pipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sd-turbo", torch_dtype=torch.float32)
    pipe.to("cpu")

    for i, scene in enumerate(todo):
        g = torch.Generator().manual_seed(scene["seed"])
        img = pipe(
            prompt=scene["prompt"][:300],
            num_inference_steps=4, guidance_scale=0.0,
            width=768, height=432, generator=g,
        ).images[0]
        img = img.resize((1280, 720), Image.LANCZOS)
        out = IMAGES / f"{scene['id']}.jpg"
        img.save(out, quality=92)
        print(f"[{i + 1}/{len(todo)}] {scene['id']}: ok (local)", flush=True)


if __name__ == "__main__":
    main()
