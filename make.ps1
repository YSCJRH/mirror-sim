param(
    [Parameter(Position = 0)]
    [string]$Target = "smoke"
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

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
    "dev-api" {
        python -m uvicorn backend.app.main:app --reload
    }
    "dev-web" {
        npm run dev --prefix frontend
    }
    default {
        throw "Unknown target: $Target"
    }
}
