"""Bangun js/illustrations.js dari piktogram dan ilustrasi di bawah. Jalankan: python3 tools/build_illus.py js/illustrations.js"""
import json, math, sys

# ---------- Piktogram 24x24: stroke currentColor, class "a" = isian aksen transparan ----------
BABY = '<circle cx="11" cy="13" r="7.5"/><path d="M11 5.5c0-1.2.8-2 2-2"/>'
DROP = lambda x, y, s=1: f'<path d="M{x} {y}s{4*s} {4.4*s} {4*s} {7.2*s}a{4*s} {4*s} 0 0 1-{8*s} 0C{x-4*s} {y+4.4*s} {x} {y} {x} {y}z"/>'
P = {
  # tanda bahaya
  'blood': '<path class="a" d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  'water': '<path d="M8 3.5s3 3.3 3 5.6a3 3 0 0 1-6 0C5 6.8 8 3.5 8 3.5z"/><path class="a" d="M16 8s3 3.3 3 5.6a3 3 0 0 1-6 0C13 11.3 16 8 16 8z"/><path d="M3 20c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0 3-1.3 4.5 0 3 1.3 4.5 0"/>',
  'fetus': '<circle class="a" cx="12" cy="13" r="7"/><path d="M10.5 11a2 2 0 1 1 3.2 1.6c1.3.7 1.6 2.3.8 3.4"/><path d="M2.5 9.5 4.5 10.5M2.5 16.5 4.5 15.5M21.5 9.5 19.5 10.5M21.5 16.5 19.5 15.5"/>',
  'headache': '<circle class="a" cx="12" cy="14" r="7"/><path d="M9.5 13h.01M14.5 13h.01M9.5 17.3c1.5-1 3.5-1 5 0"/><path d="M6 4l1.5 2L9 4l1.5 2L12 4l1.5 2L15 4l1.5 2L18 4"/>',
  'seizure': '<path class="a" d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  'fever': '<path class="a" d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/><path d="M12 10v7"/><path d="M18 4c1 1-1 2 0 3s-1 2 0 3M21 4c1 1-1 2 0 3s-1 2 0 3"/>',
  'cold': '<path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9"/><path d="m9.5 4.5 2.5 2 2.5-2M9.5 19.5l2.5-2 2.5 2"/><circle class="a" cx="12" cy="12" r="2.5"/>',
  'vomit': '<circle class="a" cx="12" cy="10.5" r="7"/><path d="M9.5 9h.01M14.5 9h.01"/><path d="M9 13.5c1-1 2 1 3 0s2 1 3 0"/><path d="M12 19.5v2M9 19v1.5M15 19v1.5"/>',
  'lungs': '<path d="M12 3v8M12 9.5c-1 1-2 1-3 1M12 9.5c1 1 2 1 3 1"/><path class="a" d="M9 8C6 7 4 11.5 4 15.5 4 18.5 5.5 20 7.5 20S10 18.5 10 16v-5"/><path class="a" d="M15 8c3-1 5 3.5 5 7.5 0 3-1.5 4.5-3.5 4.5S14 18.5 14 16v-5"/>',
  'smell': '<path class="a" d="M9 6s4 4.3 4 7.3a4 4 0 0 1-8 0C5 10.3 9 6 9 6z"/><path d="M16 4.5c1.5 1.5-1.5 3 0 4.5s-1.5 3 0 4.5M20 6.5c1.5 1.5-1.5 3 0 4.5s-1.5 3 0 4.5"/>',
  'breast': '<circle class="a" cx="12" cy="14" r="7"/><circle cx="12" cy="15" r="2"/><path d="M4.5 5.5l2 2M19.5 5.5l-2 2M12 2.5v3"/>',
  'leg': '<path d="M9 3v7c0 3-2.5 5-2.5 8.5V21H15c0-1.2-1.2-2-2.5-2l.8-5.5C14.5 11 15 9 15 7V3"/><ellipse class="a" cx="12" cy="11" rx="3.4" ry="3"/>',
  'sad': '<circle class="a" cx="12" cy="12" r="9"/><path d="M9 10h.01M15 10h.01M8.5 16.5c2-2 5-2 7 0"/><path d="M9 12.5v1.5"/>',
  'clock': '<circle class="a" cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  'contraction': '<circle class="a" cx="12" cy="12" r="9"/><path d="M5 12c1.2-2 2.5-2 3.5 0s2.3 2 3.5 0 2.3-2 3.5 0 2.3 2 3.5 0"/>',
  'nofeed': BABY + '<path d="M8.5 12h.01M13.5 12h.01"/><circle cx="11" cy="16" r="1"/><path d="M18.5 3l3.5 3.5M22 3l-3.5 3.5"/>',
  'weak': BABY + '<path d="M7.5 12h2.5M12 12h2.5M9.5 16h3"/><path d="M17.5 3h3.5l-3.5 3.5H21"/>',
  'cry': BABY + '<path d="M7.5 11.5l2 .6M14.5 11.5l-2 .6"/><path class="a" d="M9 15h4l-.6 2.2H9.6z"/><path d="M7.5 14v2M14.5 14v2"/>',
  'yellow': '<circle class="a" cx="11" cy="13" r="7.5"/><path d="M11 5.5c0-1.2.8-2 2-2M8.5 12h.01M13.5 12h.01M9 16c1.2.8 2.8.8 4 0"/><path d="M19 7l2-1M20 11h2.5M19 15l2 1"/>',
  'cord': '<circle class="a" cx="12" cy="12" r="8.5"/><path d="M12 12c0-2 2-3 3-1.5s-.5 4.5-3.2 3.7S8.6 9.8 11 8.3"/>',
  'eye': '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"/><circle class="a" cx="12" cy="12" r="3"/><path d="M7.5 19.5 6.5 22"/>',
  'diaper': '<path class="a" d="M3 6h18v3a9 9 0 0 1-18 0z"/><path d="M8 6v3.5M16 6v3.5"/>',
  'diarrhea': '<path class="a" d="M3 5h18v3a9 9 0 0 1-18 0z"/><path d="M8 5v3.5M16 5v3.5"/><path d="M8 20.5v1M12 21v1M16 20.5v1"/>',
  # persiapan
  'calendar': '<rect class="a" x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9 15.5 2 2 4-4"/>',
  'hospital': '<path class="a" d="M4 21V8l8-4.5L20 8v13"/><path d="M2 21h20"/><path d="M10 21v-4h4v4"/><path d="M12 8.5v5M9.5 11h5"/>',
  'people': '<circle class="a" cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M15 16a4.5 4.5 0 0 1 7 4"/>',
  'car': '<path class="a" d="M3 16v-4l2.2-5h13.6L21 12v4z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M3 12h18M12 8.5v2.5M10.8 9.7h2.4"/>',
  'bloodbag': '<rect x="6" y="5" width="12" height="15" rx="3"/><path class="a" d="M6 12h12v5a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z"/><path d="M12 2v3M10 8.5h4"/>',
  'card': '<rect class="a" x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 14.5h4"/>',
  'bag': '<rect class="a" x="3" y="8" width="18" height="12" rx="2.5"/><path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M3 13h18M12 12v2"/>',
  'book': '<path class="a" d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/><path d="M12 7.5v5M9.5 10h5"/>',
  'phone': '<path class="a" d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  'note': '<rect class="a" x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
  'scale': '<rect class="a" x="3" y="4" width="18" height="17" rx="3"/><path d="M8 10a4 4 0 0 1 8 0z"/><path d="M12 10 13.5 7.5"/>',
  'gauge': '<path class="a" d="M3.5 16a8.5 8.5 0 1 1 17 0z"/><path d="M12 16l4-5"/><path d="M6.5 12.5l1 .7M12 7.5v1.2M17.5 12.5l-1 .7"/>',
  'tube': '<path d="M9 3h6M10 3v14a2 2 0 0 0 4 0V3"/><path class="a" d="M10 11h4v6a2 2 0 0 1-4 0z"/><path d="M17 8.5h3M17 12h3"/>',
  'chat': '<path class="a" d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/>',
  # gizi
  'rice': '<path class="a" d="M3 11h18a9 9 0 0 1-18 0z"/><path d="M5.5 11c1-3 3.8-4.5 6.5-4.5s5.5 1.5 6.5 4.5"/><path d="M9 3.5 13 8M15 3.5 11.5 8"/>',
  'fish': '<path class="a" d="M3 12c3-4.5 9-5.5 13-2.2L21 7v10l-5-2.8C12 17.5 6 16.5 3 12z"/><circle cx="8" cy="11" r=".7"/>',
  'tofu': '<path class="a" d="M4 9l8-4 8 4v7l-8 4-8-4z"/><path d="M4 9l8 4 8-4M12 13v7"/>',
  'leaf': '<path class="a" d="M5 19C5 10 11 5 20 4c0 9-5 15-14 15z"/><path d="M5 19 14 10"/>',
  'fruit': '<path class="a" d="M12 7.5c-1.6-1.4-7-1.9-7 4.2 0 4.8 3 8.8 5 8.8 1 0 1.4-.5 2-.5s1 .5 2 .5c2 0 5-4 5-8.8 0-6.1-5.4-5.6-7-4.2z"/><path d="M12 7.5C12 5.5 13 4 15 3.5"/>',
  'glass': '<path d="M6 3h12l-1.6 17.1a1 1 0 0 1-1 .9H8.6a1 1 0 0 1-1-.9z"/><path class="a" d="M7 9h10l-1 11H8z"/>',
  'citrus': '<circle class="a" cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="6"/><path d="M12 6v12M6 12h12M7.8 7.8l8.4 8.4M16.2 7.8l-8.4 8.4"/>',
  'cup': '<path class="a" d="M4 8h13v5a6 6 0 0 1-6 6h-1a6 6 0 0 1-6-6z"/><path d="M17 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3"/>',
  'milk': '<path class="a" d="M7 9l2-4.5h6L17 9v12H7z"/><path d="M7 9h10M9 2.5h6v2H9zM10.5 14h3"/>',
  'pill': '<path class="a" d="M4.6 13.4a3.9 3.9 0 0 1 0-5.5l3.3-3.3a3.9 3.9 0 0 1 5.5 5.5l-3.3 3.3a3.9 3.9 0 0 1-5.5 0z"/><path d="m6.25 6.25 5.5 5.5"/><circle cx="17" cy="17" r="4"/><path d="M14.2 19.8l5.6-5.6"/>',
  'smoke': '<rect class="a" x="2" y="14" width="16" height="4" rx="1"/><path d="M14 14v4M20 14v4M22.5 14v4"/><path d="M19.5 11c0-2 2-2 2-4s-2-2-2-4"/>',
  'alcohol': '<path class="a" d="M10 2h4v5l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10l2-3z"/><path d="M8 13h8M8 18h8"/>',
  'meat': '<path class="a" d="M4 12c0-4 4-7 9-7 4 0 7 3 7 6 0 5-5 8-10 8-3.5 0-6-3-6-7z"/><circle cx="14" cy="10.5" r="2.5"/>',
  # kb
  'iud': '<path d="M4.5 5c2.5 2 12.5 2 15 0M12 6.5V17"/><path d="M12 17c0 2 1.2 3 2.2 4.5M12 17c0 2-1.2 3-2.2 4.5"/><circle class="a" cx="12" cy="11" r="1.8"/>',
  'implant': '<path class="a" d="M2 7.5h13a6 6 0 0 1 6 6 3 3 0 0 1-3 3H2"/><path d="M6.5 11.3h8"/><path d="M6.5 13.3h8"/>',
  'syringe': '<path d="m18 2 4 4M17 7l3-3"/><path class="a" d="M19 9 8.7 19.3a2.4 2.4 0 0 1-3.4 0l-.6-.6a2.4 2.4 0 0 1 0-3.4L15 5"/><path d="m9 11 4 4M5 19l-3 3M14 4l6 6"/>',
  'blister': '<rect x="3" y="5" width="18" height="14" rx="3"/><circle class="a" cx="8" cy="10" r="1.7"/><circle class="a" cx="12" cy="10" r="1.7"/><circle class="a" cx="16" cy="10" r="1.7"/><circle class="a" cx="8" cy="14.5" r="1.7"/><circle cx="12" cy="14.5" r="1.7"/><circle cx="16" cy="14.5" r="1.7"/>',
  'condom': '<rect class="a" x="3.5" y="3.5" width="17" height="17" rx="2.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="2.5"/>',
  'lock': '<rect class="a" x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14.5v2.5"/>',
  'calx': '<rect class="a" x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="m9.5 13 5 5M14.5 13l-5 5"/>',
  'breastfeed': '<path class="a" d="M12 3.5s6.5 6.6 6.5 11.2a6.5 6.5 0 0 1-13 0C5.5 10.1 12 3.5 12 3.5z"/><path d="M9 15a3 3 0 0 0 3 3"/>',
  'baby': BABY + '<path d="M8.5 12h.01M13.5 12h.01M8.8 15.8a3.2 3.2 0 0 0 4.4 0"/>',
  # asi & bayi
  'house': '<path class="a" d="M3 11 12 4l9 7v10H3z"/><path d="M9.5 21v-5.5h5V21"/>',
  'fridge': '<rect class="a" x="6" y="2.5" width="12" height="19" rx="2"/><path d="M6 9h12M9 5v2M9 12v3"/>',
  'hat': '<path class="a" d="M4 16a8 8 0 0 1 16 0z"/><path d="M3 16h18v3.5H3z"/><circle cx="12" cy="6" r="1.8"/>',
  'hug': '<path class="a" d="M12 20s-7.5-4.6-7.5-10.3A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/><path d="M9.5 12.5a2.5 2.5 0 0 0 5 0"/>',
  'bath': '<path class="a" d="M3 12h18v2a6 6 0 0 1-6 6H9a6 6 0 0 1-6-6z"/><path d="M6 12V6a2 2 0 0 1 4 0M7 20l-1 2M17 20l1 2"/>',
  'soap': '<rect class="a" x="7" y="9" width="10" height="12" rx="2"/><path d="M10 9V6h4v3M12 6V3.5h3.5M10 14h4"/>',
  'moon': '<path class="a" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  # imunisasi
  'liver': '<path class="a" d="M3 9.5C3 6.5 6 5 10 5h8c2 0 3 1 3 3 0 5-6 9-12 10-4 .6-6-2.5-6-8.5z"/><path d="M12 5v6"/>',
  'shield': '<path class="a" d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
  'spots': '<circle class="a" cx="12" cy="12" r="9"/><circle cx="8" cy="9" r=".9"/><circle cx="15.5" cy="8" r=".9"/><circle cx="16.5" cy="13.5" r=".9"/><circle cx="7.5" cy="14.5" r=".9"/><circle cx="12" cy="16.5" r=".9"/><circle cx="11.5" cy="11" r=".9"/>',
  'polio': '<path class="a" d="M12 3.5s4 4.4 4 7.2a4 4 0 0 1-8 0C8 7.9 12 3.5 12 3.5z"/><path d="M12 15v2M9 20h6M12 17v3"/>',
}

