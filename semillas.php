<?php
/* Endeles · semillas.php — el semillero de Xinas
   GET  → la lista de semillas sembradas: {"semillas":[{"s":"CÓDIGO","t":MINUTO,"en":UNIX}, …]}
   POST → siembra una semilla. Cuerpo JSON {"s":"CÓDIGO","t":MINUTO} (o formulario s=…&t=…).

   Solo se guarda el número de la semilla (13 caracteres), su minuto y la fecha de siembra.
   No se guarda el retrato, ni el nombre, ni la IP. Para frenar abusos se lleva una cuenta
   breve por huella (hash de IP + sal) que se borra sola cada hora.

   La carpeta datos/ debe poder escribirla PHP y está cerrada al público con su .htaccess.
   Colección Alchemy of Meaning · Héctor Cruz Juárez · GPL-3.0 */

/* Xinas vive en hectorcruz.com.mx y Endeles en su subdominio: se permite sembrar desde cualquier *.hectorcruz.com.mx */
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
if (preg_match('#^https://([a-z0-9-]+\.)*hectorcruz\.com\.mx$#i', $origen)) {
  header('Access-Control-Allow-Origin: ' . $origen);
  header('Vary: Origin');
  header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type');
  header('Access-Control-Max-Age: 86400');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

const MAX_SEMILLAS = 20000;     // tope del semillero
const MAX_POR_HORA = 20;        // siembras por huella y hora

$dir = __DIR__ . '/datos';
$arch = $dir . '/semillas.json';
$cuenta = $dir . '/cuenta.json';
$salArch = $dir . '/sal.txt';

function responder($code, $data){ http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function leer($f, $def){ if (!is_file($f)) return $def; $j = json_decode((string)@file_get_contents($f), true); return is_array($j) ? $j : $def; }

if (!is_dir($dir) && !@mkdir($dir, 0755, true)) responder(500, ['ok' => false, 'error' => 'no se pudo crear la carpeta datos']);
if (!is_file($dir . '/.htaccess')) @file_put_contents($dir . '/.htaccess', "<IfModule mod_authz_core.c>\n  Require all denied\n</IfModule>\n<IfModule !mod_authz_core.c>\n  Deny from all\n</IfModule>\n");

if ($_SERVER['REQUEST_METHOD'] === 'GET'){
  $L = leer($arch, ['semillas' => []]);
  responder(200, ['semillas' => array_values($L['semillas'] ?? [])]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') responder(405, ['ok' => false, 'error' => 'método no permitido']);

/* entrada */
$raw = file_get_contents('php://input');
$in = json_decode($raw ?: '', true);
if (!is_array($in)) $in = $_POST;
$s = strtoupper(trim((string)($in['s'] ?? '')));
$t = $in['t'] ?? null;
if (!preg_match('/^[0-9A-HJKMNP-TV-Z]{13}$/', $s)) responder(400, ['ok' => false, 'error' => 'código inválido']);
if (!is_numeric($t)) responder(400, ['ok' => false, 'error' => 'minuto inválido']);
$t = (int)$t;
$ahora = (int)floor((time() - 1767225600) / 60);   // minutos desde 2026-01-01 UTC
if ($t < 0 || $t > $ahora + 1440) responder(400, ['ok' => false, 'error' => 'minuto fuera de rango']);

/* límite por huella, sin guardar la IP */
if (!is_file($salArch)) @file_put_contents($salArch, bin2hex(random_bytes(16)));
$sal = (string)@file_get_contents($salArch);
$huella = substr(hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . $sal), 0, 16);
$hora = (int)floor(time() / 3600);

$fp = fopen($arch . '.lock', 'c');
if (!$fp || !flock($fp, LOCK_EX)) responder(503, ['ok' => false, 'error' => 'intenta de nuevo']);

$C = leer($cuenta, ['hora' => $hora, 'n' => []]);
if (($C['hora'] ?? 0) !== $hora) $C = ['hora' => $hora, 'n' => []];
$C['n'][$huella] = ($C['n'][$huella] ?? 0) + 1;
if ($C['n'][$huella] > MAX_POR_HORA){ flock($fp, LOCK_UN); responder(429, ['ok' => false, 'error' => 'demasiadas siembras; vuelve en un rato']); }
@file_put_contents($cuenta, json_encode($C));

/* sembrar (una vez por código) */
$L = leer($arch, ['semillas' => []]);
$lista = $L['semillas'] ?? [];
$ya = false;
foreach ($lista as $x) if (($x['s'] ?? '') === $s){ $ya = true; break; }
if (!$ya){
  if (count($lista) >= MAX_SEMILLAS){ flock($fp, LOCK_UN); responder(507, ['ok' => false, 'error' => 'el semillero está lleno']); }
  $lista[] = ['s' => $s, 't' => $t, 'en' => time()];
  $tmp = $arch . '.tmp';
  if (@file_put_contents($tmp, json_encode(['semillas' => $lista], JSON_UNESCAPED_SLASHES)) === false || !@rename($tmp, $arch)){
    flock($fp, LOCK_UN); responder(500, ['ok' => false, 'error' => 'no se pudo guardar']);
  }
}
flock($fp, LOCK_UN); fclose($fp);
responder(200, ['ok' => true, 'nueva' => !$ya, 'n' => count($lista), 'orden' => array_search($s, array_column($lista, 's'))]);
