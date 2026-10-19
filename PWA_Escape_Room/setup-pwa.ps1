$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$htmlPath = Join-Path $root 'desafio-chaves.html'
$manifestPath = Join-Path $root 'manifest.webmanifest'
$icon192 = Join-Path $root 'icons\icon-192.png'
$icon512 = Join-Path $root 'icons\icon-512.png'

if (-not (Test-Path $htmlPath)) {
  Write-Host 'ERRO: nao encontrei desafio-chaves.html nesta pasta.' -ForegroundColor Red
  Write-Host 'Extraia estes arquivos na mesma pasta onde esta o HTML do jogo.'
  exit 1
}
foreach ($required in @($manifestPath, $icon192, $icon512)) {
  if (-not (Test-Path $required)) {
    Write-Host "ERRO: arquivo necessario ausente: $required" -ForegroundColor Red
    exit 1
  }
}

$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8
if ($html -match '(?i)<link\s+[^>]*rel=["'']manifest["'']') {
  Write-Host 'O HTML ja referencia um manifesto; nenhuma referencia duplicada foi adicionada.' -ForegroundColor Yellow
} else {
  $newLinks = "`r`n  <link rel=`"manifest`" href=`"./manifest.webmanifest`">`r`n  <link rel=`"apple-touch-icon`" href=`"./icons/icon-192.png`">"
  $themeTag = '  <meta name="theme-color" content="#010601">'
  if ($html.Contains($themeTag)) {
    $html = $html.Replace($themeTag, $themeTag + $newLinks)
  } elseif ($html -match '(?i)</head>') {
    $html = ([regex]::new('(?i)</head>')).Replace($html, ($newLinks + "`r`n</head>"), 1)
  } else {
    Write-Host 'ERRO: nao encontrei o fechamento de <head>; o HTML nao foi alterado.' -ForegroundColor Red
    exit 1
  }

  $backupPath = "$htmlPath.backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
  Copy-Item -LiteralPath $htmlPath -Destination $backupPath
  Set-Content -LiteralPath $htmlPath -Value $html -Encoding UTF8
  Write-Host "HTML atualizado. Backup salvo em: $backupPath" -ForegroundColor Green
}

try {
  $null = Get-Content -LiteralPath $manifestPath -Raw -Encoding UTF8 | ConvertFrom-Json
} catch {
  Write-Host 'ERRO: o manifesto nao passou na validacao JSON.' -ForegroundColor Red
  exit 1
}
Write-Host ''
Write-Host 'PWA configurado localmente!' -ForegroundColor Green
Write-Host 'Arquivos: manifest.webmanifest, icons/icon-192.png, icons/icon-512.png'
Write-Host 'Proximo passo: publique/mande commit desses arquivos no GitHub e aguarde o Pages atualizar.'
Write-Host 'Depois, abra o site no Chrome Android > menu ⋮ > Instalar app.'
