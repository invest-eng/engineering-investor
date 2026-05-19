@echo off
chcp 65001 >nul
echo ============================================
echo  Davcni tracker -- FIFO / ZDoh-2
echo ============================================
echo.

REM Preveri ali je Python namesecen
python --version >nul 2>&1
if errorlevel 1 (
    echo NAPAKA: Python ni namesecen ali ni v PATH.
    echo Prenesi ga na https://www.python.org/downloads/
    echo Ob namesccanju izberi "Add Python to PATH".
    pause
    exit /b 1
)

REM Namesti openpyxl ce ga se ni
python -c "import openpyxl" >nul 2>&1
if errorlevel 1 (
    echo Namescam openpyxl ...
    pip install openpyxl --quiet
)

REM Pozeni tracker
echo Pozeni z:  python davek.py --pomoč  za vse moznosti
echo.
python davek.py %*

echo.
pause
