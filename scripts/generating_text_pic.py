from PIL import Image, ImageDraw, ImageFont
import os

WORDS_FILE = "words.txt"          # one word per line
FONT_PATH = "Arial.ttf"
FONT_SIZE = 128
IMG_SIZE = (512, 256)
BG_COLOR = "white"
TEXT_COLOR = "black"
OUT_DIR = "../../../../shared/database/words_picture"

os.makedirs(OUT_DIR, exist_ok=True)
font = ImageFont.truetype(FONT_PATH, FONT_SIZE)

count = 0

print("Generating images...")

with open(WORDS_FILE) as f:
    for line in f:
        word = line.strip()
        if not word:
            continue

        img = Image.new("RGB", IMG_SIZE, BG_COLOR)
        draw = ImageDraw.Draw(img)

        bbox = draw.textbbox((0, 0), word, font=font)
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]

        x = (IMG_SIZE[0] - w) // 2
        y = (IMG_SIZE[1] - h) // 2

        draw.text((x, y), word, fill=TEXT_COLOR, font=font)
        img.save(os.path.join(OUT_DIR, f"{word}.png"))
        count += 1

print(count, " images generated.")
