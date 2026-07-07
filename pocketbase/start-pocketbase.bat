@echo off
cd /d "%~dp0"
"%~dp0pocketbase.exe" serve --http=0.0.0.0:8090 >> pocketbase.log 2>&1
