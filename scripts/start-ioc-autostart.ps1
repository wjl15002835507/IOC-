$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$npmCommand = 'C:\Program Files\nodejs\npm.cmd'
$logDirectory = Join-Path $projectRoot '.axhub\make\logs'
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

$lanHost = '192.168.108.72'
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
        Start-Process -FilePath 'C:\Program Files\nodejs\node.exe' -ArgumentList @(
            $cachedMakeCli, 'serve', '--port', '53817', '--host', '0.0.0.0',
            '--runtime-origin', 'http://localhost:51720', '--no-open',
            '--log-file', (Join-Path $logDirectory 'admin-server.log')
        ) -WorkingDirectory $projectRoot -WindowStyle Hidden
    } elseif (Test-Path -LiteralPath $adminScript) {
        Start-Process -FilePath 'powershell.exe' -ArgumentList @(
            '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $adminScript
        ) -WorkingDirectory $projectRoot -WindowStyle Hidden
    }
}

function Start-ClientServer {
    Get-NetTCPConnection -LocalPort 51720 -State Listen -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty OwningProcess -Unique |
        ForEach-Object { Stop-Process -Id $_ -Force -ErrorAction SilentlyContinue }
    Start-Process -FilePath $npmCommand -ArgumentList @(
        'run', 'dev', '--', '--host', '0.0.0.0', '--port', '51720'
    ) -WorkingDirectory $projectRoot -WindowStyle Hidden `
        -RedirectStandardOutput $clientOutput -RedirectStandardError $clientError
}

while ($true) {
    try {
        if ((Test-Path -LiteralPath $adminScript) -and -not (Test-HttpPort '127.0.0.1' 53817)) {
            Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) restarting admin on 53817"
            Start-AdminServer
        }
        if (-not (Test-HttpPort $lanHost 51720)) {
            Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) restarting client on 51720 (LAN $lanHost)"
            Start-ClientServer
        }
    } catch {
        Add-Content -LiteralPath $monitorLog -Value "$(Get-Date -Format o) monitor error: $($_.Exception.Message)"
    }
    Start-Sleep -Seconds 10
}
