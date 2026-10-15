$ErrorActionPreference = 'Stop'
$port = 53817
$healthUrl = "http://127.0.0.1:$port/"
$projectRoot = 'C:\axhub\ioc'
$runtimeOrigin = 'http://localhost:51720'
$env:AXHUB_MAKE_HOME_DIR = 'C:\temp\axhub-make'
$node = (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
$pnpm = (Get-Command pnpm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $node) {
    $node = 'C:\Users\wangjunli5\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
if (-not $pnpm) {
    $pnpm = 'C:\Users\wangjunli5\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin\fallback\pnpm.cmd'
}
$logDirectory = Join-Path ([IO.Path]::GetTempPath()) 'Axhub-IOC'
$logFile = Join-Path $logDirectory 'autostart.log'
$acpRuntimeRoot = Join-Path $env:USERPROFILE '.axhub\make\acp-runtime'
$acpRuntimeEntry = Join-Path $acpRuntimeRoot 'node_modules\@axhub\acp\bin\acp.mjs'
$acpWorkspacePatcher = Join-Path $acpRuntimeRoot 'patch-windows-workspace.ps1'
$requiredPath = @(
    'C:\Windows\System32'
    'C:\Windows'
    'C:\Program Files\nodejs'
    (Join-Path $env:APPDATA 'npm')
    (Split-Path -Parent $node)
    (Split-Path -Parent $pnpm)
)
$env:PATH = (($requiredPath + ($env:PATH -split ';')) | Select-Object -Unique) -join ';'
Remove-Item -LiteralPath Env:CODEX_PATH -ErrorAction SilentlyContinue
try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $healthUrl -TimeoutSec 3
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) { exit 0 }
} catch {}
$projectDeadline = (Get-Date).AddMinutes(2)
while (-not (Test-Path -LiteralPath $projectRoot) -and (Get-Date) -lt $projectDeadline) {
    Start-Sleep -Seconds 5
}
if (-not (Test-Path -LiteralPath $projectRoot)) { throw "Axhub Make project path is unavailable: $projectRoot" }
if (-not (Test-Path -LiteralPath $node)) { throw "Node was not found: $node" }
if (-not (Test-Path -LiteralPath $pnpm)) { throw "pnpm was not found: $pnpm" }
if (Test-Path -LiteralPath $acpRuntimeEntry) {
    if (-not (Test-Path -LiteralPath $acpWorkspacePatcher)) { throw "ACP workspace patcher is unavailable: $acpWorkspacePatcher" }
    & $acpWorkspacePatcher -AcpRuntimeRoot $acpRuntimeRoot
    $env:AXHUB_ACP_UI_PROJECT_ROOT = $acpRuntimeRoot
} else {
    Write-Warning "Fixed ACP runtime is unavailable; Make will fall back to npx."
}
New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null
Set-Location -LiteralPath $projectRoot
& $pnpm dlx '@axhub/make@latest' --port $port --runtime-origin $runtimeOrigin --no-open --background --log-file $logFile
exit $LASTEXITCODE
