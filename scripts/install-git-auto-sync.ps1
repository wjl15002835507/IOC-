param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
  [int]$Minutes = 5
)

$ErrorActionPreference = 'Stop'
if ($Minutes -lt 2) { throw 'The sync interval must be at least 2 minutes.' }

$projectName = Split-Path -Leaf $ProjectRoot
$taskName = "Axhub-$projectName-Git-AutoSync"
$syncScript = Join-Path $ProjectRoot 'scripts\git-auto-sync.ps1'
if (-not (Test-Path -LiteralPath $syncScript)) { throw "Missing sync script: $syncScript" }

$arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$syncScript`" -ProjectRoot `"$ProjectRoot`""
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument $arguments
$repeat = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) `
  -RepetitionInterval (New-TimeSpan -Minutes $Minutes) `
  -RepetitionDuration (New-TimeSpan -Days 3650)
$logon = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName $taskName -Action $action -Trigger @($repeat, $logon) `
  -Settings $settings -Description 'Automatically sync the Axhub IOC prototype with GitHub.' -Force | Out-Null
Start-ScheduledTask -TaskName $taskName
Write-Host "Automatic GitHub sync installed: $taskName"
