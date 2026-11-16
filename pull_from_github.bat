@echo off
chcp 65001 >nul
cd /d "%~dp0"
title YJ Apps GitHub Pull
echo ====================================================
echo  온라인 금고(GitHub) -> YJ Studio 통합 앱 보관함 내려받기
echo ====================================================
echo.

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [안내] 아직 깃허브 통합 금고 주소가 연결되지 않았습니다.
    echo        먼저 push_to_github.bat을 실행해 주소를 연결해 주세요.
    pause
    exit /b
)

echo 최신 작업본을 내려받는 중...
git pull origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ====================================================
    echo  SUCCESS! 최신 앱 목록으로 동기화되었습니다!
    echo ====================================================
) else (
    echo [ERROR] 내려받기에 실패했습니다. 네트워크 상태나 충돌 여부를 확인해 주세요.
)

echo.
pause
