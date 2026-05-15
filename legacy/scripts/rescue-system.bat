@echo off
setlocal
echo 🚑 Trader Browser Block - Emergency Rescue
echo ==========================================

:: Check for admin privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Admin privileges confirmed.
) else (
    echo ⚠️  Administrator privileges required.
    echo Please right-click this script and select "Run as Administrator".
    pause
    exit /b 1
)

set "HOSTS_FILE=C:\Windows\System32\drivers\etc\hosts"

echo 🔍 Checking hosts file...

:: Use PowerShell to read, filter, and write back the file
:: This removes any lines between the start and end markers
powershell -Command "$hosts = Get-Content '%HOSTS_FILE%'; $newHosts = @(); $skipping = $false; foreach ($line in $hosts) { if ($line -match '# TRADER-BLOCK-START') { $skipping = $true; continue; } if ($line -match '# TRADER-BLOCK-END') { $skipping = $false; continue; } if (-not $skipping) { $newHosts += $line } }; Set-Content '%HOSTS_FILE%' -Value $newHosts"

echo 🔄 Flushing DNS cache...
ipconfig /flushdns

echo 🎉 System restored! You should now have access to all websites.
pause

