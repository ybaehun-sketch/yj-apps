@echo off
chcp 65001 >nul
title YJ Apps GitHub Push
echo ====================================================
echo  YJ Studio 통합 앱 보관함 -> 온라인 금고(GitHub) 올리기
echo ====================================================
echo.

echo [1/3] 새로 만든 앱과 수정 파일을 포장하는 중...
git add -A

git diff --cached --quiet
if %ERRORLEVEL% NEQ 0 (
    git commit -m "sync: update yj-apps"
    echo       포장 및 저장 완료!
) else (
    echo       새로 바뀐 내용이 없습니다.
)

git remote get-url origin >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [안내] 아직 깃허브 통합 금고 주소가 연결되지 않았습니다.
    echo        깃허브에서 새 보관함 주소를 만드신 뒤 아래에 붙여넣어 주세요.
    set /p REPO_URL=깃허브 주소 입력 (예: https://github.com/.../yj-apps.git): 
    if "%REPO_URL%"=="" (
        echo [취소] 주소가 입력되지 않아 업로드를 건너뜁니다. (컴퓨터 안에는 안전하게 저장되었습니다.)
        pause
        exit /b
    )
    git remote add origin "%REPO_URL%"
)

echo.
echo [2/3] 온라인 금고(GitHub)로 전송 중...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ====================================================
    echo  SUCCESS! 모든 앱이 안전하게 올라갔습니다!
    echo ====================================================
) else (
    echo [ERROR] 전송에 실패했습니다. 인터넷 연결이나 로그인 상태를 확인해 주세요.
)

echo.
pause
