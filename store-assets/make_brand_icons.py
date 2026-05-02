#!/usr/bin/env python3
"""Generate full SmenaBel brand icon set.

Outputs:
  assets/icon.png                 1024x1024 (iOS + Play Store source)
  assets/adaptive-icon.png        1024x1024 (Android adaptive foreground, transparent bg)
  assets/favicon.png              48x48
  store-assets/play-icon-512.png  512x512 (Play Console high-res icon)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")
STORE = os.path.join(ROOT, "store-assets")

PRIMARY_TOP = (99, 102, 241)   # indigo-500
PRIMARY_BOT = (79, 70, 229)    # indigo-600
ACCENT = (167, 139, 250)       # violet-400
WHITE = (255, 255, 255)

FONTS = [
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial Bold.ttf",
    "/System/Library/Fonts/SFNSRounded.ttf",
    "/System/Library/Fonts/SFNS.ttf",
]

def find_font(size):
    for f in FONTS:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                continue
    return ImageFont.load_default()

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

def make_gradient_square(size, radius_ratio=None, bg_top=PRIMARY_TOP, bg_bot=PRIMARY_BOT):
    """Creates RGBA image with vertical gradient. If radius_ratio, rounds corners."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    px = img.load()
    for y in range(size):
        t = y / (size - 1)
        # slight diagonal bias
        col = lerp(bg_top, bg_bot, t)
        for x in range(size):
            # mild diagonal shift
            tx = (x / (size - 1)) * 0.15 + t * 0.85
            tx = max(0.0, min(1.0, tx))
            c = lerp(bg_top, bg_bot, tx)
            px[x, y] = (*c, 255)

    if radius_ratio:
        radius = int(size * radius_ratio)
        mask = Image.new("L", (size, size), 0)
        md = ImageDraw.Draw(mask)
        md.rounded_rectangle([0, 0, size, size], radius=radius, fill=255)
        img.putalpha(mask)
    return img

def draw_glow_highlight(img):
    """Add subtle top-left highlight to give dimension."""
    size = img.size[0]
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    # soft white glow top-left
    gd.ellipse(
        [-size * 0.25, -size * 0.3, size * 0.75, size * 0.45],
        fill=(255, 255, 255, 55),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.07))
    img.alpha_composite(glow)

    # subtle accent arc bottom-right
    acc = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ad = ImageDraw.Draw(acc)
    ad.ellipse(
        [size * 0.55, size * 0.6, size * 1.2, size * 1.25],
        fill=(*ACCENT, 90),
    )
    acc = acc.filter(ImageFilter.GaussianBlur(size * 0.06))
    img.alpha_composite(acc)
    return img

def draw_monogram(img, text="С", color=WHITE, size_ratio=0.58, y_offset_ratio=0.0):
    """Draws a large centered letter monogram."""
    size = img.size[0]
    draw = ImageDraw.Draw(img)
    # binary search for font size that fits width=size*size_ratio
    target_w = size * size_ratio
    lo, hi = 50, int(size * 0.9)
    best = lo
    while lo <= hi:
        mid = (lo + hi) // 2
        f = find_font(mid)
        bbox = draw.textbbox((0, 0), text, font=f)
        w = bbox[2] - bbox[0]
        if w <= target_w:
            best = mid
            lo = mid + 1
        else:
            hi = mid - 1
    font = find_font(best)
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    # bbox[0], bbox[1] may be negative offset — account for it
    x = (size - tw) / 2 - bbox[0]
    y = (size - th) / 2 - bbox[1] + size * y_offset_ratio
    # Subtle shadow for depth
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.text((x + size * 0.012, y + size * 0.018), text, font=font, fill=(0, 0, 0, 70))
    shadow = shadow.filter(ImageFilter.GaussianBlur(size * 0.012))
    img.alpha_composite(shadow)
    draw.text((x, y), text, font=font, fill=color)
    return img

def draw_accent_dot(img):
    """Small violet accent dot near top-right to add distinctiveness."""
    size = img.size[0]
    draw = ImageDraw.Draw(img)
    r = size * 0.055
    cx = size * 0.82
    cy = size * 0.22
    # glow
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([cx - r * 2, cy - r * 2, cx + r * 2, cy + r * 2], fill=(*ACCENT, 120))
    glow = glow.filter(ImageFilter.GaussianBlur(size * 0.025))
    img.alpha_composite(glow)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
    return img

# 1) Main 1024 iOS / Play Store square icon (with rounded corners baked in for iOS look)
def build_main_icon(size=1024, rounded=True):
    img = make_gradient_square(size, radius_ratio=0.22 if rounded else None)
    img = draw_glow_highlight(img)
    img = draw_monogram(img, "С", size_ratio=0.62, y_offset_ratio=-0.02)
    img = draw_accent_dot(img)
    return img

# 2) Android adaptive foreground — FULL canvas gradient with letter inside 66% safe zone.
#    Android masks the 108dp canvas to circle/squircle; foreground must fill the canvas
#    and keep key art inside the inner 66% safe zone so it's never cropped.
def build_adaptive_foreground(size=1024):
    img = make_gradient_square(size)  # full opaque gradient, no rounded corners
    img = draw_glow_highlight(img)
    # Letter sized so it fits well inside the 66% safe zone
    img = draw_monogram(img, "С", size_ratio=0.42, y_offset_ratio=-0.01)
    # Accent dot positioned inside safe zone (not too close to edge)
    # Redraw dot at safer position
    size_ = img.size[0]
    draw = ImageDraw.Draw(img)
    r = size_ * 0.045
    cx = size_ * 0.66
    cy = size_ * 0.34
    glow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse([cx - r * 2.2, cy - r * 2.2, cx + r * 2.2, cy + r * 2.2], fill=(*ACCENT, 130))
    glow = glow.filter(ImageFilter.GaussianBlur(size_ * 0.022))
    img.alpha_composite(glow)
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=WHITE)
    return img

# 3) Favicon — simplified
def build_favicon(size=48):
    img = make_gradient_square(size, radius_ratio=0.22)
    img = draw_monogram(img, "С", size_ratio=0.65, y_offset_ratio=-0.02)
    return img

def save(img, path):
    # iOS icons must NOT have alpha channel (App Store rejects). Flatten for iOS icon.
    if path.endswith("icon.png") and "adaptive" not in path and "favicon" not in path:
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3] if img.mode == "RGBA" else None)
        bg.save(path, "PNG", optimize=True)
    else:
        img.save(path, "PNG", optimize=True)
    print(f"  → {path}  ({img.size[0]}×{img.size[1]})")

print("Generating brand icons...")
main = build_main_icon(1024, rounded=False)  # expo will round on iOS; keep flat for Play Store
# Note: Android adaptive is separate; iOS rounds automatically. Keeping square w/ transparent corners is safest,
# but iOS App Store icon should be a full square (no transparency). For Expo, icon.png should be SQUARE opaque.
main_flat = make_gradient_square(1024)
main_flat = draw_glow_highlight(main_flat)
main_flat = draw_monogram(main_flat, "С", size_ratio=0.62, y_offset_ratio=-0.02)
main_flat = draw_accent_dot(main_flat)
save(main_flat, os.path.join(ASSETS, "icon.png"))

adaptive = build_adaptive_foreground(1024)
save(adaptive, os.path.join(ASSETS, "adaptive-icon.png"))

fav = build_favicon(48)
save(fav, os.path.join(ASSETS, "favicon.png"))

# Play Store 512
play = main_flat.resize((512, 512), Image.LANCZOS)
save(play, os.path.join(STORE, "play-icon-512.png"))

print("Done.")
