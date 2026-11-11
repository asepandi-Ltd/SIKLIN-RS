@echo off
chcp 65001 >nul
title SIPAKAR - RSUD AL-MULK KOTA SUKABUMI
cd /d "%~dp0"

set "PATH=C:\Program Files\nodejs;%PATH%"

echo ===================================================================
echo     SIPAKAR - RSUD AL-MULK KOTA SUKABUMI
echo     SISTEM PELAPORAN KINERJA PENUNJANG
echo ===================================================================
echo [1/3] Menyiapkan runtime Node.js...

REM Periksa apakah Node.js tersedia
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js tidak ditemukan di PATH maupun C:\Program Files\nodejs.
    echo Silakan pastikan Node.js terinstal.
    pause
    exit /b 1
)

REM Periksa apakah port 3030 sudah berjalan
echo [2/3] Memeriksa status server lokal localhost:3030...
netstat -ano | findstr /R /C:":3030 .*LISTENING" >nul
if %errorlevel% equ 0 (
    echo [INFO] Server SIPAKAR sudah aktif di port 3030!
    goto get_ip
)

echo [INFO] Menyalakan server aplikasi di http://localhost:3030 ...
start "Server SIPAKAR RS" /min "C:\Program Files\nodejs\npm.cmd" run dev

REM Tunggu beberapa detik hingga server aktif
:wait_loop
timeout /t 2 /nobreak >nul
netstat -ano | findstr /R /C:":3030 .*LISTENING" >nul
if %errorlevel% neq 0 (
    echo [INFO] Menunggu server siap menerima koneksi...
    goto wait_loop
)

:get_ip
set "CURRENT_IP="
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /r /c:"IPv4.*192\." /c:"IPv4.*172\." /c:"IPv4.*10\."') do (
    if not defined CURRENT_IP (
        for /f "tokens=1" %%b in ("%%a") do set "CURRENT_IP=%%b"
    )
)

:launch_browser
echo [3/3] Membuka aplikasi SIPAKAR di peramban web (browser)...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:3030"
) else (
    start "" "http://localhost:3030"
)

echo ===================================================================
echo   BERHASIL AKTIF!
echo.
echo   [1] Akses dari Laptop Ini:
echo       http://localhost:3030
echo.
if defined CURRENT_IP (
echo   [2] Akses dari HP / Perangkat Lain di Jaringan yang Sama:
echo       http://%CURRENT_IP%:3030
) else (
echo   [2] Akses Jaringan: Periksa IP dengan perintah ipconfig
)
echo.
echo   * Pastikan HP/perangkat lain terhubung ke Wi-Fi yang sama (@SIMRS-AL-MULK).
echo   * Jangan tutup jendela ini selama Anda menggunakan aplikasi.
echo ===================================================================
pause
