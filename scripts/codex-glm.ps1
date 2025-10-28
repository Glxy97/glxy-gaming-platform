#!/usr/bin/env pwsh
# Wrapper: Codex via OpenRouter (Default: z-ai/glm-4.5-air:free)

if (-not $env:OPENROUTER_API_KEY) {
  Write-Host 'OPENROUTER_API_KEY ist nicht gesetzt.' -ForegroundColor Yellow
  Write-Host 'Bitte setzen: $env:OPENROUTER_API_KEY = "<dein_key>"'
  exit 1
}

$hasModel = $false
for ($i=0; $i -lt $args.Length; $i++) {
  $a = $args[$i]
  if ($a -eq '-m' -or $a -eq '--model' -or $a -like '--model=*') { $hasModel = $true; break }
}

$cmdArgs = @('-c','model_provider=openrouter')
if (-not $hasModel) { $cmdArgs += @('-m','z-ai/glm-4.5-air:free') }
$cmdArgs += $args

& codex @cmdArgs
exit $LASTEXITCODE