# ---------- Ilustrasi besar ----------
def text(x, y, s, cls='t', anchor='middle'):
    return f'<text class="{cls}" x="{x}" y="{y}" text-anchor="{anchor}">{s}</text>'

def svg(w, h, inner, label):
    return f'<svg class="illus__svg" viewBox="0 0 {w} {h}" role="img" aria-label="{label}">{inner}</svg>'

# 1) Jadwal periksa hamil: 3 trimester, 6 kunjungan, 2 dengan dokter.
def anc():
    X = lambda w: 20 + w / 40 * 300
    out = []
    segs = [(0, 12, 'Trimester 1'), (12, 28, 'Trimester 2'), (28, 40, 'Trimester 3')]
    for i, (a, b, lab) in enumerate(segs):
        op = ['', ' o2', ' o3'][i]
        out.append(f'<rect class="seg{op}" x="{X(a)+1}" y="58" width="{X(b)-X(a)-2}" height="14" rx="7"/>')
        out.append(text((X(a) + X(b)) / 2, 24, lab, 't b'))
    for w in (0, 12, 28, 40):
        out.append(text(X(w), 92, f'{w}' + (' mgg' if w == 40 else ''), 't s m'))
    visits = [(8, True), (18, False), (24, False), (31, True), (35, False), (38.5, False)]
    for n, (w, doc) in enumerate(visits, 1):
        cls = 's-ink' if doc else 's-surf s-stroke'
        out.append(f'<circle class="{cls}" cx="{X(w)}" cy="44" r="10"/>')
        out.append(f'<path class="s-line" d="M{X(w)} 54v4"/>')
        out.append(text(X(w), 48, n, 't b ' + ('inv' if doc else 'ink')))
    out.append('<circle class="s-ink" cx="30" cy="118" r="7"/>' + text(44, 122, 'Dengan dokter (termasuk USG)', 't s', 'start'))
    out.append('<circle class="s-surf s-stroke" cx="30" cy="140" r="7"/>' + text(44, 144, 'Dengan bidan atau dokter', 't s', 'start'))
    return svg(340, 156, ''.join(out), 'Jadwal minimal 6 kali periksa hamil: 1 kali di trimester 1, 2 kali di trimester 2, 3 kali di trimester 3; 2 di antaranya dengan dokter.')

