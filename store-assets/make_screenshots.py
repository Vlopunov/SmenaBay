#!/usr/bin/env python3
"""
Generate Play Store marketing screenshots for СменаБел.

Outputs:
  store-assets/screenshots/phone/01-feed.png        1080×1920
  store-assets/screenshots/phone/02-shift.png       1080×1920
  store-assets/screenshots/phone/03-map.png         1080×1920
  store-assets/screenshots/phone/04-chat.png        1080×1920
  store-assets/screenshots/phone/05-profile.png     1080×1920
  store-assets/screenshots/phone/06-employer.png    1080×1920
  store-assets/screenshots/tablet7/*                1200×1920  (x2)
  store-assets/screenshots/tablet10/*               1440×2560  (x2)
"""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_PHONE = os.path.join(ROOT, "store-assets", "screenshots", "phone")
OUT_T7 = os.path.join(ROOT, "store-assets", "screenshots", "tablet7")
OUT_T10 = os.path.join(ROOT, "store-assets", "screenshots", "tablet10")
for d in (OUT_PHONE, OUT_T7, OUT_T10):
    os.makedirs(d, exist_ok=True)

# ========== PALETTE ==========
PRIMARY = (79, 70, 229)
PRIMARY_DARK = (55, 48, 163)
PRIMARY_LIGHT = (129, 140, 248)
ACCENT_GREEN = (34, 197, 94)
ACCENT_ORANGE = (249, 115, 22)
BG = (248, 250, 252)
CARD = (255, 255, 255)
TEXT = (17, 24, 39)
SUBTLE = (107, 114, 128)
MUTED = (156, 163, 175)
HAIR = (229, 231, 235)
WHITE = (255, 255, 255)

FONT_CANDIDATES = {
    "regular": [
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/Library/Fonts/Arial.ttf",
    ],
    "bold": [
        "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        "/Library/Fonts/Arial Bold.ttf",
        "/System/Library/Fonts/SFNS.ttf",
    ],
}

def font(size, weight="regular"):
    for path in FONT_CANDIDATES.get(weight, FONT_CANDIDATES["regular"]):
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()

# ========== HELPERS ==========
def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(len(a)))

def gradient_rect(draw_img, x0, y0, x1, y1, c_top, c_bot, vertical=True):
    w = x1 - x0
    h = y1 - y0
    steps = h if vertical else w
    for i in range(steps):
        t = i / max(1, steps - 1)
        c = lerp(c_top, c_bot, t)
        if vertical:
            draw_img.line([(x0, y0 + i), (x1, y0 + i)], fill=c)
        else:
            draw_img.line([(x0 + i, y0), (x0 + i, y1)], fill=c)

def rounded_rect(img, xy, radius, fill, outline=None, outline_width=1, shadow=False):
    """Draw a rounded rect. Optionally casts a soft drop shadow."""
    x0, y0, x1, y1 = xy
    if shadow:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        off = 6
        sd.rounded_rectangle(
            [x0 + 2, y0 + off, x1 + 2, y1 + off],
            radius=radius,
            fill=(0, 0, 0, 35),
        )
        sh = sh.filter(ImageFilter.GaussianBlur(10))
        img.alpha_composite(sh)
    draw = ImageDraw.Draw(img)
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=outline_width)

def draw_star(draw, cx, cy, r, fill, filled=True):
    """Draws a 5-pointed star centered at cx,cy with outer radius r."""
    import math as _m
    pts = []
    for i in range(10):
        angle = -_m.pi / 2 + i * _m.pi / 5
        rr = r if i % 2 == 0 else r * 0.42
        pts.append((cx + rr * _m.cos(angle), cy + rr * _m.sin(angle)))
    if filled:
        draw.polygon(pts, fill=fill)
    else:
        draw.polygon(pts, outline=fill, width=2)

def draw_stars_row(draw, x, y, filled_count, total=5, size=20, color=(245, 158, 11), empty_color=(229, 231, 235), gap=10):
    for i in range(total):
        draw_star(draw, x + size + i * (size * 2 + gap), y + size, size, color if i < filled_count else empty_color, True)
    return x + total * (size * 2 + gap)

def draw_pin_icon(draw, x, y, size, color):
    """Small location pin."""
    r = size / 2
    cx = x + r
    cy = y + r
    draw.ellipse([cx - r, cy - r, cx + r, cy + r * 0.7], fill=color)
    draw.polygon([(cx - r * 0.5, cy + r * 0.3), (cx + r * 0.5, cy + r * 0.3), (cx, cy + r * 1.1)], fill=color)
    draw.ellipse([cx - r * 0.3, cy - r * 0.3, cx + r * 0.3, cy + r * 0.3], fill=WHITE)

def draw_clock_icon(draw, x, y, size, color):
    r = size / 2
    cx = x + r
    cy = y + r
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=3)
    # hands
    draw.line([(cx, cy), (cx, cy - r * 0.6)], fill=color, width=3)
    draw.line([(cx, cy), (cx + r * 0.5, cy)], fill=color, width=3)

