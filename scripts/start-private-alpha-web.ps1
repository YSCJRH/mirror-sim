[CmdletBinding()]
param(
  [string]$BindHost = "127.0.0.1",
  [int]$Port = 3000,
  [int]$WaitSeconds = 8
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$frontendRoot = Join-Path $repoRoot "frontend"
$logDir = Join-Path $repoRoot "artifacts\ui-review"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$stdoutLog = Join-Path $logDir "private-beta-web-$timestamp.log"
$stderrLog = Join-Path $logDir "private-beta-web-$timestamp.err.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Get-ListenerProcessInfo {
  param([int]$TargetPort)

  $connections = Get-NetTCPConnection -LocalPort $TargetPort -State Listen -ErrorAction SilentlyContinue
  if (-not $connections) {
    return $null
  }

  $processes = @()
  foreach ($connection in $connections) {
    $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" |
      Select-Object -First 1 ProcessId, ExecutablePath, CommandLine
    if ($process) {
      $processes += $process
    }
  }

  $nodeNext = $processes | Where-Object {
    $_.ExecutablePath -like "*node.exe" -and $_.CommandLine -like "*next*start*"
  } | Select-Object -First 1

  if ($nodeNext) {
    return $nodeNext
  }

  return $processes | Select-Object -First 1
}

function Is-MirrorNextProcess {
  param($ProcessInfo)

  if (-not $ProcessInfo) {
    return $false
  }

  return (
    ($ProcessInfo.CommandLine -like "*D:\mirror\frontend*next*start*") -or
    ($ProcessInfo.CommandLine -like "*.\node_modules\next\dist\bin\next*start*--hostname $BindHost*--port $Port*")
  )
}

function Test-MirrorResponse {
  param(
    [string]$TargetHost,
    [int]$TargetPort
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri "http://$TargetHost`:$TargetPort/"
    return $response.StatusCode -eq 200 -and $response.Content -match "Mirror"
  }
  catch {
    return $false
  }
}

$listener = Get-ListenerProcessInfo -TargetPort $Port
if ($listener) {
  if ((Is-MirrorNextProcess -ProcessInfo $listener) -or (Test-MirrorResponse -TargetHost $BindHost -TargetPort $Port)) {
    Stop-Process -Id $listener.ProcessId -Force
    Start-Sleep -Seconds 2
  }
  else {
    throw "Port $Port is already owned by a non-Mirror process: $($listener.CommandLine)"
  }
}

Start-Process `
  -FilePath "node" `
  -ArgumentList ".\node_modules\next\dist\bin\next", "start", "--hostname", $BindHost, "--port", "$Port" `
  -WorkingDirectory $frontendRoot `
  -RedirectStandardOutput $stdoutLog `
  -RedirectStandardError $stderrLog | Out-Null

Start-Sleep -Seconds $WaitSeconds

$listener = Get-ListenerProcessInfo -TargetPort $Port
if (-not $listener) {
  throw "Mirror web did not bind to $BindHost`:$Port."
}
if (-not ((Is-MirrorNextProcess -ProcessInfo $listener) -or (Test-MirrorResponse -TargetHost $BindHost -TargetPort $Port))) {
  throw "Port $Port is listening, but not from the Mirror frontend: $($listener.CommandLine)"
}

$url = "http://$BindHost`:$Port/"
$response = Invoke-WebRequest -UseBasicParsing -Uri $url
if ($response.StatusCode -ne 200) {
  throw "Mirror web returned unexpected status $($response.StatusCode) for $url"
}
if ($response.Content -notmatch "Mirror") {
  throw "Mirror web responded on $url, but the page content did not match the expected app fingerprint."
}

Write-Output ("private-beta-web: {0}" -f $response.StatusCode)
Write-Output ("url: {0}" -f $url)
Write-Output ("listener-pid: {0}" -f $listener.ProcessId)
Write-Output ("stdout-log: {0}" -f $stdoutLog)
Write-Output ("stderr-log: {0}" -f $stderrLog)
