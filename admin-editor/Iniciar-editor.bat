@echo off
color 0a
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js. Instala la version LTS desde https://nodejs.org/ y vuelve a abrir este archivo.
  pause
  exit /b 1
)
node admin-server.js
if errorlevel 1 (
  echo.
  echo El editor se cerro con un error. Revisa el mensaje anterior.
  pause
)