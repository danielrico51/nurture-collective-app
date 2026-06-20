#!/usr/bin/env python3
"""Match logo/favicon backgrounds to site cream (#FAF7F2)."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
PUBLIC = ROOT / "public"
BRANDING = PUBLIC / "branding"
FAVICONS = PUBLIC / "favicons"
APP = ROOT / "src" / "app"

# nurture-cream from tailwind.config.ts
CREAM = (250, 247, 242, 255)
WHITE_THRESHOLD = 238


def near_white(r: int, g: int, b: int, a: int) -> bool:
    return a > 200 and r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD


def replace_background(img: Image.Image, replacement: tuple[int, int, int, int]) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if near_white(r, g, b, a):
                pixels[x, y] = replacement
    return rgba


def crop_baby_mark(wordmark: Image.Image) -> Image.Image:
    w, h = wordmark.size
    baby = wordmark.crop((int(w * 0.02), int(h * 0.08), int(w * 0.36), int(h * 0.92)))
    size = max(baby.size)
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ox = (size - baby.width) // 2
    oy = (size - baby.height) // 2
    canvas.paste(baby, (ox, oy), baby)
    return remove_stray_ink(canvas)


def remove_stray_ink(img: Image.Image, min_component: int = 40) -> Image.Image:
    """Drop tiny disconnected ink specks (e.g. crop artifacts beside the mark)."""
    from collections import deque

    rgba = img.convert("RGBA")
    w, h = rgba.size
    px = rgba.load()

    def is_ink(x: int, y: int) -> bool:
        r, g, b, a = px[x, y]
        return a > 10 and (r + g + b) < 720

    visited = [[False] * w for _ in range(h)]
    components: list[list[tuple[int, int]]] = []
    for y in range(h):
        for x in range(w):
            if visited[y][x] or not is_ink(x, y):
                continue
            queue: deque[tuple[int, int]] = deque([(x, y)])
            visited[y][x] = True
            cells: list[tuple[int, int]] = []
            while queue:
                cx, cy = queue.popleft()
                cells.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and not visited[ny][nx] and is_ink(nx, ny):
                        visited[ny][nx] = True
                        queue.append((nx, ny))
            components.append(cells)

    if not components:
        return rgba

    components.sort(key=len, reverse=True)
    for comp in components[1:]:
        if len(comp) >= min_component:
            continue
        for x, y in comp:
            px[x, y] = (0, 0, 0, 0)
    return rgba


def save_favicons(mark: Image.Image) -> None:
    # Flatten baby onto cream for favicons (opaque, no white halo)
    base = Image.new("RGBA", mark.size, CREAM)
    base.paste(mark, (0, 0), mark)
    rgb = base.convert("RGB")

    for dim in (16, 32, 48, 192, 512):
        rgb.resize((dim, dim), Image.LANCZOS).save(FAVICONS / f"favicon-{dim}x{dim}.png")
    rgb.resize((180, 180), Image.LANCZOS).save(FAVICONS / "apple-touch-icon.png")
    rgb.resize((32, 32), Image.LANCZOS).save(PUBLIC / "favicon.png")
    rgb.resize((32, 32), Image.LANCZOS).save(APP / "icon.png")
    rgb.resize((180, 180), Image.LANCZOS).save(APP / "apple-icon.png")


def main() -> None:
    source = BRANDING / "nesting-place-wordmark.png"
    if not source.exists():
        raise SystemExit(f"Missing {source}")

    original = Image.open(source).convert("RGBA")

    # Transparent wordmark for header (blends on cream/blush hero)
    transparent = replace_background(original.copy(), (0, 0, 0, 0))
    transparent.save(BRANDING / "nesting-place-wordmark.png")

    # Cream-backed wordmark for contexts that need opaque pixels
    cream_wordmark = replace_background(original.copy(), CREAM)
    cream_wordmark.save(BRANDING / "nesting-place-wordmark-cream.png")

    baby = crop_baby_mark(transparent)
    baby.save(BRANDING / "nesting-place-baby-mark.png")

    cream_baby = Image.new("RGBA", baby.size, CREAM)
    cream_baby.paste(baby, (0, 0), baby)
    cream_baby.save(BRANDING / "nesting-place-baby-mark-cream.png")

    # Legacy mark path used by compact header
    baby.save(BRANDING / "nesting-place-mark.png")

    save_favicons(baby)
    print("Updated wordmark (transparent), cream variants, and favicons.")


if __name__ == "__main__":
    main()
