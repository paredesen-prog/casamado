"""Tile PNG stills (or frames pulled from an MP4) into one contact sheet for visual review.

  python3 -I contact-sheet.py OUT.png img1.png img2.png ... [--cols 3] [--size 360]
  python3 -I contact-sheet.py OUT.png --video out/video.mp4 --times 2.5,9.8,13,18.2 [--cols 4]

The second form uses ffmpeg to grab frames from the rendered file, which is the real
check: a still that looks right can still differ in the sequential render.
"""
import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image

ap = argparse.ArgumentParser()
ap.add_argument("out")
ap.add_argument("images", nargs="*")
ap.add_argument("--video")
ap.add_argument("--times")
ap.add_argument("--cols", type=int, default=3)
ap.add_argument("--size", type=int, default=360)
a = ap.parse_args()

paths = list(a.images)
if a.video:
    tmp = Path(tempfile.mkdtemp())
    for t in a.times.split(","):
        p = tmp / f"t{float(t):07.2f}.png"
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", t, "-i", a.video, "-frames:v", "1", str(p)], check=True)
        paths.append(str(p))

S, cols = a.size, a.cols
rows = (len(paths) + cols - 1) // cols
sheet = Image.new("RGB", (S * cols, S * rows), (30, 30, 30))
for i, p in enumerate(paths):
    im = Image.open(p).convert("RGB")
    im.thumbnail((S, S))
    sheet.paste(im, ((i % cols) * S, (i // cols) * S))
sheet.save(a.out)
print(a.out, f"{len(paths)} tiles")
