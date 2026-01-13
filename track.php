<?php
// track.php (erweitert)
declare(strict_types=1);

// 1) Eingaben
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
$allowed = ['pageview','click','engagement']; // <-- engagement erlauben

if (!is_array($data) || !in_array($data['event'] ?? '', $allowed, true)) {
  http_response_code(400);
  exit('Bad Request');
}

// 2) IP grob anonymisieren
$ip = $_SERVER['REMOTE_ADDR'] ?? '';
if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
  $parts = explode('.', $ip);
  $ip = $parts[0].'.'.$parts[1].'.0.0';
} else {
  $ip = '0.0.0.0';
}

// 3) SQLite initialisieren
$dbDir = __DIR__ . '/data';
if (!is_dir($dbDir)) { mkdir($dbDir, 0755, true); }
$db = new PDO('sqlite:' . $dbDir . '/tracking.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$db->exec("
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ts TEXT NOT NULL,
  event TEXT NOT NULL,
  path TEXT,
  label TEXT,
  dest TEXT,
  ref TEXT,
  title TEXT,
  sid TEXT,
  engaged_ms INTEGER,
  ua TEXT,
  ip TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_ts ON events(ts);
CREATE INDEX IF NOT EXISTS idx_events_event ON events(event);
CREATE INDEX IF NOT EXISTS idx_events_path ON events(path);
");

// 4) Felder aus Payload (sanft begrenzen)
$event      = substr((string)($data['event'] ?? ''), 0, 32);
$path       = substr((string)($data['path']  ?? ($_SERVER['HTTP_REFERER'] ?? '')), 0, 512);
$label      = isset($data['label']) ? substr((string)$data['label'], 0, 256) : null;
$dest       = isset($data['dest'])  ? substr((string)$data['dest'],  0, 512) : null;
$ref        = isset($data['ref'])   ? substr((string)$data['ref'],   0, 256) : null;
$title      = isset($data['title']) ? substr((string)$data['title'], 0, 256) : null;
$sid        = isset($data['sid'])   ? substr((string)$data['sid'],   0, 64)  : null;
$engaged_ms = isset($data['engaged_ms']) ? (int)$data['engaged_ms'] : null;
$ua         = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 512);

// 5) Datensatz schreiben
$stmt = $db->prepare("
  INSERT INTO events (ts,event,path,label,dest,ref,title,sid,engaged_ms,ua,ip)
  VALUES (:ts,:event,:path,:label,:dest,:ref,:title,:sid,:engaged_ms,:ua,:ip)
");
$stmt->execute([
  ':ts'         => gmdate('c'),
  ':event'      => $event,
  ':path'       => $path,
  ':label'      => $label,
  ':dest'       => $dest,
  ':ref'        => $ref,
  ':title'      => $title,
  ':sid'        => $sid,
  ':engaged_ms' => $engaged_ms,
  ':ua'         => $ua,
  ':ip'         => $ip,
]);

// 6) Antwort (same-origin reicht; CORS nur falls nötig)
header('Content-Type: application/json; charset=utf-8');
echo json_encode(['ok' => true]);
