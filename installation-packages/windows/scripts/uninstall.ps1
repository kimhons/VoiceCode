# VoiceFlow Pro Windows Uninstaller Script
# This script removes VoiceFlow Pro from Windows systems

param(
    [string]$InstallPath = "",
    [switch]$Force,
    [switch]$Silent,
    [switch]$RemoveUserData,
    [switch]$RemoveLogs,
    [switch]$RemoveCache
)

$ErrorActionPreference = "Stop"

Write-Host "=== VoiceFlow Pro Uninstaller ===" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "Warning: Not running as Administrator. Some cleanup may fail." -ForegroundColor Yellow
}

# Get installation path
if (-not $InstallPath) {
    # Try to get from registry
    try {
        $InstallPath = Get-ItemProperty -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\VoiceFlow Pro" -Name "InstallLocation" -ErrorAction Stop | Select-Object -ExpandProperty InstallLocation
    } catch {
        if (-not $Force) {
            Write-Host "Could not find installation path. Please specify with -InstallPath parameter or run as administrator." -ForegroundColor Red
            exit 1
        } else {
            $InstallPath = "${env:ProgramFiles}\VoiceFlow Pro"
        }
    }
}

Write-Host "Installation Path: $InstallPath" -ForegroundColor Yellow

# Confirm uninstallation
if (-not $Silent -and -not $Force) {
    $response = Read-Host "Are you sure you want to uninstall VoiceFlow Pro? (y/N)"
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Uninstallation cancelled." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Starting uninstallation process..." -ForegroundColor Yellow

# Stop running processes
Write-Host "Stopping VoiceFlow Pro processes..." -ForegroundColor Yellow
$processes = Get-Process | Where-Object { $_.ProcessName -like "*VoiceFlow*" }
foreach ($process in $processes) {
    try {
        Stop-Process -Id $process.Id -Force
        Write-Host "Stopped process: $($process.ProcessName)" -ForegroundColor Green
    } catch {
        Write-Host "Could not stop process: $($process.ProcessName)" -ForegroundColor Yellow
    }
}

# Stop Windows service if exists
Write-Host "Stopping Windows service..." -ForegroundColor Yellow
try {
    Stop-Service -Name "VoiceFlowPro" -Force -ErrorAction Stop
    Write-Host "Stopped service: VoiceFlowPro" -ForegroundColor Green
} catch {
    Write-Host "Service not found or already stopped." -ForegroundColor Gray
}

# Remove from startup
Write-Host "Removing from startup..." -ForegroundColor Yellow
try {
    Remove-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" -Name "VoiceFlow Pro" -ErrorAction Stop
    Write-Host "Removed from startup registry." -ForegroundColor Green
} catch {
    Write-Host "Not found in startup registry." -ForegroundColor Gray
}

# Remove desktop shortcuts
Write-Host "Removing desktop shortcuts..." -ForegroundColor Yellow
$desktopShortcuts = @(
    "$env:USERPROFILE\Desktop\VoiceFlow Pro.lnk",
    "$env:PUBLIC\Desktop\VoiceFlow Pro.lnk"
)

foreach ($shortcut in $desktopShortcuts) {
    if (Test-Path $shortcut) {
        try {
            Remove-Item $shortcut -Force
            Write-Host "Removed: $shortcut" -ForegroundColor Green
        } catch {
            Write-Host "Could not remove: $shortcut" -ForegroundColor Yellow
        }
    }
}

# Remove start menu shortcuts
Write-Host "Removing start menu shortcuts..." -ForegroundColor Yellow
$startMenuPath = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
$shortcuts = @(
    "$startMenuPath\VoiceFlow Pro\VoiceFlow Pro.lnk",
    "$startMenuPath\VoiceFlow Pro\Uninstall.lnk",
    "$startMenuPath\VoiceFlow Pro\Website.lnk",
    "$startMenuPath\VoiceFlow Pro\Documentation.lnk",
    "$startMenuPath\VoiceFlow Pro\Support.lnk"
)

foreach ($shortcut in $shortcuts) {
    if (Test-Path $shortcut) {
        try {
            Remove-Item $shortcut -Force
            Write-Host "Removed: $shortcut" -ForegroundColor Green
        } catch {
            Write-Host "Could not remove: $shortcut" -ForegroundColor Yellow
        }
    }
}

# Remove start menu folder
if (Test-Path "$startMenuPath\VoiceFlow Pro") {
    try {
        Remove-Item "$startMenuPath\VoiceFlow Pro" -Recurse -Force
        Write-Host "Removed start menu folder." -ForegroundColor Green
    } catch {
        Write-Host "Could not remove start menu folder." -ForegroundColor Yellow
    }
}

# Remove installation directory
if (Test-Path $InstallPath) {
    Write-Host "Removing installation directory..." -ForegroundColor Yellow
    try {
        # Remove read-only attributes
        Get-ChildItem -Path $InstallPath -Recurse | ForEach-Object {
            if ($_.Attributes -band [System.IO.FileAttributes]::ReadOnly) {
                $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
            }
        }
        
        Remove-Item $InstallPath -Recurse -Force
        Write-Host "Removed installation directory." -ForegroundColor Green
    } catch {
        Write-Host "Could not remove installation directory. You may need to restart and try again." -ForegroundColor Yellow
    }
}

# Remove user data
if ($RemoveUserData) {
    Write-Host "Removing user data..." -ForegroundColor Yellow
    $userDataPaths = @(
        "$env:LOCALAPPDATA\VoiceFlow Pro",
        "$env:APPDATA\VoiceFlow Pro",
        "$env:USERPROFILE\Documents\VoiceFlow Pro"
    )
    
    foreach ($path in $userDataPaths) {
        if (Test-Path $path) {
            try {
                Remove-Item $path -Recurse -Force
                Write-Host "Removed: $path" -ForegroundColor Green
            } catch {
                Write-Host "Could not remove: $path" -ForegroundColor Yellow
            }
        }
    }
}

# Remove logs
if ($RemoveLogs) {
    Write-Host "Removing log files..." -ForegroundColor Yellow
    $logPaths = @(
        "$env:LOCALAPPDATA\VoiceFlow Pro\logs",
        "$env:APPDATA\VoiceFlow Pro\logs"
    )
    
    foreach ($path in $logPaths) {
        if (Test-Path $path) {
            try {
                Remove-Item $path -Recurse -Force
                Write-Host "Removed: $path" -ForegroundColor Green
            } catch {
                Write-Host "Could not remove: $path" -ForegroundColor Yellow
            }
        }
    }
}

# Remove cache
if ($RemoveCache) {
    Write-Host "Removing cache files..." -ForegroundColor Yellow
    $cachePaths = @(
        "$env:LOCALAPPDATA\VoiceFlow Pro\cache",
        "$env:APPDATA\VoiceFlow Pro\cache"
    )
    
    foreach ($path in $cachePaths) {
        if (Test-Path $path) {
            try {
                Remove-Item $path -Recurse -Force
                Write-Host "Removed: $path" -ForegroundColor Green
            } catch {
                Write-Host "Could not remove: $path" -ForegroundColor Yellow
            }
        }
    }
}

# Remove registry entries
Write-Host "Removing registry entries..." -ForegroundColor Yellow
try {
    Remove-Item -Path "HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\VoiceFlow Pro" -Recurse -Force -ErrorAction Stop
    Write-Host "Removed uninstall registry entry." -ForegroundColor Green
} catch {
    Write-Host "Could not remove uninstall registry entry." -ForegroundColor Yellow
}

try {
    Remove-Item -Path "HKCU:\Software\VoiceFlow Pro" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Removed application registry entries." -ForegroundColor Green
} catch {
    Write-Host "Could not remove application registry entries." -ForegroundColor Gray
}

# Remove Windows service
Write-Host "Removing Windows service..." -ForegroundColor Yellow
try {
    sc.exe delete VoiceFlowPro
    Write-Host "Removed Windows service." -ForegroundColor Green
} catch {
    Write-Host "Could not remove Windows service." -ForegroundColor Gray
}

# Remove firewall exceptions
Write-Host "Removing firewall exceptions..." -ForegroundColor Yellow
try {
    # This would require firewall management permissions
    # Remove-NetFirewallRule -DisplayName "VoiceFlow Pro" -ErrorAction SilentlyContinue
    Write-Host "Firewall exceptions not found or already removed." -ForegroundColor Gray
} catch {
    Write-Host "Could not remove firewall exceptions." -ForegroundColor Gray
}

# Clean up temp files
Write-Host "Cleaning up temporary files..." -ForegroundColor Yellow
$tempFiles = @(
    "$env:TEMP\*VoiceFlow*",
    "$env:LOCALAPPDATA\Temp\*VoiceFlow*"
)

foreach ($pattern in $tempFiles) {
    try {
        Remove-Item $pattern -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Cleaned up: $pattern" -ForegroundColor Green
    } catch {
        Write-Host "Could not clean up: $pattern" -ForegroundColor Gray
    }
}

# Summary
Write-Host ""
Write-Host "=== Uninstallation Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "VoiceFlow Pro has been successfully uninstalled." -ForegroundColor Green

if ($RemoveUserData) {
    Write-Host "User data removed." -ForegroundColor Green
}
if ($RemoveLogs) {
    Write-Host "Log files removed." -ForegroundColor Green
}
if ($RemoveCache) {
    Write-Host "Cache files removed." -ForegroundColor Green
}

Write-Host ""
Write-Host "Thank you for using VoiceFlow Pro!" -ForegroundColor Yellow
Write-Host ""

# Prompt to restart explorer (for shortcuts removal)
if (-not $Silent) {
    $restart = Read-Host "Would you like to restart Windows Explorer to ensure all changes take effect? (y/N)"
    if ($restart -eq "y" -or $restart -eq "Y") {
        Write-Host "Restarting Windows Explorer..." -ForegroundColor Yellow
        Stop-Process -Name explorer -Force
        Start-Sleep 2
        Start-Process explorer
    }
}