def draw_double_check(draw, x, y, size, color):
    """Draws two overlapping checkmarks like ✓✓."""
    s = size
    # first check
    draw.line([(x, y + s * 0.5), (x + s * 0.4, y + s * 0.9)], fill=color, width=3)
    draw.line([(x + s * 0.4, y + s * 0.9), (x + s * 1.0, y + s * 0.1)], fill=color, width=3)
    # second check slightly offset right
    x2 = x + s * 0.6
    draw.line([(x2, y + s * 0.5), (x2 + s * 0.4, y + s * 0.9)], fill=color, width=3)
    draw.line([(x2 + s * 0.4, y + s * 0.9), (x2 + s * 1.0, y + s * 0.1)], fill=color, width=3)

def text_with_wrap(draw, xy, text, fnt, fill, max_w):
    words = text.split(" ")
    lines = []
    cur = ""
    for w in words:
        test = cur + (" " if cur else "") + w
        bbox = draw.textbbox((0, 0), test, font=fnt)
        if bbox[2] - bbox[0] <= max_w:
            cur = test
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    x, y = xy
    line_h = fnt.size + 6
    for line in lines:
        draw.text((x, y), line, font=fnt, fill=fill)
        y += line_h
    return y

def status_bar(img, dark=False):
    """Status bar with time + signal/battery icons."""
    draw = ImageDraw.Draw(img)
    W = img.size[0]
    H = 60
    draw.rectangle([0, 0, W, H], fill=(255, 255, 255, 0))
    fg = WHITE if dark else TEXT
    draw.text((50, 14), "9:41", font=font(32, "bold"), fill=fg)
    # right: signal, wifi, battery
    x = W - 180
    # signal dots
    for i in range(4):
        h = 8 + i * 5
        draw.rectangle([x + i * 9, 40 - h, x + i * 9 + 6, 40], fill=fg)
    x += 55
    # wifi (simple arcs as triangle)
    pts = [(x, 38), (x + 24, 38), (x + 12, 20)]
    draw.polygon(pts, fill=fg)
    x += 40
    # battery
    draw.rounded_rectangle([x, 20, x + 50, 40], radius=4, outline=fg, width=2)
    draw.rectangle([x + 50, 26, x + 54, 34], fill=fg)
    draw.rounded_rectangle([x + 3, 23, x + 40, 37], radius=2, fill=fg)

def tab_bar(img, active_index=0):
    """Bottom tab bar with 5 tabs."""
    draw = ImageDraw.Draw(img)
    W, H = img.size
    bar_h = 160
    y0 = H - bar_h
    draw.rectangle([0, y0, W, H], fill=WHITE)
    draw.line([(0, y0), (W, y0)], fill=HAIR, width=2)
    tabs = [
        ("Лента", "list"),
        ("Карта", "map"),
        ("Чат", "chat"),
        ("Смены", "bookmark"),
        ("Профиль", "user"),
    ]
    tw = W / 5
    f = font(24, "bold")
    for i, (label, icn) in enumerate(tabs):
        cx = tw * i + tw / 2
        color = PRIMARY if i == active_index else MUTED
        # icon (simple shape)
        size = 44
        iy = y0 + 30
        ix = cx - size / 2
        if icn == "list":
            for k in range(3):
                draw.rounded_rectangle([ix, iy + k * 13, ix + size, iy + k * 13 + 7], radius=3, fill=color)
        elif icn == "map":
            pts = [(cx - 22, iy + 42), (cx + 22, iy + 42), (cx + 22, iy + 8), (cx - 22, iy + 22)]
            draw.polygon(pts, outline=color, width=4)
        elif icn == "chat":
            draw.rounded_rectangle([ix, iy, ix + size, iy + size - 8], radius=12, outline=color, width=4)
            draw.polygon([(cx - 8, iy + size - 8), (cx, iy + size + 2), (cx + 8, iy + size - 8)], fill=color)
        elif icn == "bookmark":
            draw.polygon(
                [(ix + 8, iy), (ix + size - 8, iy), (ix + size - 8, iy + size + 4),
                 (cx, iy + size - 10), (ix + 8, iy + size + 4)],
                outline=color, width=4,
            )
        elif icn == "user":
            draw.ellipse([cx - 12, iy + 4, cx + 12, iy + 28], outline=color, width=4)
            draw.arc([ix, iy + 18, ix + size, iy + size + 18], start=0, end=180, fill=color, width=4)
        # label
        bbox = draw.textbbox((0, 0), label, font=f)
        lw = bbox[2] - bbox[0]
        draw.text((cx - lw / 2, iy + size + 14), label, font=f, fill=color)