# 2) Isi Piringku.
def plate():
    cx, cy, r = 100, 100, 74
    def sector(a1, a2, cls):
        p = lambda a: (cx + r * math.cos(math.radians(a)), cy + r * math.sin(math.radians(a)))
        (x1, y1), (x2, y2) = p(a1), p(a2)
        large = 1 if a2 - a1 > 180 else 0
        return f'<path class="{cls}" d="M{cx} {cy}L{x1:.1f} {y1:.1f}A{r} {r} 0 {large} 1 {x2:.1f} {y2:.1f}z"/>'
    out = [f'<circle class="s-surf s-stroke2" cx="{cx}" cy="{cy}" r="90"/>']
    out += [sector(-90, 30, 'f-veg'), sector(30, 90, 'f-fruit'), sector(90, 150, 'f-prot'), sector(150, 270, 'f-carb')]
    out.append(f'<path class="s-sep" d="M{cx} {cy-r}V{cy+r}M{cx} {cy}L{cx+r*math.cos(math.radians(30)):.1f} {cy+r*math.sin(math.radians(30)):.1f}M{cx} {cy}L{cx+r*math.cos(math.radians(150)):.1f} {cy+r*math.sin(math.radians(150)):.1f}"/>')
    # isian sederhana
    out.append('<g class="s-deco">'
               '<path d="M120 62c10-14 26-14 30-4-10 8-22 10-30 4z"/><path d="M128 88c10-12 24-10 26-2-9 7-19 8-26 2z"/><path d="M112 82c4-12 14-16 22-12-4 9-12 13-22 12z"/>'
               '<circle cx="112" cy="140" r="9"/><circle cx="128" cy="130" r="7"/>'
               '<path d="M58 128c8-8 20-8 26 0-6 8-18 8-26 0z"/><path d="M84 128l6-4v8z"/>'
               '<ellipse cx="62" cy="70" rx="3" ry="5"/><ellipse cx="72" cy="62" rx="3" ry="5"/><ellipse cx="80" cy="76" rx="3" ry="5"/><ellipse cx="66" cy="86" rx="3" ry="5"/><ellipse cx="52" cy="80" rx="3" ry="5"/><ellipse cx="84" cy="58" rx="3" ry="5"/><ellipse cx="76" cy="92" rx="3" ry="5"/>'
               '</g>')
    items = [('f-carb', 'Makanan pokok', '⅓ piring'), ('f-prot', 'Lauk-pauk', '⅙ piring'),
             ('f-veg', 'Sayur', '⅓ piring'), ('f-fruit', 'Buah', '⅙ piring')]
    for i, (c, a, b) in enumerate(items):
        y = 44 + i * 38
        out.append(f'<rect class="{c}" x="210" y="{y-12}" width="16" height="16" rx="4"/>')
        out.append(text(234, y, a, 't b', 'start') + text(234, y + 16, b, 't s m', 'start'))
    return svg(340, 200, ''.join(out), 'Isi Piringku: setengah piring sayur dan buah, setengah piring makanan pokok dan lauk-pauk.')

