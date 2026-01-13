<?php
// export.php
declare(strict_types=1);

$db = new PDO('sqlite:' . __DIR__ . '/data/tracking.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$since = $_GET['since'] ?? null;

$sql = "SELECT ts,event,path,label,dest,ref,title,sid,engaged_ms,ua,ip FROM events";
$params = [];
if ($since) { $sql .= " WHERE ts >= :since"; $params[':since'] = $since; }
$sql .= " ORDER BY ts DESC";

$stmt = $db->prepare($sql);
$stmt->execute($params);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename=\"tracking_export.csv\"');

$out = fopen('php://output', 'w');
fputcsv($out, array_keys($rows[0] ?? [
  'ts','event','path','label','dest','ref','title','sid','engaged_ms','ua','ip'
]));
foreach ($rows as $r) { fputcsv($out, $r); }
fclose($out);
