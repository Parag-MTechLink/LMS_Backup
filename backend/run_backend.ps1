# Run LMS backend from this directory so uvicorn loads app.main from lms/backend
Set-Location $PSScriptRoot
Write-Host "Starting LMS backend from: $(Get-Location)"
Write-Host "Auth routes will be at: http://127.0.0.1:8001/api/v1/auth/health" -ForegroundColor Cyan
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
