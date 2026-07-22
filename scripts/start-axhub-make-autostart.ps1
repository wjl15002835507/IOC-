$ErrorActionPreference = 'Stop'
$port = 53817
$healthUrl = "http://127.0.0.1:$port/"
$projectRoot = '\\xsvdi3.quanyou.com.cn\VDI\wangjunli5\axhub\IOC\ioc'
$npx = 'C:\Program Files\nodejs\npx.cmd'
$logDirectory = Join-Path $projectRoot '.axhub\make\logs'
$logFile = Join-Path $logDirectory 'autostart.log'
$requiredPath = @('C:\Windows\System32'; 'C:\Windows'; 'C:\Program Files\nodejs'; "$env:APPDATA\npm")
$env:PATH = (($requiredPath + ($env:PATH -split ';')) | Select-Object -Unique) -join ';'
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 3
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { exit 0 }
} catch {}
$projectDeadline = (Get-Date).AddMinutes(2)
while (-not (Test-Path -LiteralPath $projectRoot) -and (Get-Date) -lt $projectDeadline) {
    Start-Sleep -Seconds 5
}
if (-not (Test-Path -LiteralPath $projectRoot)) { throw "Axhub Make project path is unavailable: $projectRoot" }
if (-not (Test-Path -LiteralPath $npx)) { throw "npx was not found: $npx" }
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Set-Location -LiteralPath $projectRoot
& $npx -y '@axhub/make@latest' --port $port --no-open --log-file $logFile
exit $LASTEXITCODE
