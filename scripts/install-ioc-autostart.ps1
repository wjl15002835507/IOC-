$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$startupScript = Join-Path $projectRoot 'scripts\start-ioc-autostart.ps1'
$startupCommand = Join-Path $projectRoot 'scripts\ioc-autostart.cmd'
$taskName = 'Axhub IOC Make Client'
$powerShell = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$arguments = "-NoProfile -ExecutionPolicy Bypass -File `"$startupScript`""
$taskUser = (Get-Acl -LiteralPath $projectRoot).Owner

if (-not (Test-Path -LiteralPath $startupScript)) {
    throw "Startup script not found: $startupScript"
}

# Startup-folder launch is the reliable per-user hook on managed Windows hosts.
$userProfile = Join-Path 'C:\Users' (($taskUser -split '\\')[-1])
$startupFolder = Join-Path $userProfile 'AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup'
$startupShortcut = Join-Path $startupFolder 'Axhub IOC Make Client.cmd'
New-Item -ItemType Directory -Path $startupFolder -Force | Out-Null
Copy-Item -LiteralPath $startupCommand -Destination $startupShortcut -Force

$action = New-ScheduledTaskAction -Execute $powerShell -Argument $arguments -WorkingDirectory $projectRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew `
    -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
$principal = New-ScheduledTaskPrincipal -UserId $taskUser -LogonType Interactive -RunLevel Highest

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger `
        -Settings $settings -Principal $principal -Force | Out-Null
} catch {
    Write-Warning "Scheduled task registration unavailable; Startup-folder entry remains active: $($_.Exception.Message)"
}
Start-Process -FilePath $powerShell -ArgumentList @(
    '-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $startupScript
) -WorkingDirectory $projectRoot -WindowStyle Hidden
Write-Output "Installed and started scheduled task: $taskName"
Write-Output "Installed per-user startup entry: $startupShortcut"
Write-Output "LAN preview: http://192.168.108.72:51720/prototypes/order-track-report"
