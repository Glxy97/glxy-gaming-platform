# ============================================
# 🐋 Docker Desktop Fix - WSL2 Setup
# ============================================
# WICHTIG: Als Administrator ausführen!
# Rechtsklick auf PowerShell → "Als Administrator ausführen"

Write-Host "🔍 Checking current status..." -ForegroundColor Cyan

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit
}

Write-Host "✅ Running as Administrator" -ForegroundColor Green

# Step 1: Enable WSL
Write-Host "`n📦 Step 1: Enabling WSL (Windows Subsystem for Linux)..." -ForegroundColor Cyan
try {
    dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
    Write-Host "✅ WSL enabled" -ForegroundColor Green
} catch {
    Write-Host "⚠️ WSL may already be enabled or error occurred" -ForegroundColor Yellow
}

# Step 2: Enable Virtual Machine Platform
Write-Host "`n📦 Step 2: Enabling Virtual Machine Platform..." -ForegroundColor Cyan
try {
    dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
    Write-Host "✅ Virtual Machine Platform enabled" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Virtual Machine Platform may already be enabled or error occurred" -ForegroundColor Yellow
}

# Step 3: Check Hyper-V
Write-Host "`n📦 Step 3: Checking Hyper-V status..." -ForegroundColor Cyan
$hyperv = Get-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-All -ErrorAction SilentlyContinue
if ($hyperv -and $hyperv.State -eq "Enabled") {
    Write-Host "✅ Hyper-V is already enabled" -ForegroundColor Green
} else {
    Write-Host "ℹ️ Hyper-V not enabled (optional for Docker Desktop)" -ForegroundColor Yellow
}

# Step 4: Download WSL2 Kernel Update
Write-Host "`n📦 Step 4: WSL2 Kernel Update..." -ForegroundColor Cyan
Write-Host "Opening WSL2 Kernel Update download page..." -ForegroundColor Yellow
Start-Process "https://aka.ms/wsl2kernel"
Write-Host "Please download and install the WSL2 kernel update, then press any key to continue..." -ForegroundColor Yellow
pause

# Summary
Write-Host "`n" -NoNewline
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Windows Features Configuration Complete!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. RESTART Windows (wichtig!)" -ForegroundColor White
Write-Host "2. After restart, open PowerShell and run:" -ForegroundColor White
Write-Host "   wsl --set-default-version 2" -ForegroundColor Cyan
Write-Host "3. Start Docker Desktop" -ForegroundColor White
Write-Host "4. Run: docker-compose -f docker-compose.local.yml up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..." -ForegroundColor Yellow
pause
