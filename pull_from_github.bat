@echo off
chcp 65001 >nul
cd /d "%~dp0"
title YJ Apps GitHub Pull
echo ====================================================
echo  온라인 금고(GitHub) → YJ Studio 통합 앱 보관함 내려받기
echo ====================================================
echo.

call :pull_repo "." "YJ Studio 통합 앱 보관함"
if errorlevel 1 goto :fail

if exist "회사홈페이지\.git" (
    echo.
    call :pull_repo "회사홈페이지" "회사홈페이지(yjstudio-digital-craft)"
    if errorlevel 1 goto :fail
)

echo.
echo ====================================================
echo  SUCCESS! 모든 앱과 회사 홈페이지가 최신 상태로 동기화되었습니다!
echo ====================================================
echo.
pause
exit /b 0

:pull_repo
set "REPO_DIR=%~1"
set "REPO_LABEL=%~2"
pushd "%REPO_DIR%"
git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [안내] %REPO_LABEL% 온라인 주소가 연결되지 않았습니다.
    popd
    exit /b 1
)
echo %REPO_LABEL% 최신 작업본을 내려받는 중...
git pull origin main
if errorlevel 1 (
    echo [ERROR] %REPO_LABEL% 내려받기에 실패했습니다.
    popd
    exit /b 1
)
popd
exit /b 0

:fail
echo.
echo [ERROR] 내려받기에 실패했습니다. 네트워크 상태나 충돌 여부를 확인해 주세요.
echo.
pause
exit /b 1