def header(img, title, has_back=False, right_icon=None):
    draw = ImageDraw.Draw(img)
    W = img.size[0]
    h = 140
    y0 = 60
    draw.rectangle([0, y0, W, y0 + h], fill=WHITE)
    draw.line([(0, y0 + h), (W, y0 + h)], fill=HAIR, width=1)
    if has_back:
        # arrow
        draw.line([(56, y0 + h / 2), (100, y0 + h / 2 - 20)], fill=TEXT, width=5)
        draw.line([(56, y0 + h / 2), (100, y0 + h / 2 + 20)], fill=TEXT, width=5)
        tx = 130
    else:
        tx = 56
    draw.text((tx, y0 + 44), title, font=font(48, "bold"), fill=TEXT)
    if right_icon == "filter":
        fx = W - 110
        draw.line([(fx, y0 + 60), (fx + 50, y0 + 60)], fill=TEXT, width=5)
        draw.line([(fx + 8, y0 + 80), (fx + 42, y0 + 80)], fill=TEXT, width=5)
        draw.line([(fx + 18, y0 + 100), (fx + 32, y0 + 100)], fill=TEXT, width=5)
    elif right_icon == "bell":
        fx = W - 110
        draw.rounded_rectangle([fx, y0 + 50, fx + 50, y0 + 100], radius=24, outline=TEXT, width=4)
        draw.ellipse([fx + 40, y0 + 48, fx + 58, y0 + 64], fill=(239, 68, 68))

def chip(draw, xy, text, fnt, fg, bg, radius=28, padx=22, pady=12):
    bbox = draw.textbbox((0, 0), text, font=fnt)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    x, y = xy
    draw.rounded_rectangle([x, y, x + tw + padx * 2, y + th + pady * 2], radius=radius, fill=bg)
    draw.text((x + padx, y + pady - bbox[1]), text, font=fnt, fill=fg)
    return x + tw + padx * 2

def caption_banner(img, title, subtitle=None):
    """Draws a brand-colored caption area at the very top with large title text."""
    draw = ImageDraw.Draw(img)
    W = img.size[0]
    h = 280
    # gradient background
    gradient_rect(draw, 0, 0, W, h, PRIMARY_LIGHT, PRIMARY)
    # title
    lines = title.split("\n")
    y = 80 if not subtitle else 60
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font(58, "bold"))
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) / 2, y), line, font=font(58, "bold"), fill=WHITE)
        y += 72
    if subtitle:
        bbox = draw.textbbox((0, 0), subtitle, font=font(30))
        tw = bbox[2] - bbox[0]
        draw.text(((W - tw) / 2, y + 8), subtitle, font=font(30), fill=(230, 230, 255))

# ========== SCREENS ==========

def make_base(W=1080, H=1920):
    img = Image.new("RGBA", (W, H), BG + (255,))
    return img

# --- Screen 1: Feed / Shifts list ---
def screen_feed(W=1080, H=1920, caption=True):
    img = make_base(W, H)
    d = ImageDraw.Draw(img)

    content_y = 0
    if caption:
        caption_banner(img, "Смены рядом\nс тобой", "Фильтр по городу, оплате и времени")
        content_y = 280
    else:
        content_y = 0

    # Status bar is drawn in a dark area always — skip when caption banner covers it
    # Instead put it INSIDE the app content area start
    # Device-style: status bar + header + search + chips + cards

    # App white header
    y = content_y
    d.rectangle([0, y, W, y + 60], fill=WHITE)  # status bar bg
    status_bar_on(img, y, dark=False)
    y += 60

    # App header
    d.rectangle([0, y, W, y + 140], fill=WHITE)
    d.text((50, y + 40), "СменаБел", font=font(52, "bold"), fill=PRIMARY)
    # bell icon
    bx = W - 110
    d.rounded_rectangle([bx, y + 45, bx + 52, y + 100], radius=24, outline=TEXT, width=4)
    d.ellipse([bx + 40, y + 42, bx + 60, y + 62], fill=(239, 68, 68))
    y += 140

    # Search bar
    d.rectangle([0, y, W, y + 130], fill=WHITE)
    d.rounded_rectangle([40, y + 20, W - 40, y + 110], radius=28, fill=(243, 244, 246))
    # magnifier
    d.ellipse([70, y + 46, 108, y + 84], outline=SUBTLE, width=4)
    d.line([(101, y + 77), (128, y + 104)], fill=SUBTLE, width=4)
    d.text((150, y + 50), "Искать по городу, профессии...", font=font(30), fill=MUTED)
    y += 130

    # Filter chips
    d.rectangle([0, y, W, y + 120], fill=BG)
    cx = 40
    cy = y + 30
    f_chip = font(26, "bold")
    cx = chip(d, (cx, cy), "Минск", f_chip, WHITE, PRIMARY) + 16
    cx = chip(d, (cx, cy), "Сегодня", f_chip, TEXT, (229, 231, 235)) + 16
    cx = chip(d, (cx, cy), "≥ 50 BYN", f_chip, TEXT, (229, 231, 235)) + 16
    cx = chip(d, (cx, cy), "Повар", f_chip, TEXT, (229, 231, 235))
    y += 120

    # Shift cards
    cards = [
        {
            "title": "Официант в ресторан «Фазенда»",
            "city": "Минск, ул. Притыцкого",
            "time": "Сегодня 18:00 — 23:00",
            "pay": "85 BYN",
            "tag": "СЕГОДНЯ",
            "tagcolor": ACCENT_ORANGE,
        },
        {
            "title": "Грузчик на склад",
            "city": "Минск, Партизанский р-н",
            "time": "Завтра 08:00 — 16:00",
            "pay": "120 BYN",
            "tag": "HOT",
            "tagcolor": (239, 68, 68),
        },
        {
            "title": "Промоутер у ТЦ Galleria",
            "city": "Минск, пр. Победителей 9",
            "time": "18 апр 10:00 — 18:00",
            "pay": "95 BYN",
            "tag": "NEW",
            "tagcolor": ACCENT_GREEN,
        },
    ]
    for c in cards:
        if y > H - 400:
            break
        card_h = 260
        rounded_rect(img, [40, y + 20, W - 40, y + 20 + card_h], radius=24, fill=CARD, shadow=True)
        d = ImageDraw.Draw(img)
        # image placeholder (left)
        d.rounded_rectangle([60, y + 40, 240, y + card_h + 0], radius=16, fill=(224, 231, 255))
        # brand icon inside
        d.ellipse([120, y + 90, 180, y + 150], fill=PRIMARY)
        d.text((138, y + 100), "С", font=font(44, "bold"), fill=WHITE)
        # title
        d.text((270, y + 42), c["title"][:28], font=font(30, "bold"), fill=TEXT)
        # city with pin icon
        draw_pin_icon(d, 270, y + 92, 26, PRIMARY)
        d.text((310, y + 90), c["city"], font=font(24), fill=SUBTLE)
        # time with clock icon
        draw_clock_icon(d, 270, y + 132, 26, ACCENT_GREEN)
        d.text((310, y + 130), c["time"], font=font(24), fill=SUBTLE)
        # pay
        d.text((270, y + 180), c["pay"], font=font(38, "bold"), fill=PRIMARY)
        d.text((430, y + 194), "за смену", font=font(22), fill=MUTED)
        # tag chip
        tag_f = font(20, "bold")
        bbox = d.textbbox((0, 0), c["tag"], font=tag_f)
        tw = bbox[2] - bbox[0]
        d.rounded_rectangle([W - 60 - tw - 30, y + 44, W - 60, y + 84], radius=20, fill=c["tagcolor"])
        d.text((W - 60 - tw - 15, y + 52), c["tag"], font=tag_f, fill=WHITE)
        y += card_h + 24

    tab_bar(img, active_index=0)
    return img

