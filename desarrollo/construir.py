"""Construye index.html a partir de desarrollo/src.html y fuente/*.js.

Uso, desde la raíz del repositorio:  python3 desarrollo/construir.py
"""
import os
raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
leer = lambda *p: open(os.path.join(raiz, *p), encoding='utf-8').read()
s = leer('desarrollo', 'src.html')
datos = '<script>\n' + leer('fuente', 'iching-es.js') + '\n</script>\n<script>\n' + leer('fuente', 'astro.js') + '\n</script>' + '\n<script>\n' + leer('fuente', 'planta.js') + '\n</script>'
s = s.replace('<!--DATOS-->', datos)
s = s.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>', '<script src="lib/three.min.js"></script>')
cab = '<!doctype html>\n<html lang="es">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
i = s.find('<canvas id="gl">')
s = cab + s[:i].replace('<meta name="claude:viewport-fit-sides" content="cover">\n', '') + '</head>\n<body>\n' + s[i:] + '\n</body>\n</html>\n'
open(os.path.join(raiz, 'index.html'), 'w', encoding='utf-8').write(s)
print('index.html listo:', len(s), 'bytes')
