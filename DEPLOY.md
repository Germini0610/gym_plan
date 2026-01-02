# 80天減重計畫 - 部署指南

## 系統需求

- Python 3.8+
- pip

## 部署步驟

### 1. 克隆專案

```bash
git clone git@github.com:Germini0610/gym_plan.git
cd gym_plan
```

### 2. 建立虛擬環境（建議）

```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. 安裝依賴

```bash
pip install -r requirements.txt
pip install gunicorn  # 生產環境 WSGI 伺服器
```

### 4. 啟動服務

#### 方式一：直接使用 Gunicorn（推薦）

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

參數說明：
- `-w 4`：4 個 worker 進程
- `-b 0.0.0.0:5000`：綁定所有網卡的 5000 port

#### 方式二：使用啟動腳本

```bash
chmod +x start.sh
./start.sh
```

#### 方式三：開發模式

```bash
python app.py
```

---

## 使用 Systemd 管理服務（生產環境推薦）

### 1. 建立 systemd 服務檔

```bash
sudo nano /etc/systemd/system/gym-plan.service
```

內容如下（請根據實際路徑修改）：

```ini
[Unit]
Description=80天減重計畫 Flask App
After=network.target

[Service]
User=你的用戶名
WorkingDirectory=/path/to/gym_plan
Environment="PATH=/path/to/gym_plan/venv/bin"
ExecStart=/path/to/gym_plan/venv/bin/gunicorn -w 4 -b 0.0.0.0:5000 app:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 2. 啟用並啟動服務

```bash
sudo systemctl daemon-reload
sudo systemctl enable gym-plan
sudo systemctl start gym-plan
```

### 3. 常用管理指令

```bash
# 查看狀態
sudo systemctl status gym-plan

# 重啟服務
sudo systemctl restart gym-plan

# 查看日誌
sudo journalctl -u gym-plan -f
```

---

## 防火牆設定

如果需要從外部訪問，請開放 5000 port：

```bash
# Ubuntu/Debian (ufw)
sudo ufw allow 5000

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

---

## 訪問應用

部署完成後，透過以下方式訪問：

- 本機：http://localhost:5000
- 區網：http://你的IP:5000

---

## 資料庫說明

- 使用 SQLite，資料庫檔案為 `fitness.db`
- 首次啟動會自動建立資料庫並插入預設資料
- 如需重置資料庫，刪除 `fitness.db` 後重啟服務

---

## 更新部署

```bash
cd /path/to/gym_plan
git pull
sudo systemctl restart gym-plan
```
