"""Place a voiceover take sentence-by-sentence on the CasamadoEdificio timeline and duck the music under it.

  python3 scripts/mix-voiceover.py VOICE.wav [MUSIC.wav] [OUT.wav]

The take is one continuous read of the script; it is split at its longest pauses into
len(TARGETS) phrases, each phrase starts at its scene (or right after the previous one if
it runs long). Defaults: music = public/audio/soundtrack-edificio.wav,
out = public/audio/soundtrack-edificio-voz.wav.
"""
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np

SR = 48000
ROOT = Path(__file__).resolve().parent.parent

# Phrase start times (s), mirroring src/diorama/edificioTimeline.ts (30 fps).
TARGETS = [
    0.45,   # ¿Qué le falta a tu empresa?            hook
    4.25,   # Con Casamado, todo lo que falta...      brand reveal (frame 120)
    7.6,    # Papel y librería para la oficina.       office stop
    10.8,   # Café para compartir.                    cafeteria stop
    14.0,   # Papel tissue y aseo para los baños.     restroom stop
    17.2,   # Ferretería para la bodega.              store-room stop
    20.4,   # Y tecnología para tu equipo.            IT stop
    23.9,   # Más de mil cien productos...            counter
    27.6,   # Y con despacho gratis...                delivery
    31.3,   # Pide hoy en casamado punto cl.          end card
    None,   # Somos tu mejor opción.                  follows straight on
]
GAP = 0.18


def load(path):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2).copy()


def split_phrases(v, n):
    mono = np.abs(v).mean(1)
    hop = int(0.01 * SR)
    env = np.array([mono[i:i + hop].max() for i in range(0, len(mono), hop)])
    loud = env > (env.max() * 0.04)
    # silent runs between speech -> candidate cut points, ranked by length
    runs, i = [], 0
    first, last = np.argmax(loud), len(loud) - np.argmax(loud[::-1])
    i = first
    while i < last:
        if not loud[i]:
            j = i
            while j < last and not loud[j]:
                j += 1
            runs.append((j - i, i, j))
            i = j
        else:
            i += 1
    cuts = sorted(sorted(runs, reverse=True)[: n - 1], key=lambda r: r[1])
    if len(cuts) < n - 1:
        sys.exit(f"found only {len(cuts) + 1} phrases, expected {n}")
    bounds = [first] + [c for r in cuts for c in (r[1], r[2])] + [last]
    pad = 4  # 40 ms of air around each phrase
    return [v[max(0, (a - pad) * hop):min(len(v), (b + pad) * hop)] for a, b in zip(bounds[::2], bounds[1::2])]


def main():
    voice = load(sys.argv[1])
    music = load(sys.argv[2] if len(sys.argv) > 2 else ROOT / "public/audio/soundtrack-edificio.wav")
    out = Path(sys.argv[3]) if len(sys.argv) > 3 else ROOT / "public/audio/soundtrack-edificio-voz.wav"

    phrases = split_phrases(voice, len(TARGETS))
    track = np.zeros_like(music)
    t_end = 0.0
    for k, (p, t) in enumerate(zip(phrases, TARGETS)):
        start = max(t if t is not None else 0.0, t_end + GAP)
        i = int(start * SR)
        n = min(len(p), len(track) - i)
        track[i:i + n] += p[:n]
        t_end = start + len(p) / SR
        print(f"phrase {k + 1:2d}: {start:6.2f}s -> {t_end:6.2f}s")
    if t_end > len(music) / SR:
        print("warning: voice runs past the end of the video")

    # normalise voice to -3 dBFS peak, then duck music to ~35% while it speaks
    track *= 0.71 / max(1e-6, np.abs(track).max())
    act = (np.abs(track).mean(1) > 0.01).astype(np.float32)
    k = int(0.25 * SR)
    act = np.convolve(act, np.ones(k) / k, mode="same")  # smooth attack/release
    duck = 1.0 - 0.65 * np.clip(act * 3, 0, 1)
    mix = music * duck[:, None] + track
    mix /= max(1.0, np.abs(mix).max() / 0.95)

    pcm = (mix * 32767).astype(np.int16)
    out.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(out), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    print(out)


if __name__ == "__main__":
    main()
