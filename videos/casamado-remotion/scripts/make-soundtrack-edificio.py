"""Original music bed + SFX for CasamadoEdificio (square + vertical), frame-aligned at 30 fps.

Run: python3 scripts/make-soundtrack-edificio.py  ->  public/audio/soundtrack-edificio.wav
Timings mirror src/diorama/edificioTimeline.ts.
"""
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, lfilter

SR = 48000
FPS = 30
TOTAL_FRAMES = 1050
N = int(TOTAL_FRAMES / FPS * SR) + SR
rng = np.random.default_rng(7)

L = np.zeros(N)
R = np.zeros(N)


def sec(frame):
    return frame / FPS


def add(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    L[i:i + len(sig)] += sig * gain * (1 - max(0, pan))
    R[i:i + len(sig)] += sig * gain * (1 + min(0, pan))


def env_exp(n, tau):
    return np.exp(-np.arange(n) / (tau * SR))


def lowpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "low")
    return lfilter(b, a, x)


def highpass(x, fc, order=2):
    b, a = butter(order, fc / (SR / 2), "high")
    return lfilter(b, a, x)


def bandpass(x, lo, hi, order=2):
    b, a = butter(order, [lo / (SR / 2), hi / (SR / 2)], "band")
    return lfilter(b, a, x)


def note(m):
    return 440.0 * 2 ** ((m - 69) / 12)


# ---------------- music ----------------
BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT
T0 = sec(120)           # downbeat lands on the brand reveal
END_GROOVE = sec(930)   # drums stop on the end card
CHORDS = [  # Fmaj9, Am7, Dm9, Bbmaj7(add9)
    [53, 57, 60, 64, 67],
    [57, 60, 64, 67, 71],
    [50, 57, 60, 64, 65],
    [46, 53, 57, 60, 62],
]
ROOTS = [41, 45, 38, 46]
TOTAL_S = TOTAL_FRAMES / FPS


def chord_at(t):
    return int(np.floor((t - T0) / BAR)) % 4


def pad_tone(freq, dur):
    t = np.arange(int(dur * SR)) / SR
    s = np.zeros_like(t)
    for det in (-0.12, 0.0, 0.13):
        f = freq * 2 ** (det / 12)
        for h in range(1, 7):
            s += np.sin(2 * np.pi * f * h * t + h) / (h ** 1.6)
    return s / 3


# Pad: one chord per bar, long crossfading envelopes
bar_start = T0 - 2 * BAR
while bar_start < TOTAL_S:
    ci = chord_at(bar_start + 0.01)
    dur = BAR + 0.6
    n = int(dur * SR)
    a = np.minimum(1, np.arange(n) / (0.5 * SR))
    r = np.minimum(1, (n - np.arange(n)) / (0.6 * SR))
    tone = sum(pad_tone(note(m), dur) for m in CHORDS[ci]) * a * r
    cutoff = 900 if bar_start < T0 else 2600
    tone = lowpass(tone, cutoff)
    add(tone, max(0, bar_start), 0.05, pan=-0.15)
    add(tone, max(0, bar_start) + 0.012, 0.05, pan=0.15)
    bar_start += BAR

# Final resolve chord on the end card
dur = 4.5
n = int(dur * SR)
tone = sum(pad_tone(note(m), dur) for m in CHORDS[0] + [72]) * np.minimum(1, np.arange(n) / (0.3 * SR)) * env_exp(n, 1.8)
add(lowpass(tone, 3200), END_GROOVE, 0.06)


def kick():
    n = int(0.42 * SR)
    t = np.arange(n) / SR
    f = 45 + 85 * np.exp(-t / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * env_exp(n, 0.12)


def hat(open_=False):
    n = int((0.12 if open_ else 0.04) * SR)
    return highpass(rng.standard_normal(n), 7000) * env_exp(n, 0.03 if open_ else 0.012)


def clap():
    n = int(0.22 * SR)
    s = bandpass(rng.standard_normal(n), 900, 2600) * env_exp(n, 0.06)
    for k in (0.0, 0.012, 0.024):
        i = int(k * SR)
        s[i:i + 200] *= 1.6
    return s


def bass(freq, dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(4 * np.pi * freq * t)
    return lowpass(s, 600) * np.minimum(1, np.arange(n) / 300) * env_exp(n, dur * 0.7)


def pluck(freq):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * freq * t) + 0.3 * np.sin(4 * np.pi * freq * t)) * env_exp(n, 0.09)


duck = np.ones(N)
b = 0
while T0 + b * BEAT < END_GROOVE - 0.01:
    t = T0 + b * BEAT
    ci = chord_at(t + 0.001)
    add(kick(), t, 0.55)
    i = int(t * SR)
    k = np.minimum(1, 0.45 + 0.55 * (np.arange(int(0.3 * SR)) / (0.3 * SR)))
    duck[i:i + len(k)] = np.minimum(duck[i:i + len(k)], k)
    add(hat(), t + BEAT / 2, 0.10, pan=0.3)
    if b % 4 in (1, 3):
        add(clap(), t, 0.16, pan=-0.1)
    if b % 8 == 7:
        add(hat(True), t + BEAT * 0.75, 0.07, pan=0.3)
    for e in range(2):
        add(bass(note(ROOTS[ci]) * (2 if e == 1 and b % 2 == 1 else 1), BEAT / 2), t + e * BEAT / 2, 0.22)
    if t >= sec(210) - 0.01:
        tones = CHORDS[ci][1:]
        for s16 in range(4):
            m = tones[(b * 4 + s16) % len(tones)] + 12
            add(pluck(note(m)), t + s16 * BEAT / 4, 0.035, pan=0.35 if s16 % 2 else -0.35)
    b += 1

