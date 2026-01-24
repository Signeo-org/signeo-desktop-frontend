<#
.SYNOPSIS
    Unified build script for Signeo Frontend.

.PARAMETER Dev
    Start development server (default).

.PARAMETER Prod
    Production build with electron-builder.

.EXAMPLE
    .\build.ps1         # Dev server
    .\build.ps1 -Prod   # Production build
#>

param (
    [switch]$Dev,
    [switch]$Prod
)

$ErrorActionPreference = "Stop"

# Path resolution
$ScriptRoot = $PSScriptRoot
$ProjectRoot = Resolve-Path "$ScriptRoot\.."

# Default to Dev
if (-not ($Dev -or $Prod)) { $Dev = $true }

# Check pnpm
if (-not (Get-Command "pnpm" -ErrorAction SilentlyContinue)) {
    Write-Error "pnpm not installed. Run: npm install -g pnpm"
    exit 1
}

Push-Location $ProjectRoot

# Install deps if needed
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pnpm install
}

if ($Dev) {
    Write-Host "`n🚀 Frontend - Development`n" -ForegroundColor Cyan
    pnpm dev
}
elseif ($Prod) {
    Write-Host "`n📦 Frontend - Production`n" -ForegroundColor Magenta
    pnpm build
    Write-Host "`n✅ Build complete: dist/release/" -ForegroundColor Green
}

Pop-Location