def status_bar_on(img, y_offset, dark=False):
    draw = ImageDraw.Draw(img)
    W = img.size[0]
    fg = WHITE if dark else TEXT
    draw.text((50, y_offset + 14), "9:41", font=font(30, "bold"), fill=fg)
    x = W - 180
    for i in range(4):
        h = 8 + i * 5
        draw.rectangle([x + i * 9, y_offset + 40 - h, x + i * 9 + 6, y_offset + 40], fill=fg)
    x += 55
    draw.polygon([(x, y_offset + 38), (x + 24, y_offset + 38), (x + 12, y_offset + 20)], fill=fg)
    x += 40
    draw.rounded_rectangle([x, y_offset + 20, x + 50, y_offset + 40], radius=4, outline=fg, width=2)
    draw.rectangle([x + 50, y_offset + 26, x + 54, y_offset + 34], fill=fg)
    draw.rounded_rectangle([x + 3, y_offset + 23, x + 40, y_offset + 37], radius=2, fill=fg)

# --- Screen 2: Shift Detail ---
def screen_shift_detail(W=1080, H=1920):
    img = make_base(W, H)
    d = ImageDraw.Draw(img)

    caption_banner(img, "Всё о смене\nв одном месте", "Откликнись в один тап")
    y = 280
    # status bar
    d.rectangle([0, y, W, y + 60], fill=WHITE)
    status_bar_on(img, y)
    y += 60

    # back header
    d.rectangle([0, y, W, y + 120], fill=WHITE)
    d.line([(56, y + 60), (100, y + 40)], fill=TEXT, width=5)
    d.line([(56, y + 60), (100, y + 80)], fill=TEXT, width=5)
    # share/save icons
    d.rounded_rectangle([W - 110, y + 30, W - 60, y + 90], radius=12, outline=TEXT, width=4)
    d.polygon([(W - 85, y + 45), (W - 98, y + 72), (W - 72, y + 72)], fill=TEXT)
    y += 120

    # Hero image
    hero_h = 340
    d.rectangle([0, y, W, y + hero_h], fill=(224, 231, 255))
    gradient_rect(d, 0, y, W, y + hero_h, PRIMARY_LIGHT, PRIMARY)
    d.ellipse([W / 2 - 60, y + hero_h / 2 - 60, W / 2 + 60, y + hero_h / 2 + 60], fill=(255, 255, 255, 160))
    d.text((W / 2 - 20, y + hero_h / 2 - 30), "С", font=font(66, "bold"), fill=PRIMARY)
    y += hero_h

    # Title block
    d.rectangle([0, y, W, H], fill=BG)
    y += 30
    d.text((50, y), "Официант в ресторан", font=font(44, "bold"), fill=TEXT)
    d.text((50, y + 60), "«Фазенда»", font=font(44, "bold"), fill=TEXT)
    y += 140

    # Rating
    draw_star(d, 70, y + 20, 22, (245, 158, 11))
    d.text((105, y), "4.9", font=font(34, "bold"), fill=(245, 158, 11))
    d.text((170, y), "(124 отзыва)", font=font(28), fill=SUBTLE)
    d.text((420, y + 4), "• Работодатель подтверждён", font=font(24), fill=ACCENT_GREEN)
    y += 80

    # Info blocks grid (2x2)
    block_w = (W - 120) / 2
    info_h = 160
    def info_block(bx, by, icon_color, title, value):
        rounded_rect(img, [bx, by, bx + block_w, by + info_h], radius=20, fill=CARD, shadow=True)
        dd = ImageDraw.Draw(img)
        dd.ellipse([bx + 24, by + 34, bx + 78, by + 88], fill=icon_color)
        dd.text((bx + 105, by + 30), title, font=font(24), fill=SUBTLE)
        dd.text((bx + 105, by + 70), value, font=font(34, "bold"), fill=TEXT)

    info_block(50, y, PRIMARY, "Оплата", "85 BYN")
    info_block(60 + block_w, y, ACCENT_GREEN, "Время", "5 часов")
    y += info_h + 20
    info_block(50, y, ACCENT_ORANGE, "Дата", "Сегодня")
    info_block(60 + block_w, y, (236, 72, 153), "Место", "Минск")
    y += info_h + 50

    # Description
    d.text((50, y), "Описание", font=font(36, "bold"), fill=TEXT)
    y += 60
    y = text_with_wrap(
        d, (50, y),
        "Работа в ресторане. Приветливое общение, вынос блюд, поддержание чистоты. Обед предоставляется.",
        font(26), SUBTLE, W - 100,
    )

    # CTA button (above tab bar)
    btn_y = H - 280
    gradient_rect(d, 50, btn_y, W - 50, btn_y + 120, PRIMARY_LIGHT, PRIMARY)
    # rounded mask
    mask = Image.new("L", img.size, 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([50, btn_y, W - 50, btn_y + 120], radius=30, fill=255)
    # redraw rounded rect fill
    img.putalpha(255)
    # simpler: just draw rounded filled rect
    rounded_rect(img, [50, btn_y, W - 50, btn_y + 120], radius=30, fill=PRIMARY)
    dd = ImageDraw.Draw(img)
    btn_text = "Откликнуться →"
    bbox = dd.textbbox((0, 0), btn_text, font=font(38, "bold"))
    tw = bbox[2] - bbox[0]
    dd.text(((W - tw) / 2, btn_y + 32), btn_text, font=font(38, "bold"), fill=WHITE)

    return img

# --- Screen 3: Map ---
def screen_map(W=1080, H=1920):
    img = make_base(W, H)
    d = ImageDraw.Draw(img)

    caption_banner(img, "Карта смен рядом", "Видишь сразу — где и сколько платят")
    y = 280
    d.rectangle([0, y, W, y + 60], fill=WHITE)
    status_bar_on(img, y)
    y += 60

    # Map BG — subtle grid + streets
    map_h = H - y - 160
    d.rectangle([0, y, W, y + map_h], fill=(232, 237, 244))
    # streets
    for sy in range(y, y + map_h, 120):
        d.line([(0, sy), (W, sy)], fill=(217, 224, 232), width=4)
    for sx in range(0, W, 140):
        d.line([(sx, y), (sx, y + map_h)], fill=(217, 224, 232), width=4)
    # a park / green area
    d.rounded_rectangle([100, y + 260, 480, y + 520], radius=30, fill=(212, 232, 210))
    # river
    d.polygon(
        [(W, y + 350), (W - 300, y + 500), (W - 400, y + 750),
         (W - 250, y + 900), (W, y + 900)],
        fill=(191, 219, 254),
    )

    # Pins
    pins = [
        (280, y + 380, "85", ACCENT_ORANGE, True),
        (620, y + 280, "120", ACCENT_GREEN, False),
        (480, y + 620, "95", PRIMARY, False),
        (780, y + 480, "70", PRIMARY, False),
        (340, y + 820, "150", (239, 68, 68), True),
        (800, y + 820, "60", PRIMARY, False),
    ]
    for (px, py, label, col, hot) in pins:
        # shadow
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        sd = ImageDraw.Draw(sh)
        sd.ellipse([px - 60, py - 50, px + 60, py + 60], fill=(0, 0, 0, 60))
        sh = sh.filter(ImageFilter.GaussianBlur(8))
        img.alpha_composite(sh)
        # pin
        d.rounded_rectangle([px - 58, py - 44, px + 58, py + 22], radius=28, fill=col)
        d.polygon([(px - 18, py + 22), (px + 18, py + 22), (px, py + 52)], fill=col)
        bbox = d.textbbox((0, 0), label, font=font(32, "bold"))
        tw = bbox[2] - bbox[0]
        d.text((px - tw / 2, py - 30), label, font=font(32, "bold"), fill=WHITE)
        if hot:
            d.ellipse([px + 36, py - 52, px + 70, py - 18], fill=(239, 68, 68))
            d.text((px + 44, py - 50), "!", font=font(24, "bold"), fill=WHITE)

    # "You are here" circle
    meu_x, meu_y = W / 2, y + map_h - 350
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    sd.ellipse([meu_x - 100, meu_y - 100, meu_x + 100, meu_y + 100], fill=(79, 70, 229, 60))
    sh = sh.filter(ImageFilter.GaussianBlur(6))
    img.alpha_composite(sh)
    d.ellipse([meu_x - 20, meu_y - 20, meu_x + 20, meu_y + 20], fill=PRIMARY, outline=WHITE, width=6)

    # floating search / card at top of map
    rounded_rect(img, [40, y + 30, W - 40, y + 150], radius=24, fill=CARD, shadow=True)
    dd = ImageDraw.Draw(img)
    dd.text((70, y + 58), "Минск • 124 смены рядом", font=font(28, "bold"), fill=TEXT)
    dd.text((70, y + 100), "Радиус 5 км • Фильтры активны", font=font(22), fill=SUBTLE)

    tab_bar(img, active_index=1)
    return img

# --- Screen 4: Chat ---
def screen_chat(W=1080, H=1920):
    img = make_base(W, H)
    d = ImageDraw.Draw(img)

    caption_banner(img, "Чат с\nработодателем", "Уточняй детали до смены")
    y = 280
    d.rectangle([0, y, W, y + 60], fill=WHITE)
    status_bar_on(img, y)
    y += 60

    # chat header with avatar + name + status
    d.rectangle([0, y, W, y + 160], fill=WHITE)
    d.line([(0, y + 160), (W, y + 160)], fill=HAIR, width=1)
    # back arrow
    d.line([(56, y + 80), (100, y + 60)], fill=TEXT, width=5)
    d.line([(56, y + 80), (100, y + 100)], fill=TEXT, width=5)
    # avatar
    d.ellipse([140, y + 34, 240, y + 134], fill=PRIMARY_LIGHT)
    d.text((175, y + 54), "А", font=font(46, "bold"), fill=WHITE)
    d.ellipse([220, y + 104, 244, y + 128], fill=ACCENT_GREEN, outline=WHITE, width=4)
    d.text((270, y + 40), "Анна Петровна", font=font(36, "bold"), fill=TEXT)
    d.text((270, y + 90), "Ресторан «Фазенда»", font=font(26), fill=SUBTLE)
    d.text((270, y + 124), "В сети", font=font(24), fill=ACCENT_GREEN)
    y += 160

    # chat messages area
    msgs = [
        ("them", "Добрый день! Вы свободны сегодня в 18:00?", "18:22"),
        ("me", "Здравствуйте! Да, подойду за час. Какая форма?", "18:23"),
        ("them", "Чёрный верх, чёрный низ. Фартук дадим на месте.", "18:24"),
        ("me", "Понял. Сколько длится смена?", "18:25"),
        ("them", "5 часов, 18:00–23:00. Оплата 85 BYN в конце.", "18:26"),
    ]
    my = y + 30
    for (who, text, time) in msgs:
        max_w = W * 0.7
        fnt = font(28)
        bbox = d.textbbox((0, 0), text, font=fnt)
        tw = bbox[2] - bbox[0]
        # wrap if needed
        bubble_w = min(max_w, tw + 60)
        # compute actual wrapped size
        lines = []
        words = text.split()
        cur = ""
        for w in words:
            t = cur + (" " if cur else "") + w
            b = d.textbbox((0, 0), t, font=fnt)
            if b[2] - b[0] <= bubble_w - 60:
                cur = t
            else:
                if cur:
                    lines.append(cur)
                cur = w
        if cur:
            lines.append(cur)
        lh = fnt.size + 10
        bubble_h = lh * len(lines) + 36

        if who == "me":
            bx1 = W - 60
            bx0 = bx1 - bubble_w
            rounded_rect(img, [bx0, my, bx1, my + bubble_h], radius=28, fill=PRIMARY)
            dd = ImageDraw.Draw(img)
            ty = my + 16
            for line in lines:
                dd.text((bx0 + 30, ty), line, font=fnt, fill=WHITE)
                ty += lh
            dd.text((bx1 - 110, my + bubble_h + 8), time, font=font(20), fill=MUTED)
            draw_double_check(dd, bx1 - 40, my + bubble_h + 12, 20, ACCENT_GREEN)
        else:
            bx0 = 60
            bx1 = bx0 + bubble_w
            rounded_rect(img, [bx0, my, bx1, my + bubble_h], radius=28, fill=WHITE)
            dd = ImageDraw.Draw(img)
            ty = my + 16
            for line in lines:
                dd.text((bx0 + 30, ty), line, font=fnt, fill=TEXT)
                ty += lh
            dd.text((bx0 + 10, my + bubble_h + 8), time, font=font(20), fill=MUTED)
        my += bubble_h + 60

    # input area at bottom
    input_y = H - 180
    d.rectangle([0, input_y, W, H], fill=WHITE)
    d.line([(0, input_y), (W, input_y)], fill=HAIR, width=1)
    rounded_rect(img, [40, input_y + 30, W - 180, input_y + 130], radius=50, fill=(243, 244, 246))
    dd = ImageDraw.Draw(img)
    dd.text((80, input_y + 62), "Напишите сообщение...", font=font(28), fill=MUTED)
    # send button
    d.ellipse([W - 150, input_y + 30, W - 50, input_y + 130], fill=PRIMARY)
    # arrow
    d.polygon([(W - 118, input_y + 58), (W - 80, input_y + 80), (W - 118, input_y + 102)], fill=WHITE)

    return img

# --- Screen 5: Profile ---
def screen_profile(W=1080, H=1920):
    img = make_base(W, H)
    d = ImageDraw.Draw(img)

    caption_banner(img, "Репутация на\nтвоей стороне", "Отзывы после каждой смены")
    y = 280
    d.rectangle([0, y, W, y + 60], fill=WHITE)
    status_bar_on(img, y)
    y += 60

    # profile header (gradient card)
    hero_h = 360
    rounded_rect(img, [0, y, W, y + hero_h], radius=0, fill=PRIMARY)
    gradient_rect(d, 0, y, W, y + hero_h, PRIMARY_LIGHT, PRIMARY)
    # avatar
    d.ellipse([W / 2 - 80, y + 40, W / 2 + 80, y + 200], fill=WHITE)
    d.text((W / 2 - 44, y + 74), "А", font=font(90, "bold"), fill=PRIMARY)
    # name
    name = "Андрей Ковалёв"
    bbox = d.textbbox((0, 0), name, font=font(44, "bold"))
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) / 2, y + 220), name, font=font(44, "bold"), fill=WHITE)
    # role
    role = "Соискатель • Минск"
    bbox = d.textbbox((0, 0), role, font=font(28))
    tw = bbox[2] - bbox[0]
    d.text(((W - tw) / 2, y + 280), role, font=font(28), fill=(230, 230, 255))
    y += hero_h

    # stats row
    stats = [("4.9", "Рейтинг", (245, 158, 11)), ("47", "Смен", PRIMARY), ("36", "Отзывов", ACCENT_GREEN)]
    sw = W / 3
    d.rectangle([0, y, W, y + 180], fill=WHITE)
    for i, (val, lbl, col) in enumerate(stats):
        cx = sw * i + sw / 2
        bbox = d.textbbox((0, 0), val, font=font(52, "bold"))
        tw = bbox[2] - bbox[0]
        d.text((cx - tw / 2, y + 30), val, font=font(52, "bold"), fill=col)
        bbox = d.textbbox((0, 0), lbl, font=font(24))
        tw = bbox[2] - bbox[0]
        d.text((cx - tw / 2, y + 110), lbl, font=font(24), fill=SUBTLE)
    y += 180

    # reviews section
    d.rectangle([0, y, W, H], fill=BG)
    y += 30
    d.text((50, y), "Отзывы", font=font(36, "bold"), fill=TEXT)
    d.text((W - 150, y + 8), "Все →", font=font(26, "bold"), fill=PRIMARY)
    y += 70

    reviews = [
        ("Ресторан «Фазенда»", 5, "Отличный работник, вежливый, внимательный. Рекомендую!", "2 дня назад"),
        ("Склад MaxLogistic", 5, "Пришёл вовремя, справился с задачей быстро.", "1 неделю назад"),
        ("Кофейня «Brew»", 4, "Хороший парень, но опоздал на 15 минут.", "2 недели назад"),
    ]
    for (author, stars, text, time) in reviews:
        if y > H - 300:
            break
        rh = 260
        rounded_rect(img, [40, y, W - 40, y + rh], radius=24, fill=CARD, shadow=True)
        dd = ImageDraw.Draw(img)
        dd.text((70, y + 24), author, font=font(28, "bold"), fill=TEXT)
        # star row
        for i in range(5):
            draw_star(dd, 84 + i * 46, y + 90, 18,
                      (245, 158, 11) if i < stars else (229, 231, 235), True)
        text_with_wrap(dd, (70, y + 130), text, font(24), SUBTLE, W - 180)
        dd.text((70, y + 220), time, font=font(22), fill=MUTED)
        y += rh + 20

    tab_bar(img, active_index=4)
    return img

