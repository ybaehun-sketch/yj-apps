Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d C:\dev\yj-apps\울동네\worker && npm run korean-relay > C:\dev\yj-apps\울동네\worker\.korean-relay.log 2>&1", 0, True
