"""Buat QR code situs untuk pamflet.

Jalankan ulang bila alamat situs berubah (mis. pindah ke domain sendiri):
    pip install qrcode pillow
    python3 qr/buat_qr.py https://alamat-baru/
"""
import sys
from pathlib import Path

import qrcode
import qrcode.image.svg
from PIL import Image, ImageDraw, ImageFont

URL = sys.argv[1] if len(sys.argv) > 1 else "https://promkes.dokterdibya.com/"
OUT = Path(__file__).parent
BRAND = "#c2185b"
PURPLE = "#7b1a8c"  # ungu logo RSUD Gambiran
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans{}.ttf"


def make_qr():
    # Koreksi galat Q (~25%): tetap terbaca bila pamflet sedikit kotor/terlipat.
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_Q, box_size=1, border=4)
    qr.add_data(URL)
    qr.make(fit=True)
    return qr


def font(size, bold=False):
    try:
        return ImageFont.truetype(FONT.format("-Bold" if bold else ""), size)
    except OSError:
        return ImageFont.load_default()


def main():
    qr = make_qr()

    # SVG: vektor, tajam di ukuran cetak berapa pun.
    qr.make_image(image_factory=qrcode.image.svg.SvgPathFillImage).save(OUT / "qr-sehat-ibu.svg")

    # PNG besar polos (~2000 px) untuk ditempel di desain pamflet.
    modules = qr.modules_count + 8
    png = qr.make_image(fill_color="black", back_color="white").get_image()
    png = png.resize((modules * (2000 // modules),) * 2, Image.NEAREST).convert("RGB")
    png.save(OUT / "qr-sehat-ibu.png", dpi=(300, 300))

    # Kartu siap cetak 6 x 8 cm @300 dpi: judul, QR, ajakan pindai, dan identitas RS.
    w, h = 709, 945
    card = Image.new("RGB", (w, h), "white")
    d = ImageDraw.Draw(card)
    d.rectangle([0, 0, w, 150], fill=BRAND)
    d.text((w / 2, 55), "Sehat Ibu & Bayi", font=font(54, True), fill="white", anchor="mm")
    d.text((w / 2, 112), "Edukasi Kesehatan Ibu & Anak", font=font(30), fill="white", anchor="mm")
    # QR 500 px (~12 px/modul, ~1 mm saat cetak): tetap mudah dipindai, tanpa logo di atasnya.
    side = 500
    card.paste(png.resize((side, side), Image.NEAREST), ((w - side) // 2, 162))
    d.text((w / 2, 690), "Pindai dengan kamera HP", font=font(36, True), fill="#222", anchor="mm")
    d.text((w / 2, 735), "untuk membaca materi", font=font(30), fill="#444", anchor="mm")

    # Kaki kartu: logo resmi RSUD Gambiran (qr/logo-rsud-gambiran.jpg) + nama layanan.
    d.line([(60, 776), (w - 60, 776)], fill="#e0e0e0", width=2)
    logo_side = 130
    logo = Image.open(OUT / "logo-rsud-gambiran.jpg").convert("RGB").resize((logo_side,) * 2, Image.LANCZOS)
    mask = Image.new("L", (logo_side,) * 2, 0)
    ImageDraw.Draw(mask).ellipse([0, 0, logo_side - 1, logo_side - 1], fill=255)
    lines = [("Maternal-Neonatal Terpadu", font(31, True), "#222"),
             ("RSUD Gambiran Kota Kediri", font(28), PURPLE)]
    text_w = max(d.textlength(t, font=f) for t, f, _ in lines)
    gap = 22
    x0 = (w - (logo_side + gap + text_w)) / 2
    top = 795
    card.paste(logo, (int(x0), top), mask)
    tx = x0 + logo_side + gap
    d.text((tx, top + logo_side / 2 - 20), lines[0][0], font=lines[0][1], fill=lines[0][2], anchor="lm")
    d.text((tx, top + logo_side / 2 + 22), lines[1][0], font=lines[1][1], fill=lines[1][2], anchor="lm")
    card.save(OUT / "qr-sehat-ibu-kartu.png", dpi=(300, 300))
    print("QR untuk", URL, "->", OUT)


if __name__ == "__main__":
    main()
