"""Construye index.html a partir de desarrollo/src.html y fuente/*.js.

Uso, desde la raíz del repositorio:  python3 desarrollo/construir.py
"""
import os
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
leer = lambda *p: open(os.path.join(raiz, *p), encoding='utf-8').read()
s = leer('desarrollo', 'src.html')
import json
dic = ''.join(f"window.I18N=window.I18N||{{}};I18N.{k}={json.dumps(json.loads(leer('fuente','i18n',k+'.json')), ensure_ascii=False)};\n" for k in ('en','fr'))
idioma = '<script>\n' + dic + leer('fuente', 'idioma.js') + '\nIDIOMA.aplicar();\n</script>\n'
ichings = ''.join('<script>\n' + leer('fuente', f'iching-{k}.js') + '\n</script>\n' for k in ('en', 'fr') if os.path.exists(os.path.join(raiz, 'fuente', f'iching-{k}.js')))
elige = "<script>if(IDIOMA.L==='en'&&window.ICHING_EN)window.ICHING=window.ICHING_EN;else if(IDIOMA.L==='fr'&&window.ICHING_FR)window.ICHING=window.ICHING_FR;</script>\n"
datos = idioma + '<script>\n' + leer('fuente', 'iching-es.js') + '\n</script>\n<script>\n' + leer('fuente', 'astro.js') + '\n</script>' + '\n<script>\n' + leer('fuente', 'planta.js') + '\n</script>\n' + ichings + elige
s = s.replace('<!--DATOS-->', datos)
s = s.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', '<script src="lib/three.min.js"></script>')
cab = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover, interactive-widget=resizes-content">\n'
# app instalable: ícono, carátulas de arranque para iPhone y manifiesto
CARAS = [(1320, 2868, 440, 956, 3), (1290, 2796, 430, 932, 3), (1206, 2622, 402, 874, 3), (1179, 2556, 393, 852, 3), (1284, 2778, 428, 926, 3), (1170, 2532, 390, 844, 3), (1125, 2436, 375, 812, 3), (1242, 2688, 414, 896, 3), (828, 1792, 414, 896, 2), (750, 1334, 375, 667, 2), (1080, 2340, 360, 780, 3)]
pwa = ('<meta name="theme-color" content="#141414">\n<meta name="apple-mobile-web-app-capable" content="yes">\n'
       '<meta name="mobile-web-app-capable" content="yes">\n<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">\n'
       '<meta name="apple-mobile-web-app-title" content="Endeles">\n<link rel="manifest" href="manifest.webmanifest">\n'
       '<link rel="icon" type="image/png" sizes="32x32" href="iconos/favicon-32.png">\n<link rel="apple-touch-icon" href="iconos/apple-touch-icon.png">\n'
       + ''.join(f'<link rel="apple-touch-startup-image" media="(device-width: {dw}px) and (device-height: {dh}px) and (-webkit-device-pixel-ratio: {r}) and (orientation: portrait)" href="iconos/caratula-{w}x{h}.png">\n' for w, h, dw, dh, r in CARAS))
cab += pwa
i = s.find('<canvas id="gl">')
sw = "<script>if('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function(){});</script>"
s = cab + s[:i].replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '') + '</head>\n<body>\n' + s[i:] + '\n' + sw + '\n</body>\n</html>\n'
open(os.path.join(raiz, 'index.html'), 'w', encoding='utf-8').write(s)
print('index.html listo:', len(s), 'bytes')
