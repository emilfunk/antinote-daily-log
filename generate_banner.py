#!/usr/bin/env python3
"""
Generate a clean 16-bit retro pixel banner for the Daily Log Antinote extension
using Antinote's official logo.
"""
import os
from PIL import Image, ImageDraw

# Canvas size in raw pixels (scaled up 4x -> 840x260)
W, H = 210, 65
SCALE = 4

img = Image.new("RGBA", (W, H), (15, 17, 26, 255))
draw = ImageDraw.Draw(img)

# 16-bit Palette matching Antinote's brand identity
BG = (15, 17, 26)               # #0f111a
BORDER_DARK = (28, 32, 48)       # #1c2030
BORDER_LIGHT = (58, 66, 96)      # #3a4260
ANTINOTE_MINT = (64, 224, 168)   # Antinote signature seafoam green
ACCENT_CYAN = (86, 212, 235)     # #56d4eb
ACCENT_GOLD = (247, 195, 79)     # #f7c34f
ACCENT_GREEN = (94, 214, 133)    # #5ed685
TEXT_WHITE = (235, 240, 255)
TEXT_MUTED = (120, 132, 168)

# Outer 16-bit beveled frame
for x in range(W):
    img.putpixel((x, 0), BORDER_LIGHT)
    img.putpixel((x, H - 1), BORDER_DARK)
for y in range(H):
    img.putpixel((0, y), BORDER_LIGHT)
    img.putpixel((W - 1, y), BORDER_DARK)

# Inner accent border line
for x in range(2, W - 2):
    img.putpixel((x, 2), (25, 29, 43))
    img.putpixel((x, H - 3), (25, 29, 43))
for y in range(2, H - 2):
    img.putpixel((2, y), (25, 29, 43))
    img.putpixel((W - 3, y), (25, 29, 43))

# Subtle dithered star field / ambient pixels in background
stars = [
    (12, 10), (32, 54), (45, 12), (88, 10), (140, 12), (195, 22),
    (180, 50), (110, 52), (160, 42), (75, 45), (10, 35), (202, 10),
    (60, 8), (175, 12), (135, 54), (190, 40)
]
for sx, sy in stars:
    img.putpixel((sx, sy), (40, 46, 68))
    if (sx + sy) % 3 == 0:
        img.putpixel((sx + 1, sy), (25, 30, 48))
        img.putpixel((sx - 1, sy), (25, 30, 48))

# -------------------------------------------------------------
# Official Antinote Logo Integration
# -------------------------------------------------------------
logo_path = os.path.join(os.path.dirname(__file__), "assets", "antinote-icon.png")
if os.path.exists(logo_path):
    official_logo = Image.open(logo_path).convert("RGBA")
    # Resize to 36x36 pixel badge size
    logo_small = official_logo.resize((36, 36), Image.Resampling.LANCZOS)
    
    LX, LY = 16, 14
    # 16-bit drop shadow
    shadow = Image.new("RGBA", (36, 36), (0, 0, 0, 200))
    alpha_mask = logo_small.split()[3]
    img.paste(shadow, (LX + 2, LY + 2), alpha_mask)
    
    # Composite the official Antinote logo into the pixel banner
    img.paste(logo_small, (LX, LY), alpha_mask)
    
    # Add subtle pixel highlight corner
    img.putpixel((LX + 6, LY + 2), (255, 255, 255))
    img.putpixel((LX + 7, LY + 2), (255, 255, 255))

# Mini 16-bit status indicators next to logo
# Clock dial icon (x: 55, y: 17)
CX, CY = 55, 17
for ox in range(9):
    for oy in range(9):
        if (ox in [0, 8] and oy in [0, 1, 7, 8]) or (oy in [0, 8] and ox in [0, 1, 7, 8]):
            continue
        if ox in [0, 8] or oy in [0, 8] or (ox in [1, 7] and oy in [1, 7]):
            img.putpixel((CX + ox, CY + oy), BORDER_LIGHT)
        else:
            img.putpixel((CX + ox, CY + oy), (25, 30, 48))
img.putpixel((CX + 4, CY + 4), ACCENT_GOLD)  # center
img.putpixel((CX + 4, CY + 2), ACCENT_GOLD)  # 12 o'clock
img.putpixel((CX + 6, CY + 4), ACCENT_GOLD)  # 3 o'clock

# Checkmark icon (x: 55, y: 34)
KX, KY = 55, 34
check_pixels = [
    (0, 4), (1, 5), (2, 6), (3, 5), (4, 4), (5, 3), (6, 2), (7, 1)
]
for ox, oy in check_pixels:
    img.putpixel((KX + ox, KY + oy), ACCENT_GREEN)
    img.putpixel((KX + ox, KY + oy + 1), (50, 150, 80))

