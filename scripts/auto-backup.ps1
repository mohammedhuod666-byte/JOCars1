# Auto-Backup Script to GitHub (JOCars1)
param(
    [string]$Message = "chore: auto-backup after edit ($(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
)

$ErrorActionPreference = "Stop"

# Ensure we are in repo root
$repoRoot = git rev-parse --show-toplevel
Set-Location $repoRoot

$status = git status --porcelain
if ([string]::IsNullOrWhiteSpace($status)) {
    Write-Host "No changes to backup."
    exit 0
}

git add -A
git commit -m $Message
git push origin main
Write-Host "Auto-backup pushed to GitHub (origin/main) successfully."
