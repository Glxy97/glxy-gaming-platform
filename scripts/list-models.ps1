#!/usr/bin/env pwsh
# Listet verfügbare Modelle je Provider, sofern API-Keys gesetzt sind.
# Nutzung:
#   .\list-models.ps1               # alle Provider prüfen
#   .\list-models.ps1 -Provider openrouter,anthropic  # Auswahl

param(
  [string[]] $Provider
)

function Write-Section($title) {
  Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

function Try-Call($scriptBlock, $onError) {
  try { & $scriptBlock } catch { & $onError $_ }
}

$targets = @()
if (-not $Provider -or $Provider.Count -eq 0) {
  $targets = @('openrouter','gemini','google','anthropic','xai','perplexity')
} else {
  $targets = $Provider | ForEach-Object { $_.ToLower() }
}

# Deduplicate and normalize gemini/google alias
$targets = $targets | ForEach-Object { if ($_ -eq 'google') { 'gemini' } else { $_ } } | Select-Object -Unique

# OpenRouter
if ($targets -contains 'openrouter') {
  Write-Section 'OpenRouter'
  if (-not $env:OPENROUTER_API_KEY) {
    Write-Host 'OPENROUTER_API_KEY nicht gesetzt – überspringe.' -ForegroundColor Yellow
  } else {
    Try-Call {
      $resp = Invoke-RestMethod -Headers @{ Authorization = "Bearer $env:OPENROUTER_API_KEY" } -Uri 'https://openrouter.ai/api/v1/models' -Method Get -TimeoutSec 30
      $ids = @()
      if ($resp -and $resp.data) { $ids = $resp.data | ForEach-Object { $_.id } | Sort-Object }
      if ($ids.Count -gt 0) {
        Write-Host "Modelle (Auszug):" -ForegroundColor Green
        $ids | Select-Object -First 50 | ForEach-Object { Write-Host " - $_" }
      } else {
        Write-Host 'Keine Modelle erhalten (leere Antwort).'
      }
    } {
      param($e)
      Write-Host ("Fehler beim Abruf: {0}" -f $e.Exception.Message) -ForegroundColor Yellow
      Write-Host 'Top‑Empfehlungen (Beispiele):'
      ' - anthropic/claude-3.5-sonnet'
      ' - google/gemini-1.5-pro'
      ' - xai/grok-2'
      ' - perplexity/llama-3.1-sonar-large' | ForEach-Object { Write-Host $_ }
    }
  }
}

# Gemini (Google)
if ($targets -contains 'gemini') {
  Write-Section 'Gemini (Google)'
  if (-not $env:GEMINI_API_KEY -and -not $env:GOOGLE_API_KEY) {
    Write-Host 'GEMINI_API_KEY/GOOGLE_API_KEY nicht gesetzt – überspringe.' -ForegroundColor Yellow
  } else {
    $key = if ($env:GEMINI_API_KEY) { $env:GEMINI_API_KEY } else { $env:GOOGLE_API_KEY }
    Try-Call {
      $resp = Invoke-RestMethod -Uri ("https://generativelanguage.googleapis.com/v1/models?key={0}" -f $key) -Method Get -TimeoutSec 30
      $names = @()
      if ($resp -and $resp.models) { $names = $resp.models | ForEach-Object { $_.name } | Sort-Object }
      if ($names.Count -gt 0) {
        Write-Host 'Modelle (Auszug):' -ForegroundColor Green
        $names | Select-Object -First 50 | ForEach-Object { Write-Host " - $_" }
      } else {
        Write-Host 'Keine Modelle erhalten (leere Antwort).'
      }
    } {
      param($e)
      Write-Host ("Fehler beim Abruf: {0}" -f $e.Exception.Message) -ForegroundColor Yellow
      Write-Host 'Top‑Empfehlungen (Beispiele):'
      ' - gemini-1.5-pro'
      ' - gemini-1.5-flash' | ForEach-Object { Write-Host $_ }
    }
  }
}

# Anthropic
if ($targets -contains 'anthropic') {
  Write-Section 'Anthropic'
  if (-not $env:ANTHROPIC_API_KEY) {
    Write-Host 'ANTHROPIC_API_KEY nicht gesetzt – überspringe.' -ForegroundColor Yellow
  } else {
    Try-Call {
      $h = @{ 'x-api-key' = $env:ANTHROPIC_API_KEY; 'anthropic-version' = '2023-06-01' }
      $resp = Invoke-RestMethod -Headers $h -Uri 'https://api.anthropic.com/v1/models' -Method Get -TimeoutSec 30
      $ids = @()
      if ($resp -and $resp.data) { $ids = $resp.data | ForEach-Object { $_.id } | Sort-Object }
      if ($ids.Count -gt 0) {
        Write-Host 'Modelle (Auszug):' -ForegroundColor Green
        $ids | Select-Object -First 50 | ForEach-Object { Write-Host " - $_" }
      } else {
        Write-Host 'Keine Modelle erhalten (leere Antwort).'
      }
    } {
      param($e)
      Write-Host ("Fehler beim Abruf: {0}" -f $e.Exception.Message) -ForegroundColor Yellow
      Write-Host 'Top‑Empfehlungen (Beispiele):'
      ' - claude-3.5-sonnet'
      ' - claude-3.5-haiku' | ForEach-Object { Write-Host $_ }
    }
  }
}

# xAI
if ($targets -contains 'xai') {
  Write-Section 'xAI'
  if (-not $env:XAI_API_KEY) {
    Write-Host 'XAI_API_KEY nicht gesetzt – überspringe.' -ForegroundColor Yellow
  } else {
    Try-Call {
      $resp = Invoke-RestMethod -Headers @{ Authorization = "Bearer $env:XAI_API_KEY" } -Uri 'https://api.x.ai/v1/models' -Method Get -TimeoutSec 30
      $ids = @()
      if ($resp -and $resp.data) { $ids = $resp.data | ForEach-Object { $_.id } | Sort-Object }
      if ($ids.Count -gt 0) {
        Write-Host 'Modelle (Auszug):' -ForegroundColor Green
        $ids | Select-Object -First 50 | ForEach-Object { Write-Host " - $_" }
      } else {
        Write-Host 'Keine Modelle erhalten (leere Antwort).'
      }
    } {
      param($e)
      Write-Host ("Fehler beim Abruf: {0}" -f $e.Exception.Message) -ForegroundColor Yellow
      Write-Host 'Top‑Empfehlungen (Beispiele):'
      ' - grok-2' | ForEach-Object { Write-Host $_ }
    }
  }
}

# Perplexity
if ($targets -contains 'perplexity') {
  Write-Section 'Perplexity'
  if (-not $env:PPLX_API_KEY) {
    Write-Host 'PPLX_API_KEY nicht gesetzt – überspringe.' -ForegroundColor Yellow
  } else {
    Try-Call {
      # Manche Accounts/Pläne haben keinen öffentlichen List‑Endpoint; versuchen und bei Fehler fallbacken
      $resp = Invoke-RestMethod -Headers @{ Authorization = "Bearer $env:PPLX_API_KEY" } -Uri 'https://api.perplexity.ai/models' -Method Get -TimeoutSec 30
      $ids = @()
      if ($resp -and $resp.data) { $ids = $resp.data | ForEach-Object { $_.id } | Sort-Object }
      elseif ($resp -and $resp.models) { $ids = $resp.models | ForEach-Object { $_.id } | Sort-Object }
      if ($ids.Count -gt 0) {
        Write-Host 'Modelle (Auszug):' -ForegroundColor Green
        $ids | Select-Object -First 50 | ForEach-Object { Write-Host " - $_" }
      } else {
        throw 'Keine Modelle erhalten (leere Antwort).'
      }
    } {
      param($e)
      Write-Host ("Fehler beim Abruf oder nicht unterstützt: {0}" -f $e.Exception.Message) -ForegroundColor Yellow
      Write-Host 'Top‑Empfehlungen (Beispiele):'
      ' - llama-3.1-sonar-large'
      ' - llama-3.1-sonar-small' | ForEach-Object { Write-Host $_ }
    }
  }
}

Write-Host "`nFertig." -ForegroundColor Cyan

