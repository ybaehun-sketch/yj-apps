$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$cmdPath = Join-Path $scriptDir "run-scheduled-patrol.cmd"

if (-not (Test-Path $cmdPath)) {
  throw "실행 파일을 찾을 수 없습니다: $cmdPath"
}

$actionArg = "`"$cmdPath`""

# 월~금 오전 11:10 순찰
schtasks /Create /TN "Uldongne_Patrol_1110" /TR $actionArg /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 11:10 /F | Out-Null

# 월~금 오후 17:10 순찰 + 블로그 초안 작성
schtasks /Create /TN "Uldongne_Patrol_1710" /TR $actionArg /SC WEEKLY /D MON,TUE,WED,THU,FRI /ST 17:10 /F | Out-Null

Write-Host "등록 완료: 평일(월~금) 오전 11:10 / 오후 17:10 울동네 자동 순찰 예약됨"
schtasks /Query /TN "Uldongne_Patrol_1110" /FO LIST | Select-String "TaskName|Next Run Time|Schedule Type"
schtasks /Query /TN "Uldongne_Patrol_1710" /FO LIST | Select-String "TaskName|Next Run Time|Schedule Type"