# 3) Pelekatan menyusui: benar vs salah (tampak samping, skematis).
def latch():
    def panel(ox, ok):
        g = [f'<g transform="translate({ox} 0)">']
        g.append('<path class="s-skin s-outline" d="M0 22C55 30 80 64 74 92c-4 26-30 54-74 60z"/>')
        g.append('<path class="s-areola" d="M62 72c8 6 12 13 12 20s-4 14-12 20c-3-6-4-13-4-20s1-14 4-20z"/>')
        if ok:
            hx, hy = 120, 92
            g.append(f'<circle class="s-skin s-outline" cx="{hx}" cy="{hy}" r="38"/>')
            g.append('<path class="s-mouth" d="M88 70 56 66 54 118 88 110z"/>')
            g.append('<path class="s-lip" d="M88 70 57 65M88 110 60 117c-4 1-6-1-5-3"/>')
            g.append('<circle class="s-inkfill" cx="112" cy="78" r="2.6"/><path class="s-line2" d="M134 84c6 2 8 10 3 14"/>')
        else:
            hx, hy = 136, 96
            g.append(f'<circle class="s-skin s-outline" cx="{hx}" cy="{hy}" r="38"/>')
            g.append('<path class="s-mouth" d="M100 88 76 90 76 96 100 100z"/>')
            g.append('<path class="s-lip" d="M100 88 76 90M100 100 76 96"/>')
            g.append('<circle class="s-inkfill" cx="128" cy="82" r="2.6"/><path class="s-line2" d="M150 88c6 2 8 10 3 14"/>')
        badge = ('s-okfill', 'M-5 0l3.5 3.5L5-3.5') if ok else ('s-nofill', 'M-4-4l8 8M4-4l-8 8')
        g.append(f'<g transform="translate(150 30)"><circle class="{badge[0]}" r="13"/><path class="s-white" d="{badge[1]}"/></g>')
        g.append(text(80, 178, 'Benar' if ok else 'Salah', 't b ' + ('okc' if ok else 'noc')))
        g.append(text(80, 196, 'Mulut lebar, areola masuk' if ok else 'Hanya puting yang diisap', 't s m'))
        g.append('</g>')
        return ''.join(g)
    return svg(340, 206, panel(4, True) + panel(176, False), 'Pelekatan benar: mulut bayi terbuka lebar dan sebagian besar areola masuk. Pelekatan salah: bayi hanya mengisap puting.')

