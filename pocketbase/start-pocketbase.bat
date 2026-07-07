@echo off
cd /d "%~dp0"
"%~dp0pocketbase.exe" serve >> pocketbase.log 2>&1
