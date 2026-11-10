; Per-user Explorer verb. Runtime registration refreshes the label and exe path.
!macro customInstall
  WriteRegStr HKCU "Software\Classes\*\shell\StillNote" "" "发送到 StillNote"
  WriteRegStr HKCU "Software\Classes\*\shell\StillNote" "Icon" "$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\",0"
  WriteRegStr HKCU "Software\Classes\*\shell\StillNote" "MultiSelectModel" "Document"
  WriteRegStr HKCU "Software\Classes\*\shell\StillNote\command" "" "$\"$INSTDIR\${APP_EXECUTABLE_FILENAME}$\" --share-file $\"%1$\""
!macroend

!macro customUnInstall
  DeleteRegKey HKCU "Software\Classes\*\shell\StillNote"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "StillNote"
  ClearErrors
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\Run" "StillNote"
  ClearErrors
!macroend
