#!/bin/bash
echo "========================================"
echo "  80天減重計畫 Server"
echo "========================================"
echo

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo "[錯誤] 找不到 Python3，請先安裝"
    exit 1
fi

# 檢查虛擬環境
if [ -d "venv" ]; then
    echo "[1/3] 啟用虛擬環境..."
    source venv/bin/activate
else
    echo "[1/3] 建立虛擬環境..."
    python3 -m venv venv
    source venv/bin/activate
fi

# 安裝依賴
echo "[2/3] 檢查並安裝依賴..."
pip install -q flask gunicorn

# 啟動 Server
echo "[3/3] 啟動 Server..."
echo
echo "服務運行於: http://0.0.0.0:5000"
echo "按 Ctrl+C 停止 Server"
echo

# 使用 gunicorn 啟動（生產模式）
gunicorn -w 4 -b 0.0.0.0:5000 app:app
