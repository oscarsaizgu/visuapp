#!/usr/bin/env python3
"""Descarga fotos externas de Wikimedia Commons con su procedencia.

Solo acepta licencias libres verificables (CC0, CC BY, CC BY-SA, dominio público).
Lee content/curation/external-sources.json (qué archivo de Commons va con qué ejemplar
y para qué) y escribe content/curation/external-images.json + public/img/ext/<ejemplar>/<n>.webp.
Uso:  python3 scripts/fetch-external.py
"""
import datetime, io, json, os, re, time, urllib.error, urllib.parse, urllib.request
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {'User-Agent': 'visu-game-curacion/0.1 (uso educativo)'}
LIBRE = re.compile(r'^(CC0( 1\.0)?|CC BY(-SA)? [0-9.]+( [a-z]+)?|Public domain)$', re.I)
MAX = 1280


def get(url, binario=False):
    for intento in range(6):
        try:
            r = urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60)
            return r.read() if binario else json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            time.sleep(5 * 2 ** intento)
    raise RuntimeError(f'429 persistente: {url}')


def info(titulo):
    q = urllib.parse.urlencode({'action': 'query', 'format': 'json', 'titles': titulo, 'prop': 'imageinfo',
                                'iiprop': 'url|size|extmetadata', 'iiurlwidth': MAX})
    pg = next(iter(get('https://commons.wikimedia.org/w/api.php?' + q)['query']['pages'].values()))
    ii = pg['imageinfo'][0]
    m = ii.get('extmetadata', {})
    txt = lambda k: re.sub(r'<[^>]+>', '', m.get(k, {}).get('value', '')).strip()
    return ii, {'licencia': txt('LicenseShortName'), 'licenciaUrl': txt('LicenseUrl'),
                'autor': re.sub(r'\s+', ' ', txt('Artist'))[:160]}


def main():
    fuentes = json.load(open(os.path.join(ROOT, 'content/curation/external-sources.json')))['fotos']
    salida = []
    hoy = datetime.date.today().isoformat()
    for n, f in enumerate(fuentes):
        ii, meta = info(f['commons'])
        if not LIBRE.match(meta['licencia']):
            print('RECHAZADA (licencia no libre o no verificable):', f['commons'], meta['licencia'])
            continue
        eid = f['ejemplarId']
        num = sum(1 for s in salida if s['ejemplarId'] == eid) + 1
        rel = f'/img/ext/{eid}/{num}.webp'
        dest = os.path.join(ROOT, 'public', rel.lstrip('/'))
        if not os.path.exists(dest):
            im = Image.open(io.BytesIO(get(ii.get('thumburl') or ii['url'], binario=True))).convert('RGB')
            im.thumbnail((MAX, MAX))
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            im.save(dest, 'WEBP', quality=82)
            time.sleep(1)
        w, h = Image.open(dest).size
        salida.append({
            'id': f'{eid}-ext{num}', 'ejemplarId': eid, 'archivo': rel, 'ancho': w, 'alto': h,
            'origen': 'externa', 'marcas': f.get('marcas', []),
            'procedencia': {
                'fuente': 'Wikimedia Commons', 'url': ii['descriptionurl'], 'titulo': f['commons'],
                'autor': meta['autor'], 'licencia': meta['licencia'], 'licenciaUrl': meta['licenciaUrl'],
                'taxonFuente': f.get('taxonFuente'), 'fechaIncorporacion': f.get('fecha', hoy),
                'cambios': f'Redimensionada a {MAX} px y convertida a WebP', 'distribuible': True,
            },
        })
        print('ok', eid, meta['licencia'], '·', meta['autor'][:40])
    json.dump({'_leeme': 'Generado por scripts/fetch-external.py a partir de external-sources.json. No editar a mano.',
               'imagenes': salida}, open(os.path.join(ROOT, 'content/curation/external-images.json'), 'w'),
              ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main()
