# Create virtual environment with Python 3.12 and install requirements
# Run from backend folder: .\setup_venv.ps1

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

# Use Python 3.12 (py -3.12 on Windows)
$py = Get-Command py -ErrorAction SilentlyContinue
if ($py) {
    & py -3.12 --version
    if ($LASTEXITCODE -ne 0) { Write-Host "Python 3.12 not found. Install from https://www.python.org/downloads/" -ForegroundColor Red; exit 1 }
    & py -3.12 -m venv .venv
} else {
    & python --version
    & python -m venv .venv
}

Write-Host "Activating .venv and installing requirements..." -ForegroundColor Cyan
& .\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r requirements.txt

Write-Host "Done. To activate later: .\.venv\Scripts\Activate.ps1" -ForegroundColor Green
Write-Host "Then run: uvicorn app.main:app --host 127.0.0.1 --port 8001" -ForegroundColor Green
