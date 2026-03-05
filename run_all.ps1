$baseDir = "c:\Users\moham\Videos\EXPERIMENT\sovereign-health"

Write-Host "Cleaning up old processes on ports 8545, 4000, 5173, 8080..." -ForegroundColor Yellow
@(8545, 4000, 5173, 8080) | ForEach-Object {
    $p = Get-NetTCPConnection -LocalPort $_ -ErrorAction SilentlyContinue
    if ($p) { Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 2

Write-Host "Starting Blockchain Node (Hardhat)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$baseDir\blockchain'; npx hardhat node"
Start-Sleep -Seconds 12

Write-Host "Deploying ModelRegistry Smart Contract..." -ForegroundColor Green
Push-Location "$baseDir\blockchain"
npx hardhat run scripts/deploy.js --network localhost
Pop-Location
Start-Sleep -Seconds 2

Write-Host "Starting Backend API Server (Express)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$baseDir\web_dashboard\backend'; node server.js"
Start-Sleep -Seconds 3

Write-Host "Starting Frontend Dashboard (Vite)..." -ForegroundColor Green
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$baseDir\web_dashboard\frontend'; npm run dev"
Start-Sleep -Seconds 3

Write-Host "All infrastructure services are UP!" -ForegroundColor Green
Write-Host "Open http://localhost:5173 in your browser and click Trigger Federated Round to start FL" -ForegroundColor Yellow
