param(
    [Parameter(Position = 0)]
    [string]$Target = "smoke"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$NpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
$Npm = if ($NpmCommand) { $NpmCommand.Source } else { "npm" }

switch ($Target) {
    "setup" {
        python -m pip install -e "$Root\backend"
    }
    "smoke" {
        python -m backend.app.cli smoke
    }
    "test" {
        python -m pytest backend/tests -q
    }
    "eval-demo" {
        python -m backend.app.cli eval-demo
    }
    "eval-transfer" {
        python -m backend.app.cli eval-transfer
    }
    "public-demo-check" {
        python -m backend.app.cli eval-demo
        python .\scripts\scan_frontend_bundle.py --path artifacts\demo
        & $Npm run build --prefix frontend
        python .\scripts\scan_frontend_bundle.py
        python .\scripts\smoke_public_demo_web.py
    }
    "dev-api" {
        python -m uvicorn backend.app.main:app --reload
    }
    "dev-web" {
        & $Npm run dev --prefix frontend
    }
    default {
        throw "Unknown target: $Target"
    }
}
