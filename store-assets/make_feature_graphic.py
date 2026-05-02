#!/usr/bin/env python3
"""Generate 1024x500 feature graphic for Google Play Store."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os

W, H = 1024, 500
OUT = os.path.join(os.path.dirname(__file__), "feature-graphic-1024x500.png")
ICON = os.path.join(os.path.dirname(__file__), "..", "assets", "icon.png")

# Brand palette
PRIMARY = (79, 70, 229)       # #4F46E5 indigo
PRIMARY_DARK = (55, 48, 163)  # deeper indigo
ACCENT = (129, 140, 248)      # light indigo
WHITE = (255, 255, 255)

def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))

# 1. Diagonal gradient background
img = Image.new("RGB", (W, H), PRIMARY)
px = img.load()
for y in range(H):
    for x in range(W):
        # diagonal: distance along vector (1, 0.4)
        t = (x * 0.75 + y * 0.55) / (W * 0.75 + H * 0.55)
        t = max(0.0, min(1.0, t))
        px[x, y] = lerp(PRIMARY_DARK, PRIMARY, t)

# 2. Soft decorative circles (glow)
glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
# large circle top-right
gd.ellipse([W - 350, -200, W + 200, 350], fill=(129, 140, 248, 60))
# small circle bottom-left
gd.ellipse([-150, H - 250, 250, H + 150], fill=(167, 139, 250, 80))
# accent dot
gd.ellipse([W - 500, 0, W - 380, H - 120], fill=(255, 255, 255, 30))
glow = glow.filter(ImageFilter.GaussianBlur(60))
img.paste(glow, (0, 0), glow)

# 3. Icon on left side
icon = Image.open(ICON).convert("RGBA")
icon_size = 220
icon = icon.resize((icon_size, icon_size), Image.LANCZOS)

# White rounded rect behind icon
pad = 28
badge_size = icon_size + pad * 2
badge = Image.new("RGBA", (badge_size, badge_size), (0, 0, 0, 0))
bd = ImageDraw.Draw(badge)
bd.rounded_rectangle([0, 0, badge_size, badge_size], radius=52, fill=(255, 255, 255, 245))

# Shadow for badge
shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
sd = ImageDraw.Draw(shadow)
sx = 90
sy = (H - badge_size) // 2
sd.rounded_rectangle([sx + 8, sy + 12, sx + badge_size + 8, sy + badge_size + 12], radius=52, fill=(0, 0, 0, 110))
shadow = shadow.filter(ImageFilter.GaussianBlur(22))
img.paste(shadow, (0, 0), shadow)

img.paste(badge, (sx, sy), badge)
img.paste(icon, (sx + pad, sy + pad), icon)

# 4. Text block on right side
draw = ImageDraw.Draw(img)

# Find a font — prefer system Russian-capable fonts
def load_font(size, bold=False):
    candidates = [
        "/System/Library/Fonts/SFNS.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial Bold.ttf" if bold else "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Verdana Bold.ttf" if bold else "/System/Library/Fonts/Supplemental/Verdana.ttf",
    ]
    for f in candidates:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                continue
    return ImageFont.load_default()

f_title = load_font(88, bold=True)
f_sub = load_font(34, bold=False)
f_tag = load_font(24, bold=True)

text_x = sx + badge_size + 50
title_y = 120

# Title "СменаБел"
draw.text((text_x, title_y), "СменаБел", font=f_title, fill=WHITE)

# Subtitle
sub_y = title_y + 120
draw.text((text_x, sub_y), "Подработки и смены", font=f_sub, fill=(230, 230, 255))
draw.text((text_x, sub_y + 48), "в Беларуси", font=f_sub, fill=(230, 230, 255))

# Tagline pill
tag_text = "НАЙДИ РАБОТУ СЕГОДНЯ"
bbox = draw.textbbox((0, 0), tag_text, font=f_tag)
tw = bbox[2] - bbox[0]
th = bbox[3] - bbox[1]
px_pad = 24
py_pad = 12
tag_y = sub_y + 130
draw.rounded_rectangle(
    [text_x, tag_y, text_x + tw + px_pad * 2, tag_y + th + py_pad * 2 + 8],
    radius=40,
    fill=(255, 255, 255, 230),
)
draw.text((text_x + px_pad, tag_y + py_pad), tag_text, font=f_tag, fill=PRIMARY_DARK)

img.save(OUT, "PNG", optimize=True)
print(f"Saved: {OUT}")
print(f"Size: {img.size}")
