# Run as Administrator
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Start-Process powershell -Verb RunAs -ArgumentList "-NoExit", "-Command", "cd '$PWD'; ./scripts/start.ps1"
    exit
}

Write-Host "✅ Running in elevated PowerShell"

# Ensure pnpm is installed
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Installing via npm..."
    npm install -g pnpm
    $env:Path += ";$([System.IO.Path]::Combine($env:APPDATA, 'npm'))"
}

# Ensure vite is installed locally
if (-not (Test-Path "./node_modules/.bin/vite")) {
    Write-Host "Vite not found locally. Installing..."
    $env:Path += ";$PWD\node_modules\.bin"
    pnpm add -D vite
}

# Kill node/electron processes to avoid file locks
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "electron" -Force -ErrorAction SilentlyContinue

# Clean broken electron folder if exists
if (Test-Path "node_modules/electron") {
    Write-Host "Removing conflicting electron folder..."
    Remove-Item -Path "node_modules/electron" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules/.ignored/electron") {
    Remove-Item -Path "node_modules/.ignored/electron" -Recurse -Force -ErrorAction SilentlyContinue
}

# Install dependencies
pnpm install

# Run dev server
pnpm dev
