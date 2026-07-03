; VoiceFlow Pro NSIS Installer Script
; This script creates a Windows installer for VoiceFlow Pro using NSIS

!define APP_NAME "VoiceFlow Pro"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "VoiceFlow Pro Team"
!define APP_URL "https://voiceflow.pro"
!define APP_EXE "VoiceFlow Pro.exe"
!define APP_DIR "VoiceFlow Pro"
!define INSTALL_DIR "$PROGRAMFILES64\${APP_DIR}"

; Modern UI Settings
!include "MUI2.nsh"

; General Settings
Name "${APP_NAME}"
OutFile "VoiceFlowProSetup.exe"
InstallDir "${INSTALL_DIR}"
InstallDirRegKey HKLM "Software\${APP_NAME}" ""
RequestExecutionLevel admin

; Version Information
VIProductVersion "${APP_VERSION}"
VIAddVersionKey "ProductName" "${APP_NAME}"
VIAddVersionKey "ProductVersion" "${APP_VERSION}"
VIAddVersionKey "CompanyName" "${APP_PUBLISHER}"
VIAddVersionKey "FileDescription" "${APP_NAME} Installer"
VIAddVersionKey "FileVersion" "${APP_VERSION}"
VIAddVersionKey "LegalCopyright" "© ${APP_PUBLISHER}"

; Interface Settings
!define MUI_ABORTWARNING
!define MUI_ICON "${NSISDIR}\Contrib\Graphics\Icons\modern-install-blue.ico"
!define MUI_UNICON "${NSISDIR}\Contrib\Graphics\Icons\modern-uninstall-blue.ico"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE"
!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_WELCOME
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

; Languages
!insertmacro MUI_LANGUAGE "English"

; Version Information
!define VERSION "1.0.0"

; Installer Sections
Section "Main Application" SecMain
    SectionIn RO
    
    ; Set output path to the installation directory
    SetOutPath $INSTDIR
    
    ; Put files there
    File /r "VoiceFlow Pro.exe"
    File /r "resources"
    File /r "bin"
    
    ; Store installation folder
    WriteRegStr HKLM "Software\${APP_NAME}" "" $INSTDIR
    
    ; Create uninstaller
    WriteUninstaller "$INSTDIR\Uninstall.exe"
    
    ; Add uninstall information to Windows
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\Uninstall.exe"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "InstallLocation" "$INSTDIR"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayIcon" "$INSTDIR\${APP_EXE}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoModify" "1"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "NoRepair" "1"
    WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "EstimatedSize" "50000"
    
    ; Add to ARP
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "HelpLink" "${APP_URL}/support"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "URLInfoAbout" "${APP_URL}"
    
    ; Create desktop shortcut
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0
    CreateShortCut "$DESKTOP\${APP_NAME} Website.lnk" "${APP_URL}" "" "" 0
    
    ; Create start menu shortcuts
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Website.lnk" "${APP_URL}"
    
    ; Add to start menu
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Documentation.lnk" "${APP_URL}/docs"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Support.lnk" "${APP_URL}/support"
    
SectionEnd

Section "Desktop Shortcut" SecDesktop
    ; Create desktop shortcut
    CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}" "" "$INSTDIR\${APP_EXE}" 0
SectionEnd

Section "Start Menu Shortcuts" SecStartMenu
    ; Create start menu shortcuts
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${APP_EXE}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\Uninstall.exe"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Website.lnk" "${APP_URL}"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Documentation.lnk" "${APP_URL}/docs"
    CreateShortCut "$SMPROGRAMS\${APP_NAME}\Support.lnk" "${APP_URL}/support"
SectionEnd

Section "Registry Run Entry" SecRegistry
    ; Add to Windows Registry for system integration
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_NAME}" "$INSTDIR\${APP_EXE}"
SectionEnd

Section "Firewall Exception" SecFirewall
    ; Add firewall exception for the application
    ; This would require firewall management permissions
    ; WriteRegStr HKLM "SYSTEM\CurrentControlSet\Services\SharedAccess\Parameters\FirewallPolicy\StandardProfile\AuthorizedApplications\List" "${INSTDIR}\${APP_EXE}" "${INSTDIR}\${APP_EXE}:*:Enabled:VoiceFlow Pro"
SectionEnd

; Uninstaller Section
Section "Uninstall"
    ; Remove registry entries
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Run\${APP_NAME}"
    
    ; Remove shortcuts
    Delete "$DESKTOP\${APP_NAME}.lnk"
    Delete "$DESKTOP\${APP_NAME} Website.lnk"
    RMDir /r "$SMPROGRAMS\${APP_NAME}"
    
    ; Remove files
    RMDir /r "$INSTDIR"
    
    ; Remove uninstaller
    Delete "$INSTDIR\Uninstall.exe"
SectionEnd

; Installation Functions
Function .onInit
    ; Check if application is already installed
    ReadRegStr $R0 HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString"
    StrCmp $R0 "" done
    
    MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION "A previous version of ${APP_NAME} is already installed.$\n$\nClick OK to remove the previous version or Cancel to cancel this installation." IDOK uninst
    
    ; Run uninstaller
    ClearErrors
    ExecWait '$R0 _?=$INSTDIR'
    IfErrors no_remove_uninstaller done
    
    no_remove_uninstaller:
        ; Don't delete uninstaller now, will be removed after file deletion
        Goto done
    
    uninst:
        ; Abort installation
        Abort
    
    done:
FunctionEnd

; Post-Installation Function
Function .onInstSuccess
    ; Send installation success notification
    ; This could trigger a welcome message or start the application
    
    ; Optionally start the application
    ; ExecWait '"$INSTDIR\${APP_EXE}"'
FunctionEnd
