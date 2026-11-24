# Safe Auto-Backup & Team Sync Script to GitHub (JOCars1)
# Pulls collaborator changes FIRST before committing & pushing to prevent conflicts.
param(
    [string]$Message = "chore: auto-backup after edit ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
)

$ErrorActionPreference = "Stop"

$repoRoot = git rev-parse --show-toplevel
Set-Location $repoRoot

Write-Host "1/4 Checking remote updates from origin/main..." -ForegroundColor Cyan
git fetch origin main

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No local changes. Pulling any remote updates..." -ForegroundColor Yellow
    git pull --rebase origin main
    Write-Host "Workspace is up to date." -ForegroundColor Green
    exit 0
}

Write-Host "2/4 Staging local changes (secrets protected by .gitignore)..." -ForegroundColor Cyan
git add -A

Write-Host "3/4 Committing local changes..." -ForegroundColor Cyan
git commit -m $Message

Write-Host "4/4 Pulling collaborator commits (rebase) and pushing to origin/main..." -ForegroundColor Cyan
git pull --rebase origin main
git push origin main

Write-Host "Sync & Auto-backup completed successfully!" -ForegroundColor Green
