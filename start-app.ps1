# Enhanced startup script for Camunda Zeebe Leave Approval System
# This script starts both the backend and frontend servers and monitors them

Write-Host "=== Starting Camunda Zeebe Leave Approval System ===" -ForegroundColor Cyan
Write-Host "Checking if required ports are available..." -ForegroundColor Yellow

# Check if ports are already in use
$backend_port = 3002
$frontend_port = 3000

$backend_port_in_use = Get-NetTCPConnection -LocalPort $backend_port -ErrorAction SilentlyContinue
$frontend_port_in_use = Get-NetTCPConnection -LocalPort $frontend_port -ErrorAction SilentlyContinue

if ($backend_port_in_use) {
    Write-Host "Warning: Port $backend_port is already in use. Backend may fail to start." -ForegroundColor Red
}

if ($frontend_port_in_use) {
    Write-Host "Warning: Port $frontend_port is already in use. Frontend may fail to start." -ForegroundColor Red
}

# Start the backend server
Write-Host "Starting backend server (Node.js)..." -ForegroundColor Yellow
$startBackend = Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory "c:\Users\iTz_M\Documents\vsprojects\Projects\camundaZebee-master" -PassThru
Write-Host "Backend server started with process ID: $($startBackend.Id)" -ForegroundColor Green

# Start the frontend server
Write-Host "Starting frontend server (React)..." -ForegroundColor Yellow
$startFrontend = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "c:\Users\iTz_M\Documents\vsprojects\Projects\camundaZebee-master\frontend" -PassThru
Write-Host "Frontend server started with process ID: $($startFrontend.Id)" -ForegroundColor Green

Write-Host "`nApplication URLs:" -ForegroundColor Cyan
Write-Host "- Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "- Backend API: http://localhost:3002" -ForegroundColor Cyan

Write-Host "`nAvailable test accounts:" -ForegroundColor Cyan
Write-Host "- Admin: username='admin', password='admin'" -ForegroundColor Cyan
Write-Host "- Manager: username='manager', password='manager'" -ForegroundColor Cyan
Write-Host "- HR: username='hr', password='hr'" -ForegroundColor Cyan
Write-Host "- Employee: username='employee', password='employee'" -ForegroundColor Cyan

Write-Host "`nPress Ctrl+C to stop both servers..." -ForegroundColor Yellow

try {
    # Keep checking if processes are still running
    while ($true) {
        Start-Sleep -Seconds 5
        
        # Check if backend is still running
        if (Get-Process -Id $startBackend.Id -ErrorAction SilentlyContinue) {
            # Backend is running
        } else {
            Write-Host "Backend server stopped unexpectedly. Trying to restart..." -ForegroundColor Red
            $startBackend = Start-Process -FilePath "node" -ArgumentList "index.js" -WorkingDirectory "c:\Users\iTz_M\Documents\vsprojects\Projects\camundaZebee-master" -PassThru
            Write-Host "Backend server restarted with process ID: $($startBackend.Id)" -ForegroundColor Green
        }
        
        # Check if frontend is still running
        if (Get-Process -Id $startFrontend.Id -ErrorAction SilentlyContinue) {
            # Frontend is running
        } else {
            Write-Host "Frontend server stopped unexpectedly. Trying to restart..." -ForegroundColor Red
            $startFrontend = Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "c:\Users\iTz_M\Documents\vsprojects\Projects\camundaZebee-master\frontend" -PassThru
            Write-Host "Frontend server restarted with process ID: $($startFrontend.Id)" -ForegroundColor Green
        }
    }
} finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Stop-Process -Id $startBackend.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $startFrontend.Id -ErrorAction SilentlyContinue
    Write-Host "Servers stopped successfully." -ForegroundColor Green
}
