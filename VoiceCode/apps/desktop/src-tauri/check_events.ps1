$events = Get-WinEvent -FilterHashtable @{LogName='System'; StartTime=(Get-Date).AddMinutes(-3)} -MaxEvents 50 -ErrorAction SilentlyContinue
foreach ($e in $events) {
    if ($e.Message -match 'entry' -or $e.Message -match 'voicecode' -or $e.Message -match '0139' -or $e.Id -eq 26 -or $e.ProviderName -match 'SideBySide') {
        Write-Host ("Time: " + $e.TimeCreated + " ID: " + $e.Id + " Provider: " + $e.ProviderName)
        $msgLen = [Math]::Min(500, $e.Message.Length)
        Write-Host ("Message: " + $e.Message.Substring(0, $msgLen))
        Write-Host "---"
    }
}
Write-Host "Done"
