#!/usr/bin/env python3
"""
Generate App Store iOS screenshots from existing Play Store phone shots.

Apple required sizes (2024+):
  - 6.9" iPhone Pro Max: 1290 × 2796   (also accepted: 1320 × 2868)
  - 6.5" iPhone Plus:    1242 × 2688   (also: 1284 × 2778)
  - 13"  iPad Pro:       2064 × 2752

Strategy: take existing 1080×1920 phone screenshot, scale to fit the new
canvas height with width-fit (so design isn't squashed), and place on the
parchment background colour from the editorial design system.

Output:
  store-assets/screenshots/ios-iphone67/01-feed.png   1290×2796
  store-assets/screenshots/ios-iphone65/01-feed.png   1242×2688
  store-assets/screenshots/ios-ipad13/01-feed.png     2064×2752
"""
from PIL import Image
import os, glob

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_PHONE = os.path.join(ROOT, "store-assets", "screenshots", "phone")
SRC_TAB10 = os.path.join(ROOT, "store-assets", "screenshots", "tablet10")

# Editorial parchment background colour
BG = (244, 241, 234)

TARGETS = [
    {"out": "ios-iphone67", "size": (1290, 2796), "src_dir": SRC_PHONE},
    {"out": "ios-iphone65", "size": (1242, 2688), "src_dir": SRC_PHONE},
    {"out": "ios-ipad13",   "size": (2064, 2752), "src_dir": SRC_TAB10},
]

def fit_into(img, target_size, bg=BG):
    """Scale img to fit inside target_size preserving aspect ratio,
    then paste on a bg-coloured canvas centered."""
    tw, th = target_size
    iw, ih = img.size
    scale = min(tw / iw, th / ih)
    new_w = int(iw * scale)
    new_h = int(ih * scale)
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (tw, th), bg)
    canvas.paste(resized, ((tw - new_w) // 2, (th - new_h) // 2))
    return canvas

count = 0
for target in TARGETS:
    out_dir = os.path.join(ROOT, "store-assets", "screenshots", target["out"])
    os.makedirs(out_dir, exist_ok=True)

    sources = sorted(glob.glob(os.path.join(target["src_dir"], "*.png")))
    if not sources:
        print(f"⚠️  No source images in {target['src_dir']}, skipping")
        continue

    for src_path in sources:
        name = os.path.basename(src_path)
        with Image.open(src_path) as img:
            # Convert to RGB if needed
            if img.mode != "RGB":
                img = img.convert("RGB")
            out = fit_into(img, target["size"])
            out_path = os.path.join(out_dir, name)
            out.save(out_path, "PNG", optimize=True)
            count += 1
            print(f"✅ {target['out']}/{name}  ({target['size'][0]}×{target['size'][1]})")

print(f"\n🎉 Generated {count} iOS screenshots")
print("\nUpload paths in App Store Connect:")
print("  iPhone 6.7\" Display → store-assets/screenshots/ios-iphone67/")
print("  iPhone 6.5\" Display → store-assets/screenshots/ios-iphone65/")
print("  iPad Pro 13\"        → store-assets/screenshots/ios-ipad13/")