# 4) Perawatan tali pusat.
def cord():
    out = ['<path class="s-skin s-outline" d="M44 12h112c16 0 24 12 24 28v118H20V40c0-16 8-28 24-28z"/>',
           '<path class="s-line2 thin" d="M70 40c10 6 50 6 60 0"/>',
           '<path class="s-surf s-outline" d="M18 112h164v46H18z"/>',
           '<path class="s-line2" d="M18 122h164" stroke-dasharray="5 5"/>',
           '<path class="s-cord" d="M100 98c-10 0-13-10-10-16.5s13-10 19.5-3.5c4.5 5.5 3.3 14-3.3 16.3"/>',
           '<rect class="s-inkfill" x="91" y="82" width="16" height="6" rx="3" transform="rotate(-20 99 85)"/>',
           '<path class="s-line2" d="M112 84 190 58M168 117h22"/>',
           '<circle class="s-inkfill" cx="112" cy="84" r="3"/><circle class="s-inkfill" cx="168" cy="117" r="3"/>',
           text(196, 50, 'Tali pusat', 't b', 'start'), text(196, 66, 'terbuka, bersih,', 't s', 'start'), text(196, 81, 'dan kering', 't s', 'start'),
           text(196, 113, 'Popok dilipat', 't b', 'start'), text(196, 129, 'di bawah tali pusat', 't s', 'start'),
           '<g transform="translate(205 152)"><circle class="s-nofill" r="9"/><path class="s-white" d="M-3-3l6 6M3-3l-6 6"/></g>',
           text(219, 156, 'Tanpa ramuan/bedak', 't s', 'start')]
    return svg(340, 168, ''.join(out), 'Tali pusat dibiarkan terbuka, bersih, dan kering; popok dilipat di bawah tali pusat; jangan diberi ramuan atau bedak.')

