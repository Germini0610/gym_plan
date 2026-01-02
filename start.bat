@echo off
chcp 65001 >nul
echo ========================================
echo   80天減重計畫 Server
echo ========================================
echo.

:: 檢查 Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [錯誤] 找不到 Python，請先安裝 Python
    pause
    exit /b 1
)

:: 安裝依賴
echo [1/2] 檢查並安裝依賴...
pip install -q flask

:: 啟動 Server
echo [2/2] 啟動 Server...
echo.
echo 請開啟瀏覽器訪問: http://127.0.0.1:5000
echo 按 Ctrl+C 停止 Server
echo.
python app.py