# --- Screen 6: Employer (Create Shift / Dashboard) ---
def screen_employer(W=1080, H=1920):
    img = make_base(W, H)
    d = ImageDraw.Draw(img)

    caption_banner(img, "Публикуй смены\nза минуту", "Для работодателей")
    y = 280
    d.rectangle([0, y, W, y + 60], fill=WHITE)
    status_bar_on(img, y)
    y += 60

    # header
    d.rectangle([0, y, W, y + 140], fill=WHITE)
    d.line([(0, y + 140), (W, y + 140)], fill=HAIR, width=1)
    d.text((50, y + 40), "Панель компании", font=font(42, "bold"), fill=TEXT)
    y += 140

    # KPIs
    kpis = [
        ("12", "Активных смен", PRIMARY),
        ("34", "Откликов", ACCENT_GREEN),
        ("8", "Сегодня", ACCENT_ORANGE),
    ]
    d.rectangle([0, y, W, y + 220], fill=BG)
    kw = (W - 60) / 3
    for i, (val, lbl, col) in enumerate(kpis):
        kx = 30 + kw * i + 10
        rounded_rect(img, [kx, y + 30, kx + kw - 20, y + 200], radius=24, fill=CARD, shadow=True)
        dd = ImageDraw.Draw(img)
        dd.ellipse([kx + 30, y + 50, kx + 90, y + 110], fill=col)
        dd.text((kx + 30, y + 120), val, font=font(48, "bold"), fill=TEXT)
        dd.text((kx + 30, y + 176), lbl, font=font(22), fill=SUBTLE)
    y += 220

    # CTA: create shift
    rounded_rect(img, [40, y + 20, W - 40, y + 170], radius=24, fill=PRIMARY)
    dd = ImageDraw.Draw(img)
    # plus icon
    px = 90
    py_c = y + 95
    dd.ellipse([px - 34, py_c - 34, px + 34, py_c + 34], fill=WHITE)
    dd.line([(px, py_c - 18), (px, py_c + 18)], fill=PRIMARY, width=6)
    dd.line([(px - 18, py_c), (px + 18, py_c)], fill=PRIMARY, width=6)
    dd.text((160, y + 60), "Опубликовать смену", font=font(36, "bold"), fill=WHITE)
    dd.text((160, y + 112), "Займёт меньше минуты", font=font(24), fill=(230, 230, 255))
    y += 200

    # Recent applications list
    d.rectangle([0, y, W, H], fill=BG)
    y += 20
    d.text((50, y), "Новые отклики", font=font(34, "bold"), fill=TEXT)
    y += 60

    apps = [
        ("Андрей К.", "Официант • Сегодня 18:00", "4.9 • 47 смен", (79, 70, 229)),
        ("Мария С.", "Официант • Сегодня 18:00", "4.8 • 23 смены", (236, 72, 153)),
        ("Игорь П.", "Грузчик • Завтра 08:00", "4.7 • 15 смен", ACCENT_GREEN),
        ("Елена В.", "Промоутер • 18 апр", "5.0 • 62 смены", ACCENT_ORANGE),
    ]
    for (name, pos, stats, avatar_col) in apps:
        if y > H - 280:
            break
        rh = 140
        rounded_rect(img, [40, y, W - 40, y + rh], radius=20, fill=CARD, shadow=True)
        dd = ImageDraw.Draw(img)
        # avatar
        dd.ellipse([70, y + 28, 170, y + 128], fill=avatar_col)
        dd.text((105, y + 52), name[0], font=font(44, "bold"), fill=WHITE)
        # text
        dd.text((200, y + 28), name, font=font(30, "bold"), fill=TEXT)
        dd.text((200, y + 72), pos, font=font(24), fill=SUBTLE)
        # small star + stats text
        draw_star(dd, 215, y + 116, 12, (245, 158, 11))
        dd.text((235, y + 104), stats, font=font(22), fill=(245, 158, 11))
        # approve button
        rounded_rect(img, [W - 220, y + 38, W - 70, y + 108], radius=24, fill=ACCENT_GREEN)
        dd = ImageDraw.Draw(img)
        dd.text((W - 196, y + 58), "Принять", font=font(24, "bold"), fill=WHITE)
        y += rh + 16

    return img

