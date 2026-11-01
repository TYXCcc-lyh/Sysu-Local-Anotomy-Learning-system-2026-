import sys
from PIL import Image, ImageDraw

def create_app_icon(output_path):
    size = 256
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Background rounded rectangle (Shield/Plate)
    # Deep blue to teal theme
    pad = 12
    radius = 48
    draw.rounded_rectangle(
        [pad, pad, size - pad, size - pad],
        radius=radius,
        fill=(26, 86, 219, 255), # SYSU medical blue #1a56db
        outline=(255, 255, 255, 220),
        width=6
    )

    # Inner subtle glow/gradient band
    inner_pad = 22
    draw.rounded_rectangle(
        [inner_pad, inner_pad, size - inner_pad, size - inner_pad],
        radius=radius - 6,
        fill=None,
        outline=(13, 148, 136, 180), # Teal
        width=3
    )

    # 2. Central Medical Cross / Anatomy Book Motif
    cx, cy = size // 2, size // 2

    # Draw stylized Medical Cross with rounded edges
    cross_w = 40
    cross_h = 130
    c_r = 14

    # Vertical bar
    draw.rounded_rectangle(
        [cx - cross_w // 2, cy - cross_h // 2, cx + cross_w // 2, cy + cross_h // 2],
        radius=c_r,
        fill=(255, 255, 255, 250)
    )
    # Horizontal bar
    draw.rounded_rectangle(
        [cx - cross_h // 2, cy - cross_w // 2, cx + cross_h // 2, cy + cross_w // 2],
        radius=c_r,
        fill=(255, 255, 255, 250)
    )

    # Draw golden center emblem (Caduceus / Stethoscope pulse / Core star)
    star_r = 22
    draw.rounded_rectangle(
        [cx - star_r, cy - star_r, cx + star_r, cy + star_r],
        radius=8,
        fill=(13, 148, 136, 255), # Teal center
        outline=(245, 158, 11, 255), # Golden amber outline
        width=4
    )

    # White inner dot
    draw.ellipse(
        [cx - 7, cy - 7, cx + 7, cy + 7],
        fill=(255, 255, 255, 255)
    )

    # Save as multi-size ICO
    icon_sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    img.save(output_path, format='ICO', sizes=icon_sizes)
    print(f"Generated multi-res icon at: {output_path}")

if __name__ == '__main__':
    create_app_icon('d:/Desktop/万能工作间/局部解剖学交互式学习系统/app.ico')
