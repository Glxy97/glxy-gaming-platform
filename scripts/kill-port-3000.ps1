# Kill process on port 3000
$port = 3000
$processId = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess

if ($processId) {
    Write-Host "Killing process $processId on port $port"
    Stop-Process -Id $processId -Force
    Write-Host "✅ Port $port is now free"
} else {
    Write-Host "No process found on port $port"
}