# ========== BUILD & SAVE ==========

def save(img, path):
    img.convert("RGB").save(path, "PNG", optimize=True)
    print(f"  → {path}  {img.size[0]}×{img.size[1]}")

print("Generating phone screenshots (1080×1920)...")
save(screen_feed(),          os.path.join(OUT_PHONE, "01-feed.png"))
save(screen_shift_detail(),  os.path.join(OUT_PHONE, "02-shift.png"))
save(screen_map(),           os.path.join(OUT_PHONE, "03-map.png"))
save(screen_chat(),          os.path.join(OUT_PHONE, "04-chat.png"))
save(screen_profile(),       os.path.join(OUT_PHONE, "05-profile.png"))
save(screen_employer(),      os.path.join(OUT_PHONE, "06-employer.png"))

print("\nGenerating 7\" tablet screenshots (1200×2134, 9:16)...")
# Use the same functions with scaled canvas — they accept W/H params
for name, fn in [("01-feed.png", screen_feed), ("02-shift.png", screen_shift_detail)]:
    save(fn(W=1200, H=2134), os.path.join(OUT_T7, name))

print("\nGenerating 10\" tablet screenshots (1440×2560, 9:16)...")
for name, fn in [("01-feed.png", screen_feed), ("02-shift.png", screen_shift_detail)]:
    save(fn(W=1440, H=2560), os.path.join(OUT_T10, name))

print("\nDone.")
