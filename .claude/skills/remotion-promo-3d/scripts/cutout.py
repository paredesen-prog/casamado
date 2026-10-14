"""Remove the white studio background from an e-commerce product photo -> transparent PNG.

Usage:
  python3 -I cutout.py SRC.jpg DST.png [--threshold 228] [--crop x0,y0,x1,y1] [--close N]

  --threshold  min channel value counted as "white" background. Raise it (244-250) for
               white products (paper towels, white dispensers) so the product survives.
  --crop       fractional crop applied first (0..1). Use it to cut ad banners / info
               panels that shop photos often carry ("SABOR COCO 120 g", side labels).
  --close      morphological closing radius (px) to fill holes punched into textured
               white products (e.g. 12 for embossed paper rolls).

Only background connected to the image border is removed, so white areas inside the
product are kept. Output is cropped to the product's bounding box.
"""
import argparse

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ap = argparse.ArgumentParser()
ap.add_argument("src")
ap.add_argument("dst")
ap.add_argument("--threshold", type=int, default=228)
ap.add_argument("--crop", type=str, default=None)
ap.add_argument("--close", type=int, default=0)
args = ap.parse_args()

im = Image.open(args.src).convert("RGB")
if args.crop:
    x0, y0, x1, y1 = [float(v) for v in args.crop.split(",")]
    w, h = im.size
    im = im.crop((int(x0 * w), int(y0 * h), int(x1 * w), int(y1 * h)))

a = np.asarray(im).astype(np.int16)
mx, mn = a.max(2), a.min(2)
white = (mn > args.threshold) & ((mx - mn) < 22)
lab, _ = ndimage.label(white)
border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]]))) - {0}
bg = ndimage.binary_opening(np.isin(lab, list(border)), iterations=1)
fg = ~bg
if args.close:
    c = args.close
    fg = ndimage.binary_closing(np.pad(fg, c), iterations=c)[c:-c, c:-c]
fg = ndimage.binary_fill_holes(fg)

lab2, n2 = ndimage.label(fg)
if n2:
    sizes = ndimage.sum(fg, lab2, range(1, n2 + 1))
    fg = np.isin(lab2, [i + 1 for i, s in enumerate(sizes) if s >= 0.01 * fg.sum()])

alpha = Image.fromarray((fg * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
out = im.convert("RGBA")
out.putalpha(alpha)
out = out.crop(out.getbbox())
out.save(args.dst)
print(args.dst, im.size, "->", out.size, f"{fg.mean():.0%} foreground")
