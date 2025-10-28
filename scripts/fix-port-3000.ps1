# ============================================
# Fix Port 3000 - Windows Hyper-V Reserved Ports
# ============================================
# WICHTIG: Als Administrator ausführen!

Write-Host "=== AKTUELLER STATUS ===" -ForegroundColor Cyan
netsh int ipv4 show dynamicport tcp
netsh int ipv4 show excludedportrange protocol=tcp

Write-Host "`n=== SETZE NEUE DYNAMIC PORT RANGE ===" -ForegroundColor Yellow
Write-Host "Port 3000 wird aus Reserved Range entfernt..." -ForegroundColor Yellow

# Setze Dynamic Port Range außerhalb von 3000
netsh int ipv4 set dynamicport tcp start=49152 num=16384
netsh int ipv6 set dynamicport tcp start=49152 num=16384

Write-Host "`n=== NEUER STATUS ===" -ForegroundColor Green
netsh int ipv4 show dynamicport tcp

Write-Host "`n⚠️  WICHTIG: System-NEUSTART erforderlich!" -ForegroundColor Red
Write-Host "Nach Neustart sollte Port 3000 verfügbar sein." -ForegroundColor Green

# Optional: Sofort neu starten?
$restart = Read-Host "`nJetzt neu starten? (j/n)"
if ($restart -eq "j") {
    Write-Host "System wird in 10 Sekunden neu gestartet..." -ForegroundColor Red
    shutdown /r /t 10
}