# -------------------------------------------------------------
# 5x7 Pixel Font Engine
# -------------------------------------------------------------
PIXEL_FONT = {
    'A': ["01110","10001","11111","10001","10001"],
    'B': ["11110","10001","11110","10001","11110"],
    'C': ["01111","10000","10000","10000","01111"],
    'D': ["11110","10001","10001","10001","11110"],
    'E': ["11111","10000","11110","10000","11111"],
    'F': ["11111","10000","11110","10000","10000"],
    'G': ["01111","10000","10111","10001","01110"],
    'H': ["10001","10001","11111","10001","10001"],
    'I': ["11111","00100","00100","00100","11111"],
    'J': ["00001","00001","00001","10001","01110"],
    'K': ["10001","10010","11100","10010","10001"],
    'L': ["10000","10000","10000","10000","11111"],
    'M': ["10001","11011","10101","10001","10001"],
    'N': ["10001","11001","10101","10011","10001"],
    'O': ["01110","10001","10001","10001","01110"],
    'P': ["11110","10001","11110","10000","10000"],
    'Q': ["01110","10001","10001","10011","01111"],
    'R': ["11110","10001","11110","10010","10001"],
    'S': ["01111","10000","01110","00001","11110"],
    'T': ["11111","00100","00100","00100","00100"],
    'U': ["10001","10001","10001","10001","01110"],
    'V': ["10001","10001","10001","01010","00100"],
    'W': ["10001","10001","10101","11011","10001"],
    'X': ["10001","01010","00100","01010","10001"],
    'Y': ["10001","01010","00100","00100","00100"],
    'Z': ["11111","00010","00100","01000","11111"],
    ' ': ["00000","00000","00000","00000","00000"],
    '-': ["00000","00000","11111","00000","00000"],
    '.': ["00000","00000","00000","00000","00100"],
    ':': ["00000","00100","00000","00100","00000"],
    '*': ["00000","01010","00100","01010","00000"],
    '/': ["00001","00010","00100","01000","10000"],
    '1': ["00100","01100","00100","00100","01110"],
    '0': ["01110","10001","10001","10001","01110"],
}

def draw_pixel_text(img, text, start_x, start_y, color, shadow_color=None, scale=1, letter_spacing=1):
    curr_x = start_x
    for ch in text.upper():
        glyph = PIXEL_FONT.get(ch, PIXEL_FONT[' '])
        for r_idx, row in enumerate(glyph):
            for c_idx, bit in enumerate(row):
                if bit == '1':
                    for sx in range(scale):
                        for sy in range(scale):
                            px = curr_x + c_idx * scale + sx
                            py = start_y + r_idx * scale + sy
                            if 0 <= px < W and 0 <= py < H:
                                if shadow_color:
                                    img.putpixel((px + 1, py + 1), shadow_color)
                                img.putpixel((px, py), color)
        curr_x += (len(glyph[0]) * scale) + letter_spacing

# Title: "DAILY LOG" (2x scale with drop shadow)
draw_pixel_text(img, "DAILY LOG", 72, 17, TEXT_WHITE, shadow_color=(20, 45, 60), scale=2, letter_spacing=3)

# Subtitle: "ANTINOTE EXTENSION" in signature Antinote Mint
draw_pixel_text(img, "ANTINOTE EXTENSION", 73, 34, ANTINOTE_MINT, scale=1, letter_spacing=1)

# Badge: "TIMELINE - TASKS - AI" in muted blue-gray
draw_pixel_text(img, "TIMELINE - TASKS - AI", 73, 44, TEXT_MUTED, scale=1, letter_spacing=1)

# Status badge on top right: "v1.0"
pill_x, pill_y = W - 32, 10
for px in range(24):
    for py in range(9):
        img.putpixel((pill_x + px, pill_y + py), (28, 32, 48))
for px in range(24):
    img.putpixel((pill_x + px, pill_y), BORDER_LIGHT)
    img.putpixel((pill_x + px, pill_y + 8), (18, 20, 30))
for py in range(9):
    img.putpixel((pill_x, pill_y + py), BORDER_LIGHT)
    img.putpixel((pill_x + 23, pill_y + py), (18, 20, 30))

draw_pixel_text(img, "v1.0", pill_x + 3, pill_y + 2, ANTINOTE_MINT, scale=1, letter_spacing=1)

# Scale up using NEAREST neighbor for crisp 16-bit pixel fidelity
scaled_img = img.resize((W * SCALE, H * SCALE), resample=Image.NEAREST)
out_path = os.path.join(os.path.dirname(__file__), "assets", "banner.png")
scaled_img.save(out_path, "PNG")
print("Saved updated banner.png with official Antinote logo:", scaled_img.size)
