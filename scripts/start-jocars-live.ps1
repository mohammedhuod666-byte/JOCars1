# JO Cars Auto-Start Script (Node.js Production Server + Ngrok Static Tunnel)
$ErrorActionPreference = "SilentlyContinue"
$projectDir = "c:\Users\zi-jo.com\OneDrive\Desktop\مراحل العمل jocars\مراحل العمل jocars\Cars_JO"
$ngrokExe = "$env:LOCALAPPDATA\Microsoft\WindowsApps\ngrok.exe"
$logFile = "$projectDir\logs\autostart.log"

if (!(Test-Path "$projectDir\logs")) {
    New-Item -ItemType Directory -Path "$projectDir\logs" -Force | Out-Null
}

function Log-Msg($msg) {
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $logFile -Value "[$ts] $msg"
}

Set-Location $projectDir

# 1. Start Node.js server if port 3000 is not already listening
$portBusy = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
if (-not $portBusy) {
    Log-Msg "Starting JO Cars Next.js server (node server.js)..."
    Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $projectDir -WindowStyle Hidden
    Start-Sleep -Seconds 4
} else {
    Log-Msg "Port 3000 already listening. Skipping node server start."
}

# 2. Start Ngrok tunnel on fixed domain if ngrok API (4040) is not running
$ngrokBusy = Get-NetTCPConnection -LocalPort 4040 -State Listen -ErrorAction SilentlyContinue
if (-not $ngrokBusy) {
    if (Test-Path $ngrokExe) {
        Log-Msg "Starting Ngrok tunnel on https://suspend-passable-thrift.ngrok-free.dev ..."
        Start-Process -FilePath $ngrokExe -ArgumentList "http", "--url=suspend-passable-thrift.ngrok-free.dev", "3000" -WorkingDirectory $projectDir -WindowStyle Hidden
    } else {
        Log-Msg "Starting Ngrok via PATH..."
        Start-Process -FilePath "ngrok" -ArgumentList "http", "--url=suspend-passable-thrift.ngrok-free.dev", "3000" -WorkingDirectory $projectDir -WindowStyle Hidden
    }
} else {
    Log-Msg "Ngrok tunnel already active on port 4040."
}
