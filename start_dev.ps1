# Cloud Optimization Dashboard Development Server Startup

$ProjectRoot = $PSScriptRoot
if (-not $ProjectRoot) {
    $ProjectRoot = Get-Location
}

Write-Host "🚀 Starting Cloud Optimization Dashboard..." -ForegroundColor Green
Write-Host ""

# Start Backend in a separate window
Write-Host "Starting Backend API Server..." -ForegroundColor Cyan
Write-Host "Backend will run on: http://localhost:8000" -ForegroundColor Gray
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\backend'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

# Give backend time to start
Start-Sleep -Seconds 3

# Install frontend dependencies if needed
Write-Host ""
Write-Host "Checking Frontend Dependencies..." -ForegroundColor Cyan
Set-Location "$ProjectRoot\frontend"
if ((Test-Path "node_modules") -eq $false) {
    Write-Host "Installing node_modules..." -ForegroundColor Yellow
    npm install
}

# Free port 5173 if a stale process is holding it
$occupied = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($occupied) {
    Write-Host "Releasing busy port 5173..." -ForegroundColor Yellow
    $occupied | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 1
}

# Start Frontend
Write-Host ""
Write-Host "Starting Frontend Development Server..." -ForegroundColor Cyan
Write-Host "Frontend will run on: http://localhost:5173" -ForegroundColor Gray
npm run dev

Write-Host ""
Write-Host "✅ All services started!" -ForegroundColor Green
