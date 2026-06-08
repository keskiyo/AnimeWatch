param(
  [int[]]$Ports = @(3001, 5173)
)

$ErrorActionPreference = "SilentlyContinue"

foreach ($port in $Ports) {
  $connections = Get-NetTCPConnection -LocalPort $port -State Listen
  foreach ($connection in $connections) {
    $processId = $connection.OwningProcess
    if (-not $processId -or $processId -eq $PID) {
      continue
    }

    $process = Get-Process -Id $processId

    if ($process) {
      Write-Host "Stopping AnimeWatch dev server on port $port (PID $processId, $($process.ProcessName))"
    } else {
      Write-Host "Stopping AnimeWatch dev server on port $port (PID $processId)"
    }

    Stop-Process -Id $processId -Force
  }
}