# 5) Posisi tidur aman.
def sleep():
    out = ['<path class="s-line2" d="M8 30v112M200 30v112M8 40h192M8 142h192"/>',
           ''.join(f'<path class="s-line2 thin" d="M{x} 40v62"/>' for x in range(28, 200, 20)),
           '<rect class="s-tint" x="10" y="106" width="188" height="22" rx="4"/>',
           '<path class="s-line2" d="M168 92h22M168 100l20 4"/>',
           '<rect class="s-skin s-outline" x="72" y="78" width="104" height="28" rx="14"/>',
           '<circle class="s-skin s-outline" cx="50" cy="84" r="22"/>',
           '<path class="s-line2" d="M40 70c0-6 5-9 11-9"/><path class="s-line2" d="M56 66l3-4"/>',
           '<circle class="s-inkfill" cx="44" cy="80" r="2"/><path class="s-line2" d="M38 90c3 3 7 3 10 1"/>',
           text(272, 30, 'Tidur telentang', 't b'), text(272, 46, 'di kasur rata', 't s'),
           '<g transform="translate(244 86) scale(1.25)"><rect class="s-surf s-outline" x="-18" y="-10" width="36" height="20" rx="8"/><circle class="s-nofill" cx="16" cy="-10" r="8"/><path class="s-white" d="M13.5-12.5l5 5M18.5-12.5l-5 5"/></g>',
           '<g transform="translate(302 90) scale(1.25)"><circle class="s-surf s-outline" cx="0" cy="-2" r="10"/><circle class="s-surf s-outline" cx="-7" cy="-11" r="4"/><circle class="s-surf s-outline" cx="7" cy="-11" r="4"/><circle class="s-nofill" cx="13" cy="-11" r="8"/><path class="s-white" d="M10.5-13.5l5 5M15.5-13.5l-5 5"/></g>',
           text(272, 134, 'Tanpa bantal &amp; boneka', 't s')]
    return svg(340, 150, ''.join(out), 'Bayi tidur telentang di kasur yang rata, tanpa bantal dan boneka di sekitarnya.')

ILLUS = {'anc': anc(), 'plate': plate(), 'latch': latch(), 'cord': cord(), 'sleep': sleep()}

js = ('// Gambar untuk isi materi, digambar sebagai SVG agar ringan, tajam, dan ikut mode gelap.\n'
      '// PICTO: piktogram 24x24 (dipakai lewat atribut data-ico). ILLUS: ilustrasi besar (lewat <figure data-illus>).\n'
      '// Berkas ini dihasilkan oleh tools/build_illus.py (jangan diedit langsung); warna diatur lewat kelas di css/app.css.\n'
      'window.PICTO = {\n' + ''.join(f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},\n' for k, v in P.items()) + '};\n'
      'window.ILLUS = {\n' + ''.join(f'  {json.dumps(k)}: {json.dumps(v, ensure_ascii=False)},\n' for k, v in ILLUS.items()) + '};\n')
open(sys.argv[1], 'w', encoding='utf-8').write(js)
print(len(js.encode()), 'bytes', len(P), 'picto', len(ILLUS), 'illus')
