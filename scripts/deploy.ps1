# ============================================
# = GLXY Gaming Platform - PowerShell Deployment
# ============================================
# Windows-Deployment-Script für lokales Testing
# Verwendung: .\deploy.ps1 [Command] [Options]

param(
    [Parameter(Position=0)]
    [string]$Command = "help",

    [Parameter(Position=1)]
    [string]$Service = "app",

    [switch]$NoBuild,
    [switch]$NoBackup,
    [switch]$Production
)

# ============================================
# CONFIGURATION
# ============================================
$ProjectName = "glxy-gaming"
$DockerComposeFile = if ($Production) { "docker-compose.prod.yml" } else { "docker-compose.yml" }
$BackupDir = ".\backups"
$LogFile = ".\logs\deploy-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# Colors
$ColorSuccess = "Green"
$ColorError = "Red"
$ColorWarning = "Yellow"
$ColorInfo = "Cyan"

# ============================================
# LOGGING FUNCTIONS
# ============================================
function Write-Log {
    param(
        [string]$Message,
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"

    # Ensure log directory exists
    $logDir = Split-Path -Parent $LogFile
    if (-not (Test-Path $logDir)) {
        New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    }

    Add-Content -Path $LogFile -Value $logMessage

    switch ($Level) {
        "SUCCESS" { Write-Host $logMessage -ForegroundColor $ColorSuccess }
        "ERROR"   { Write-Host $logMessage -ForegroundColor $ColorError }
        "WARNING" { Write-Host $logMessage -ForegroundColor $ColorWarning }
        "INFO"    { Write-Host $logMessage -ForegroundColor $ColorInfo }
        default   { Write-Host $logMessage }
    }
}

function Write-Success { param([string]$Message) Write-Log -Message $Message -Level "SUCCESS" }
function Write-Error { param([string]$Message) Write-Log -Message $Message -Level "ERROR" }
function Write-Warning { param([string]$Message) Write-Log -Message $Message -Level "WARNING" }
function Write-Info { param([string]$Message) Write-Log -Message $Message -Level "INFO" }

# ============================================
# UTILITY FUNCTIONS
# ============================================
function Test-Requirements {
    Write-Info "Checking system requirements..."

    # Check Docker
    try {
        $dockerVersion = docker --version
        Write-Success "Docker installed: $dockerVersion"
    }
    catch {
        Write-Error "Docker is not installed or not in PATH"
        exit 1
    }

    # Check Docker Compose
    try {
        $composeVersion = docker-compose --version
        Write-Success "Docker Compose installed: $composeVersion"
    }
    catch {
        Write-Error "Docker Compose is not installed or not in PATH"
        exit 1
    }

    # Check if Docker is running
    try {
        docker ps | Out-Null
        Write-Success "Docker daemon is running"
    }
    catch {
        Write-Error "Docker daemon is not running. Please start Docker Desktop."
        exit 1
    }

    # Check environment file
    $envFile = if ($Production) { ".env.production" } else { ".env" }
    if (-not (Test-Path $envFile)) {
        Write-Error "Environment file $envFile not found. Please create it from .env.example"
        exit 1
    }

    Write-Success "System requirements check passed"
}

function New-Directories {
    Write-Info "Creating necessary directories..."

    $directories = @(
        $BackupDir,
        ".\logs",
        ".\uploads",
        ".\ssl",
        ".\nginx\conf.d"
    )

    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Info "Created directory: $dir"
        }
    }

    Write-Success "Directories created"
}

# ============================================
# BACKUP FUNCTIONS
# ============================================
function Backup-Database {
    Write-Info "Creating database backup..."

    $backupFile = "$BackupDir\db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

    try {
        docker-compose -f $DockerComposeFile exec -T db pg_dump -U glxy_admin glxy_gaming > $backupFile

        # Compress backup
        Compress-Archive -Path $backupFile -DestinationPath "$backupFile.zip" -Force
        Remove-Item $backupFile

        Write-Success "Database backup created: $backupFile.zip"
        return $true
    }
    catch {
        Write-Warning "Database backup failed - database might not be running"
        return $false
    }
}

