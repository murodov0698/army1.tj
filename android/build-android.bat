@echo off
cd /d "%~dp0"
if exist "%LOCALAPPDATA%\jdk-17\jdk-17.0.20.1+1\bin\java.exe" (
    set "JAVA_HOME=%LOCALAPPDATA%\jdk-17\jdk-17.0.20.1+1"
)
if not exist "local.properties" (
    echo sdk.dir=%LOCALAPPDATA:\=/%/Android/Sdk> local.properties
)
call gradlew.bat bundleRelease assembleDebug
if errorlevel 1 exit /b 1
echo.
echo Play Market AAB: app\build\outputs\bundle\release\app-release.aab
echo Телефон APK: app\build\outputs\apk\debug\app-debug.apk
