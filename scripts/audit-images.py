#!/usr/bin/env python3
"""Auditoría técnica de las fotos (solo lectura: no modifica ninguna imagen).

Mide lo que se puede medir de forma automática y lo deja en
content/audit/fotos-auditoria.json para que la curación lo use como indicio,
nunca como decisión final:

  - medidas y proporción;
  - nitidez (varianza del laplaciano sobre la foto reducida a 512 px);
  - exposición (brillo medio, contraste, % de píxeles quemados o empastados);
  - huella perceptual (pHash) para detectar duplicados, también entre ejemplares distintos;
  - texto superpuesto (palabras que tesseract lee con confianza alta), si tesseract está instalado.

Requisitos: python3 con Pillow, numpy e imagehash; tesseract es opcional.
Uso:  python3 scripts/audit-images.py [--solo id1,id2,...] [--sin-ocr]
"""
import json, os, shutil, subprocess, sys, tempfile
from concurrent.futures import ProcessPoolExecutor

import imagehash
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'content/audit/fotos-auditoria.json')
TESS = shutil.which('tesseract')


def ocr(im):
    """Palabras legibles (≥3 letras, confianza ≥80) que encuentra tesseract."""
    g = im.convert('L')
    if max(g.size) < 1400:
        f = 1400 / max(g.size)
        g = g.resize((int(g.width * f), int(g.height * f)))
    with tempfile.NamedTemporaryFile(suffix='.png') as tmp:
        g.save(tmp.name)
        r = subprocess.run([TESS, tmp.name, '-', '--psm', '11', 'tsv'],
                           capture_output=True, text=True, timeout=120,
                           env={**os.environ, 'OMP_THREAD_LIMIT': '1'})
    palabras = []
    for linea in r.stdout.splitlines()[1:]:
        c = linea.split('\t')
        if len(c) < 12:
            continue
        txt = c[11].strip()
        try:
            conf = float(c[10])
        except ValueError:
            continue
        letras = sum(ch.isalpha() for ch in txt)
        if conf >= 80 and letras >= 3 and letras >= 0.7 * len(txt):
            palabras.append(txt)
    return palabras


def medir(args):
    img, sin_ocr = args
    ruta = os.path.join(ROOT, 'public', img['archivo'].lstrip('/'))
    try:
        im = Image.open(ruta)
        im.load()
    except Exception as e:  # noqa: BLE001
        return {'id': img['id'], 'error': str(e)[:120]}
    im = im.convert('RGB')
    w, h = im.size
    peq = im.copy()
    peq.thumbnail((512, 512))
    g = np.asarray(peq.convert('L'), dtype=np.float32)
    lap = g[1:-1, 1:-1] * -4 + g[:-2, 1:-1] + g[2:, 1:-1] + g[1:-1, :-2] + g[1:-1, 2:]
    res = {
        'id': img['id'],
        'ancho': w, 'alto': h,
        'proporcion': round(w / h, 3),
        'nitidez': round(float(lap.var()), 1),
        'brillo': round(float(g.mean()), 1),
        'contraste': round(float(g.std()), 1),
        'quemado': round(float((g >= 250).mean()), 3),
        'empastado': round(float((g <= 5).mean()), 3),
        'phash': str(imagehash.phash(im)),
    }
    if TESS and not sin_ocr:
        try:
            res['texto'] = ocr(im)[:12]
        except Exception:  # noqa: BLE001
            res['texto'] = None
    return res


def main():
    solo = None
    if '--solo' in sys.argv:
        solo = set(sys.argv[sys.argv.index('--solo') + 1].split(','))
    sin_ocr = '--sin-ocr' in sys.argv
    imagenes = json.load(open(os.path.join(ROOT, 'content/base/images.json')))
    if solo:
        imagenes = [i for i in imagenes if i['ejemplarId'] in solo]
    previo = {}
    if os.path.exists(OUT):
        previo = {r['id']: r for r in json.load(open(OUT))['fotos']}
    with ProcessPoolExecutor() as ex:
        nuevos = list(ex.map(medir, [(i, sin_ocr) for i in imagenes], chunksize=8))
    for r in nuevos:
        previo[r['id']] = r
    fotos = sorted(previo.values(), key=lambda r: r['id'])

    # Duplicados por pHash (distancia ≤ 4 de 64 bits = prácticamente la misma foto).
    por_img = {i['id']: i['ejemplarId'] for i in json.load(open(os.path.join(ROOT, 'content/base/images.json')))}
    con_hash = [r for r in fotos if 'phash' in r]
    ids = [r['id'] for r in con_hash]
    bits = np.array([[int(c) for c in bin(int(r['phash'], 16))[2:].zfill(64)] for r in con_hash], dtype=np.uint8)
    dup = []
    for a in range(len(ids)):
        dist = (bits[a + 1:] != bits[a]).sum(axis=1)
        for k in np.nonzero(dist <= 4)[0]:
            b = a + 1 + int(k)
            dup.append({'a': ids[a], 'b': ids[b], 'distancia': int(dist[k]),
                        'mismoEjemplar': por_img.get(ids[a]) == por_img.get(ids[b])})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    json.dump({'_leeme': 'Generado por scripts/audit-images.py. Indicios automáticos, no decisiones.',
               'ocr': bool(TESS and not sin_ocr), 'fotos': fotos, 'duplicados': dup},
              open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
    print(f'fotos medidas: {len(nuevos)} · total en auditoría: {len(fotos)} · '
          f'duplicados: {len(dup)} ({sum(not d["mismoEjemplar"] for d in dup)} entre ejemplares distintos)')


if __name__ == '__main__':
    main()
