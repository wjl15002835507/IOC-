param(
  [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot),
  [string]$CommitPrefix = 'auto: sync IOC prototype'
)

$ErrorActionPreference = 'Stop'
$logDir = Join-Path $ProjectRoot 'logs'
$logFile = Join-Path $logDir 'git-auto-sync.log'
New-Item -ItemType Directory -Force -Path $logDir | Out-Null

function Write-Log([string]$Message) {
  Add-Content -LiteralPath $logFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') $Message" -Encoding utf8
}

function Resolve-Git {
  $command = Get-Command git.exe -ErrorAction SilentlyContinue
  if ($command) { return $command.Source }

  $install = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*', 'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -eq 'Git' -and $_.InstallLocation } |
    Select-Object -First 1
  if ($install) {
    $candidate = Join-Path $install.InstallLocation 'cmd\git.exe'
    if (Test-Path -LiteralPath $candidate) { return $candidate }
  }
  throw 'Git was not found. Install Git or add it to PATH.'
}

try {
  $git = Resolve-Git
  Set-Location -LiteralPath $ProjectRoot
  if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot '.git'))) {
    throw 'This project is not connected to Git yet.'
  }

  & $git remote get-url origin *> $null
  if ($LASTEXITCODE -ne 0) { throw 'Git remote origin is not configured.' }

  $branch = (& $git branch --show-current).Trim()
  if (-not $branch) { throw 'The current Git branch could not be determined.' }

  & $git add --all
  & $git diff --cached --quiet
  if ($LASTEXITCODE -ne 0) {
    $message = "$CommitPrefix $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
    & $git commit -m $message
    if ($LASTEXITCODE -ne 0) { throw 'Git commit failed.' }
    Write-Log "Committed local changes on $branch."
  }

  & $git pull --rebase origin $branch
  if ($LASTEXITCODE -ne 0) {
    throw 'Git pull failed. Automatic sync stopped to avoid overwriting another computer.'
  }

  & $git push origin $branch
  if ($LASTEXITCODE -ne 0) { throw 'Git push failed.' }
  Write-Log "Sync completed on $branch."
} catch {
  Write-Log "ERROR: $($_.Exception.Message)"
  exit 1
}