function Backup-Uploads {
    Write-Info "Creating uploads backup..."

    $backupFile = "$BackupDir\uploads_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"

    if (Test-Path ".\uploads") {
        Compress-Archive -Path ".\uploads\*" -DestinationPath $backupFile -Force
        Write-Success "Uploads backup created: $backupFile"
    }
    else {
        Write-Warning "Uploads directory not found, skipping backup"
    }
}

function Remove-OldBackups {
    Write-Info "Cleaning up old backups (keeping last 7 days)..."

    $cutoffDate = (Get-Date).AddDays(-7)

    Get-ChildItem -Path $BackupDir -Filter "*.zip" |
        Where-Object { $_.LastWriteTime -lt $cutoffDate } |
        Remove-Item -Force

    Write-Success "Old backups cleaned up"
}

# ============================================
# DOCKER FUNCTIONS
# ============================================
function Build-Application {
    Write-Info "Building application containers..."

    try {
        if ($NoBuild) {
            Write-Warning "Skipping build (--NoBuild flag)"
            return
        }

        docker-compose -f $DockerComposeFile build --parallel
        Write-Success "Application containers built"
    }
    catch {
        Write-Error "Build failed: $_"
        exit 1
    }
}

function Start-Services {
    Write-Info "Starting services..."

    try {
        docker-compose -f $DockerComposeFile up -d
        Write-Success "Services started"

        Write-Info "Waiting for services to be healthy..."
        Start-Sleep -Seconds 30

        Test-ServiceHealth
    }
    catch {
        Write-Error "Failed to start services: $_"
        exit 1
    }
}

function Stop-Services {
    Write-Info "Stopping services..."

    try {
        docker-compose -f $DockerComposeFile down
        Write-Success "Services stopped"
    }
    catch {
        Write-Error "Failed to stop services: $_"
    }
}

function Restart-Services {
    Write-Info "Restarting services..."

    try {
        docker-compose -f $DockerComposeFile restart
        Write-Success "Services restarted"
    }
    catch {
        Write-Error "Failed to restart services: $_"
    }
}

function Invoke-Migrations {
    Write-Info "Running database migrations..."

    try {
        docker-compose -f $DockerComposeFile exec app npx prisma migrate deploy
        Write-Success "Database migrations completed"
    }
    catch {
        Write-Error "Database migration failed: $_"
    }
}

function Invoke-DatabaseSeed {
    Write-Info "Seeding database with initial data..."

    try {
        docker-compose -f $DockerComposeFile exec app npm run seed
        Write-Success "Database seeding completed"
    }
    catch {
        Write-Warning "Database seeding failed - this might be expected if data already exists"
    }
}

# ============================================
# HEALTH CHECK FUNCTIONS
# ============================================
function Test-ServiceHealth {
    Write-Info "Checking service health..."

    $maxAttempts = 30
    $attempt = 1
    $healthUrl = "http://localhost/api/health"

    while ($attempt -le $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "Health check passed"
                return $true
            }
        }
        catch {
            Write-Info "Health check attempt $attempt/$maxAttempts failed, retrying in 10s..."
            Start-Sleep -Seconds 10
            $attempt++
        }
    }

    Write-Error "Health check failed after $maxAttempts attempts"
    return $false
}

function Show-Logs {
    param(
        [string]$ServiceName = "app",
        [int]$Lines = 100
    )

    Write-Info "Showing logs for service: $ServiceName"
    docker-compose -f $DockerComposeFile logs --tail=$Lines -f $ServiceName
}

