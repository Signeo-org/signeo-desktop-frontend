<#
.SYNOPSIS
    Build script for Signeo Frontend.

.PARAMETER Dev
    Start development server (default).

.PARAMETER Prod
    Production build with electron-builder.

.PARAMETER Clean
    Clean dist/ before building.

.EXAMPLE
    .\build.ps1         # Dev server
    .\build.ps1 -Prod   # Production build
#>

param (
    [switch]$Dev,
    [switch]$Prod,
    [switch]$Clean
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

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
try {
    # Clean if requested
    if ($Clean -and (Test-Path "dist")) {
        Write-Host "  Cleaning dist/..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force "dist"
    }
    
    # Install deps if needed
    if (-not (Test-Path "node_modules")) {
        Write-Host "  Installing dependencies..." -ForegroundColor Yellow
        pnpm install
    }
    
    if ($Dev) {
        Write-Host "`n🚀 Frontend - Development`n" -ForegroundColor Cyan
        pnpm dev
    }
    elseif ($Prod) {
        Write-Host "`n📦 Frontend - Production`n" -ForegroundColor Magenta
        pnpm build
        if ($LASTEXITCODE -eq 0) {
            Write-Host "`n✅ Build complete: dist/release/" -ForegroundColor Green
        }
    }
}
finally {
    Pop-Location
}