L *= duck
R *= duck

# ---------------- sfx ----------------


def whoosh(dur=0.55, lo=300, hi=5000):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    steps = 12
    for k in range(steps):
        a, z = k * n // steps, (k + 1) * n // steps
        fc = lo + (hi - lo) * np.sin(np.pi * (k + 0.5) / steps)
        out[a:z] = lowpass(x[a:z], fc, 1)
    e = np.sin(np.pi * np.arange(n) / n) ** 2
    return out * e


def riser(dur):
    n = int(dur * SR)
    x = rng.standard_normal(n)
    out = np.zeros(n)
    steps = 24
    for k in range(steps):
        a, z = k * n // steps, (k + 1) * n // steps
        out[a:z] = lowpass(x[a:z], 200 + 5000 * (k / steps) ** 2, 1)
    return out * (np.arange(n) / n) ** 2


def thud():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    f = 55 + 60 * np.exp(-t / 0.02)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.07)
    click = highpass(rng.standard_normal(n), 2000) * env_exp(n, 0.004) * 0.4
    return s + click


def pop(f0=700, f1=1300):
    n = int(0.08 * SR)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * t / t[-1]
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.022)


def tick():
    n = int(0.02 * SR)
    t = np.arange(n) / SR
    return np.sin(2 * np.pi * 2400 * t) * env_exp(n, 0.004)


def chime(base=note(84), dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    s = sum(a * np.sin(2 * np.pi * base * r * t) * env_exp(n, dur * d) for r, a, d in [(1, 1, 0.5), (2.76, 0.4, 0.25), (5.4, 0.18, 0.12), (2, 0.3, 0.35)])
    return s * np.minimum(1, np.arange(n) / 100)


def boom():
    n = int(1.6 * SR)
    t = np.arange(n) / SR
    f = 38 + 50 * np.exp(-t / 0.06)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env_exp(n, 0.45)


def rumble(dur):
    n = int(dur * SR)
    t = np.arange(n) / SR
    eng = np.sign(np.sin(2 * np.pi * (34 + 6 * np.sin(2 * np.pi * 0.7 * t)) * t)) * 0.4
    s = lowpass(eng + 0.6 * rng.standard_normal(n), 220)
    return s * np.minimum(1, np.arange(n) / (0.4 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.8 * SR))


# hook: pain tags, riser into the brand reveal
for i, f in enumerate((48, 58, 68)):
    add(pop(600, 1000), sec(f), 0.28, pan=(-0.3, 0.3, 0)[i])
add(riser(sec(120) - sec(40)), sec(40), 0.18)
add(boom(), sec(120), 0.6)
add(chime(note(88), 2.0), sec(130), 0.18)

# tour: 5 rooms, products land 6 frames after each drop starts
TOUR, STOP = 210, 96
ITEMS = [5, 2, 4, 12, 2]
CHIPS = [1, 1, 1, 2, 1]
for k in range(5):
    s0 = TOUR + k * STOP
    add(whoosh(0.7, 250, 4200), sec(s0 - 2), 0.26, pan=(-0.25 if k % 2 else 0.25))
    for d in range(ITEMS[k]):
        add(thud(), sec(s0 + 24 + d * 5 + 6), 0.42 if d < 6 else 0.3, pan=(-0.15 if d % 2 else 0.15))
    for c in range(CHIPS[k]):
        add(pop(900, 1500), sec(s0 + 40 + c * 10), 0.22)

# overview: last rooms fill, counter
add(whoosh(1.1, 200, 3000), sec(690), 0.25)
for start, n in ((702, 2), (712, 3), (722, 2)):
    for d in range(n):
        add(thud(), sec(start + d * 5 + 6), 0.32, pan=(-0.2 if d % 2 else 0.2))
count_start, count_len = 730, 44
for k in range(26):
    u = k / 25
    fr = count_start + count_len * (1 - (1 - u) ** 3)
    add(tick(), sec(fr), 0.16)
add(chime(note(86), 1.8), sec(count_start + count_len), 0.22)

# delivery: van rolls in, arrival chime, chips
add(whoosh(0.9, 300, 6000), sec(806), 0.24)
add(rumble(sec(870) - sec(812)), sec(812), 0.35)
add(chime(note(91), 1.4), sec(870), 0.16)
for i in range(3):
    add(pop(700, 1200), sec(880 + i * 7), 0.2, pan=(-0.3, 0, 0.3)[i])

# end card
add(whoosh(0.8, 300, 5000), sec(926), 0.2)
add(chime(note(84), 2.6), sec(938), 0.22)
add(chime(note(91), 2.4), sec(938 + 0.09 * FPS), 0.12)

# ---------------- master ----------------
end = int(TOTAL_FRAMES / FPS * SR)
L, R = L[:end], R[:end]
fade = int(0.8 * SR)
L[-fade:] *= np.linspace(1, 0, fade)
R[-fade:] *= np.linspace(1, 0, fade)
peak = max(np.abs(L).max(), np.abs(R).max())
L, R = np.tanh(1.2 * L / peak) / np.tanh(1.2), np.tanh(1.2 * R / peak) / np.tanh(1.2)
L *= 0.89
R *= 0.89
pcm = (np.stack([L, R], 1) * 32767).astype(np.int16)

out = Path(__file__).resolve().parent.parent / "public" / "audio" / "soundtrack-edificio.wav"
out.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(out), "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(out, f"{len(L) / SR:.2f}s")
