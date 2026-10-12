.DEFAULT_GOAL := server
.PHONY: server

# Start or reuse the course server in the background.
server:
	powershell.exe -NoProfile -ExecutionPolicy Bypass -File "./Open-Course.ps1" -NoBrowser
