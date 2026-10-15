$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$env:AXHUB_MAKE_HOME_DIR = 'C:\temp\axhub-make'
$nodeCommand = (Get-Command node.exe -ErrorAction SilentlyContinue | Select-Object -First 1 -ExpandProperty Source)
if (-not $nodeCommand) {
    $nodeCommand = 'C:\Users\wangjunli5\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
}
$viteEntry = Join-Path $projectRoot 'node_modules\vite\bin\vite.js'
$logDirectory = Join-Path ([IO.Path]::GetTempPath()) 'Axhub-IOC'
$clientOutput = Join-Path $logDirectory 'vite-autostart.out.log'
$clientError = Join-Path $logDirectory 'vite-autostart.err.log'
$monitorLog = Join-Path $logDirectory 'ioc-autostart-monitor.log'
$adminScript = Join-Path $projectRoot 'scripts\start-axhub-make-autostart.ps1'
$cachedMakeCli = 'C:\Users\wangjunli5\AppData\Local\npm-cache\_npx\04b2558ad7039a3e\node_modules\@axhub\make\bin\cli.mjs'

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$mutex = [Threading.Mutex]::new($false, 'Global\AxhubIocAutostartMonitor')
if (-not $mutex.WaitOne(0)) { exit 0 }

function Test-HttpPort([string] $HostName, [int] $Port) {
    try {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "http://$HostName`:$Port/" -TimeoutSec 2
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 500
    } catch {
        return $false
    }
}

Set-Location -LiteralPath $projectRoot

$lanHost = '127.0.0.1'
$configPath = Join-Path $projectRoot '.axhub\make\axhub.config.json'
if (Test-Path -LiteralPath $configPath) {
    try {
        $config = Get-Content -Raw -LiteralPath $configPath | ConvertFrom-Json
        if ($config.server.lanHost) { $lanHost = [string]$config.server.lanHost }
    } catch { }
}

function Start-AdminServer {
    $adminState = 'C:\Users\wangjunli5\.axhub\make\.admin-server-info.json'
    if (Test-Path -LiteralPath $adminState) {
        Move-Item -LiteralPath $adminState -Destination "$adminState.stale-$([DateTime]::Now.ToString('yyyyMMddHHmmss'))" -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path -LiteralPath $cachedMakeCli) {
        Start-Process -FilePath $nodeCommand -ArgumentList @(
            $cachedMakeCli, '--port', '53817', '--host', '0.0.0.0',
            '--runtime-origin', 'http://localhost:51720', '--no-open', '--background',
            '--log-file', (Join-Path $logDirectory 'admin-server.log')
        ) -WorkingDirectory $projectRoot -WindowStyle Hidden
    } elseif (Test-Path -LiteralPath $adminScript) {
        & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $adminScript
    }
}

function Start-ClientServer {
    Get-NetTCPConnection -LocalPort 51720 -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    if (-not (Test-Path -LiteralPath $nodeCommand)) { throw "Node was not found: $nodeCommand" }
    if (-not (Test-Path -LiteralPath $viteEntry)) { throw "Vite entry was not found: $viteEntry" }
    $env:AXHUB_MAKE_SKIP_AUTO_START_SERVER = '1'
    Start-Process -FilePath $nodeCommand -ArgumentList @(
        $viteEntry, '--host', '0.0.0.0', '--port', '51720', '--strictPort'
    ) -WorkingDirectory $projectRoot -WindowStyle Hidden
}

while ($true) {
    try {
        if ((Test-Path -LiteralPath $adminScript) -and -not (Test-HttpPort '127.0.0.1' 53817)) {
            Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) restarting admin on 53817"
            Start-AdminServer
        }
        if (-not (Test-HttpPort '127.0.0.1' 51720)) {
            Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) restarting client on 51720"
            Start-ClientServer
        }
    } catch {
        Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) monitor error: $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 10
}