function Show-Status {
    Write-Info "Docker Compose Status:"
    docker-compose -f $DockerComposeFile ps

    Write-Info "`nContainer Stats:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# ============================================
# DEPLOYMENT FUNCTIONS
# ============================================
function Invoke-FullDeploy {
    Write-Info "Starting full deployment process..."

    Test-Requirements
    New-Directories

    # Backup before deployment
    if (-not $NoBackup) {
        Backup-Database
        Backup-Uploads
    }

    # Build and deploy
    Build-Application
    Stop-Services
    Start-Services

    # Database operations
    Invoke-Migrations

    # Health check
    if (-not (Test-ServiceHealth)) {
        Write-Error "Deployment failed health check"
        exit 1
    }

    # Cleanup
    Remove-OldBackups

    Write-Success "Full deployment completed successfully!"
}

function Invoke-QuickDeploy {
    Write-Info "Starting quick deployment (no backup, no build)..."

    Test-Requirements

    # Restart services
    Restart-Services

    # Health check
    if (-not (Test-ServiceHealth)) {
        Write-Error "Quick deployment failed health check"
        exit 1
    }

    Write-Success "Quick deployment completed successfully!"
}

# ============================================
# SSL FUNCTIONS
# ============================================
function Setup-SelfSignedSSL {
    Write-Info "Setting up self-signed SSL certificate for local development..."

    $certPath = ".\ssl"
    $certFile = "$certPath\glxy.at.crt"
    $keyFile = "$certPath\glxy.at.key"

    if (-not (Test-Path $certPath)) {
        New-Item -ItemType Directory -Path $certPath -Force | Out-Null
    }

    # Check if OpenSSL is available
    try {
        $opensslVersion = openssl version
        Write-Info "Using OpenSSL: $opensslVersion"

        # Generate self-signed certificate
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 `
            -keyout $keyFile `
            -out $certFile `
            -subj "/C=AT/ST=Vienna/L=Vienna/O=GLXY Gaming/CN=localhost"

        Write-Success "Self-signed SSL certificate created"
    }
    catch {
        Write-Warning "OpenSSL not found. Using Windows certificate store..."
        Write-Info "You can download OpenSSL from: https://slproweb.com/products/Win32OpenSSL.html"
    }
}

# ============================================
# MAIN COMMAND HANDLER
# ============================================
function Show-Help {
    Write-Host @"
GLXY Gaming Platform - PowerShell Deployment Script

Usage: .\deploy.ps1 [Command] [Options]

Commands:
    deploy              Full deployment (default)
    quick-deploy        Quick deployment without backups
    start               Start all services
    stop                Stop all services
    restart             Restart all services
    backup              Create backups
    migrate             Run database migrations
    seed                Seed database
    logs [service]      Show service logs
    status              Show service status
    health              Check service health
    ssl                 Setup self-signed SSL certificate
    help                Show this help

Options:
    -NoBuild            Skip Docker build step
    -NoBackup           Skip backup step
    -Production         Use production configuration

Examples:
    .\deploy.ps1 deploy                     # Full deployment
    .\deploy.ps1 quick-deploy               # Quick deployment
    .\deploy.ps1 logs app                   # Show app logs
    .\deploy.ps1 deploy -Production         # Production deployment
    .\deploy.ps1 backup                     # Create backups only

"@
}

# ============================================
# MAIN SCRIPT EXECUTION
# ============================================
switch ($Command.ToLower()) {
    "deploy" {
        Invoke-FullDeploy
    }
    "quick-deploy" {
        Invoke-QuickDeploy
    }
    "start" {
        Test-Requirements
        Start-Services
    }
    "stop" {
        Stop-Services
    }
    "restart" {
        Restart-Services
    }
    "backup" {
        Backup-Database
        Backup-Uploads
        Remove-OldBackups
    }
    "migrate" {
        Invoke-Migrations
    }
    "seed" {
        Invoke-DatabaseSeed
    }
    "logs" {
        Show-Logs -ServiceName $Service
    }
    "status" {
        Show-Status
    }
    "health" {
        Test-ServiceHealth
    }
    "ssl" {
        Setup-SelfSignedSSL
    }
    "help" {
        Show-Help
    }
    default {
        Write-Error "Unknown command: $Command"
        Show-Help
        exit 1
    }
}
