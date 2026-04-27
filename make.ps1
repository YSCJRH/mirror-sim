param(
    [Parameter(Position = 0)]
    [string]$Target = "smoke",
    [string]$BaseUrl = $env:MIRROR_PUBLIC_DEMO_BASE_URL
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$NpmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
$Npm = if ($NpmCommand) { $NpmCommand.Source } else { "npm" }
$RemoteBaseUrl = if ($BaseUrl) { $BaseUrl } else { "https://mirror-public-demo.onrender.com" }
$RemoteTimeout = if ($env:MIRROR_REMOTE_SMOKE_TIMEOUT) { $env:MIRROR_REMOTE_SMOKE_TIMEOUT } else { "60" }
$RemoteRetries = if ($env:MIRROR_REMOTE_SMOKE_RETRIES) { $env:MIRROR_REMOTE_SMOKE_RETRIES } else { "5" }
$RemoteRetryDelay = if ($env:MIRROR_REMOTE_SMOKE_RETRY_DELAY) { $env:MIRROR_REMOTE_SMOKE_RETRY_DELAY } else { "2" }

function Invoke-Native {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command,
        [Parameter(ValueFromRemainingArguments = $true)]
        [string[]]$Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Command failed with exit code ${LASTEXITCODE}: $Command $($Arguments -join ' ')"
    }
}

function Invoke-PluginCheck {
    Invoke-Native python .\plugins\mirror-codex\scripts\validate_plugin.py
    Invoke-Native python -m pytest plugins\mirror-codex\tests -q
    Invoke-Native python .\plugins\mirror-codex\scripts\smoke_mcp_stdio.py
    Invoke-Native python .\plugins\mirror-codex\scripts\acceptance_check.py
}

switch ($Target) {
    "setup" {
        Invoke-Native python -m pip install -e "$Root\backend"
    }
    "smoke" {
        Invoke-Native python -m backend.app.cli smoke
    }
    "test" {
        Invoke-Native python -m pytest backend/tests -q
    }
    "eval-demo" {
        Invoke-Native python -m backend.app.cli eval-demo
    }
    "eval-transfer" {
        Invoke-Native python -m backend.app.cli eval-transfer
    }
    "public-demo-check" {
        Invoke-Native python -m backend.app.cli eval-demo
        Invoke-Native python .\scripts\scan_frontend_bundle.py --path artifacts\demo
        Invoke-Native $Npm run build --prefix frontend
        Invoke-Native python .\scripts\scan_frontend_bundle.py
        Invoke-Native python .\scripts\smoke_public_demo_web.py
    }
    "plugin-check" {
        Invoke-PluginCheck
    }
    "plugin-release-check" {
        Invoke-PluginCheck
        Invoke-Native python .\plugins\mirror-codex\scripts\check_pr_scope.py
        Invoke-Native python .\scripts\check_no_secrets.py
        Invoke-Native python -m backend.app.cli audit-phase phase2
        Invoke-Native git diff --check
    }
    "plugin-cli-preflight" {
        Invoke-Native python .\plugins\mirror-codex\scripts\cli_marketplace_preflight.py
    }
    "plugin-remote-check" {
        Invoke-Native python .\scripts\smoke_public_demo_web.py --base-url $RemoteBaseUrl --timeout $RemoteTimeout --http-retries $RemoteRetries --retry-delay $RemoteRetryDelay
    }
    "dev-api" {
        Invoke-Native python -m uvicorn backend.app.main:app --reload
    }
    "dev-web" {
        Invoke-Native $Npm run dev --prefix frontend
    }
    default {
        throw "Unknown target: $Target"
    }
}
