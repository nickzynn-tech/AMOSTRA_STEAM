@echo off
cd /d "%~dp0"
python test_ai_interativo.py
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar. Verifique se o Python esta instalado.
)
pause
