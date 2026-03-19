import requests
import io
import json
import random
from PIL import Image, ImageDraw, ImageFilter

API_URL = "http://localhost:8081/verify-issue"


def create_pothole_image() -> io.BytesIO:
    """
    Creates a realistic-looking before image: dark road with an irregular pothole.
    - Dark asphalt grey background
    - Irregular dark/brown pothole crater
    - Some rough texture around the edges
    """
    width, height = 400, 400
    rng = random.Random(42)

    # Background: dark asphalt grey with slight noise
    img = Image.new('RGB', (width, height), color=(60, 60, 60))
    pixels = img.load()

    # Add asphalt texture noise
    for y in range(height):
        for x in range(width):
            n = rng.randint(-15, 15)
            r, g, b = pixels[x, y]
            pixels[x, y] = (
                max(0, min(255, r + n)),
                max(0, min(255, g + n)),
                max(0, min(255, b + n)),
            )

    draw = ImageDraw.Draw(img)

    # Draw pothole: dark crater in the center
    # Rough, irregular ellipse
    cx, cy = 200, 220
    for i in range(8):
        offset_x = rng.randint(-15, 15)
        offset_y = rng.randint(-10, 10)
        r_w = rng.randint(55, 80)
        r_h = rng.randint(40, 60)
        darkness = rng.randint(10, 35)
        draw.ellipse(
            [cx - r_w + offset_x, cy - r_h + offset_y,
             cx + r_w + offset_x, cy + r_h + offset_y],
            fill=(darkness, darkness - 5, darkness - 10)
        )

    # Add cracked edges / debris around the pothole
    for _ in range(20):
        x1 = rng.randint(100, 300)
        y1 = rng.randint(130, 310)
        x2 = x1 + rng.randint(-30, 30)
        y2 = y1 + rng.randint(-30, 30)
        draw.line([x1, y1, x2, y2], fill=(40, 35, 30), width=rng.randint(1, 3))

    # Add water/shadow in pothole
    draw.ellipse([155, 190, 245, 245], fill=(20, 20, 30))

    # Apply slight blur to make it look more photo-like
    img = img.filter(ImageFilter.GaussianBlur(radius=0.8))

    # Overlay text label
    draw2 = ImageDraw.Draw(img)
    draw2.rectangle([10, 10, 185, 35], fill=(0, 0, 0, 180))
    draw2.text((15, 14), "BEFORE: Pothole", fill=(255, 80, 80))

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=92)
    buf.seek(0)
    return buf


def create_clean_road_image() -> io.BytesIO:
    """
    Creates a realistic-looking after image: repaired, smooth, light grey road.
    - Lighter uniform asphalt surface (fresh repair)
    - No holes or cracks
    - Even texture
    """
    width, height = 400, 400
    rng = random.Random(99)

    # Background: fresh asphalt – slightly lighter and more uniform
    img = Image.new('RGB', (width, height), color=(110, 108, 105))
    pixels = img.load()

    # Mild texture noise (much less than pothole image)
    for y in range(height):
        for x in range(width):
            n = rng.randint(-8, 8)
            r, g, b = pixels[x, y]
            pixels[x, y] = (
                max(0, min(255, r + n)),
                max(0, min(255, g + n)),
                max(0, min(255, b + n)),
            )

    draw = ImageDraw.Draw(img)

    # Draw repair patch (slightly different shade to indicate fresh asphalt)
    patch_color = (125, 122, 118)
    draw.ellipse([130, 160, 275, 265], fill=patch_color)

    # Road lane markings (white dashed line)
    for y_start in range(0, height, 60):
        draw.rectangle([195, y_start, 205, y_start + 35], fill=(220, 220, 210))

    # Very smooth, no cracks
    img = img.filter(ImageFilter.GaussianBlur(radius=0.5))

    draw2 = ImageDraw.Draw(img)
    draw2.rectangle([10, 10, 195, 35], fill=(0, 0, 0, 180))
    draw2.text((15, 14), "AFTER: Road Repaired", fill=(80, 255, 80))

    buf = io.BytesIO()
    img.save(buf, format='JPEG', quality=92)
    buf.seek(0)
    return buf


def test_api():
    print("=" * 55)
    print("  Feature 3 — Issue Verification API Test")
    print("=" * 55)
    print("\nGenerating synthetic pothole & clean-road images...")

    before_img_bytes = create_pothole_image()
    after_img_bytes  = create_clean_road_image()

    print("  [OK] Before image: dark pothole with rough texture")
    print("  [OK] After  image: smooth, uniform repaired road\n")

    files = {
        'before_image': ('before_pothole.jpg', before_img_bytes, 'image/jpeg'),
        'after_image':  ('after_fixed.jpg',    after_img_bytes,  'image/jpeg'),
    }

    print(f"Sending POST request to {API_URL} ...")
    try:
        response = requests.post(API_URL, files=files, timeout=30)

        print(f"\nStatus Code: {response.status_code}")
        print("\n--- API Response ---")
        data = response.json()
        print(json.dumps(data, indent=2))

        print("\n--- Summary ---")
        if response.status_code == 200:
            resolved = data.get("resolved", False)
            confidence = data.get("confidence", 0.0)
            issue = data.get("issue_type", "unknown")
            ai_gen = data.get("ai_generated", False)

            if ai_gen:
                print("[WARNING] The after-image was flagged as AI-generated.")
            elif resolved:
                print(f"[RESOLVED] Issue '{issue}' is RESOLVED  (confidence: {confidence:.0%})")
            else:
                print(f"[NOT RESOLVED] Issue '{issue}' does not appear resolved  (confidence: {confidence:.0%})")
        else:
            print(f"API returned an error: {response.text}")

    except requests.exceptions.ConnectionError:
        print(f"\n[ERROR] Could not connect to {API_URL}.")
        print("   Make sure the FastAPI server is running:")
        print("   > uvicorn main:app --reload\n")
    except Exception as e:
        print(f"\n[ERROR] Unexpected error: {e}")


if __name__ == "__main__":
    test_api()
