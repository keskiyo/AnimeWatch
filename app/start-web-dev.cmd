@echo off
setlocal
cd /d "%~dp0"

if not exist node_modules (
  bun install
)

bun run dev
pause
