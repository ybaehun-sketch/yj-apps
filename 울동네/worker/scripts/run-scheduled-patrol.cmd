@echo off
setlocal
cd /d "%~dp0.."
if not exist "logs" mkdir "logs"
echo [%date% %time%] === 울동네 정기 순찰 시작 === >> "logs\scheduled-patrol.log"
call npm run full-patrol >> "logs\scheduled-patrol.log" 2>&1
echo [%date% %time%] === 울동네 정기 순찰 종료 === >> "logs\scheduled-patrol.log"
endlocal
