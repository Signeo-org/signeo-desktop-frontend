# ✅ Run as Administrator

Write-Host "Running in elevated PowerShell..."

# ✅ Ensure local node_modules/.bin is in the path early
$localBin = "$PWD\node_modules\.bin"
if (-not ($env:Path -split ";" | Where-Object { $_ -eq $localBin })) {
    $env:Path += ";$localBin"
}

# ✅ Ensure pnpm is installed
if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "pnpm not found. Installing via npm..."
    npm install -g pnpm
    $env:Path += ";" + [System.IO.Path]::Combine($env:APPDATA, "npm")
}

# ✅ Ensure vite is installed globally or locally
$viteGlobal = Get-Command vite -ErrorAction SilentlyContinue
$viteLocal = Test-Path "./node_modules/.bin/vite"

if (-not $viteGlobal -and -not $viteLocal) {
    Write-Host "Vite not found globally or locally. Installing locally with pnpm..."
    pnpm add -D vite
}
else {
    Write-Host "Vite is already installed."
}

# ✅ Kill node/electron processes to avoid file locks
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Stop-Process -Name "electron" -Force -ErrorAction SilentlyContinue

# ✅ Clean broken electron folder if exists
if (Test-Path "node_modules/electron") {
    Write-Host "Removing conflicting electron folder..."
    Remove-Item -Path "node_modules/electron" -Recurse -Force -ErrorAction SilentlyContinue
}
if (Test-Path "node_modules/.ignored/electron") {
    Remove-Item -Path "node_modules/.ignored/electron" -Recurse -Force -ErrorAction SilentlyContinue
}

# ✅ Install dependencies
pnpm install
