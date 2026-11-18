@echo off
chcp 65001 >nul
cd /d "%~dp0"
title YJ Apps GitHub Push
echo ====================================================
echo  YJ Studio 통합 앱 보관함 → 온라인 금고(GitHub) 올리기
echo ====================================================
echo.

git config user.name >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 이 컴퓨터에 작성자 이름이 등록되지 않았습니다.
    pause
    exit /b 1
)
git config user.email >nul 2>&1
if errorlevel 1 (
    echo [ERROR] 이 컴퓨터에 작성자 이메일이 등록되지 않았습니다.
    pause
    exit /b 1
)

call :push_repo "." "YJ Studio 통합 앱 보관함" "sync: update yj-apps"
if errorlevel 1 goto :fail

if exist "회사홈페이지\.git" (
    echo.
    call :push_repo "회사홈페이지" "회사홈페이지(yjstudio-digital-craft)" "sync: update 회사홈페이지"
    if errorlevel 1 goto :fail
)

echo.
echo ====================================================
echo  SUCCESS! 모든 앱과 회사 홈페이지가 안전하게 올라갔습니다!
echo ====================================================
echo.
pause
exit /b 0

:push_repo
set "REPO_DIR=%~1"
set "REPO_LABEL=%~2"
set "COMMIT_MSG=%~3"
pushd "%REPO_DIR%"
echo [1/2] %REPO_LABEL% 포장하는 중...
git add -A
git diff --cached --quiet
if errorlevel 1 (
    git commit -m "%COMMIT_MSG%"
    if errorlevel 1 (
        echo [ERROR] %REPO_LABEL% 저장에 실패해 업로드를 중단합니다.
        popd
        exit /b 1
    )
    echo       포장 및 저장 완료!
) else (
    echo       새로 바뀐 내용이 없습니다.
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [안내] %REPO_LABEL% 온라인 주소가 연결되지 않았습니다.
    popd
    exit /b 1
)

echo [2/2] %REPO_LABEL% 온라인 금고(GitHub)로 전송 중...
git push -u origin main
if errorlevel 1 (
    echo [ERROR] %REPO_LABEL% 전송에 실패했습니다.
    popd
    exit /b 1
)
popd
exit /b 0

:fail
echo.
echo [ERROR] 전송에 실패했습니다. 인터넷 연결이나 로그인 상태를 확인해 주세요.
echo.
pause
exit /b 1
