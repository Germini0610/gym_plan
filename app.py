"""
80天減重計畫 - Flask 應用程式
"""

from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from functools import wraps
from database import init_db, get_db
import json
import os

app = Flask(__name__, static_folder='static', static_url_path='', template_folder='templates')
app.config['JSON_AS_ASCII'] = False
app.secret_key = os.environ.get('SECRET_KEY', 'fitness-plan-secret-key-2024')

# 登入設定
ADMIN_USERNAME = 'admin'
ADMIN_PASSWORD = 'aa552300'

# 初始化資料庫
init_db()


# ==================== 登入驗證 ====================

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not session.get('logged_in'):
            return redirect('login')
        return f(*args, **kwargs)
    return decorated_function


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            session['logged_in'] = True
            return redirect('./')
        else:
            error = '帳號或密碼錯誤'
    return render_template('login.html', error=error)


@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect('login')


# ==================== 頁面路由 ====================

@app.route('/')
@login_required
def index():
    return render_template('index.html')


# ==================== 菜單 API ====================

@app.route('/api/meals', methods=['GET'])
def get_meals():
    """取得所有菜單"""
    db = get_db()
    meals = db.execute('''
        SELECT * FROM meals ORDER BY meal_type, id
    ''').fetchall()
    return jsonify([dict(row) for row in meals])


@app.route('/api/meals', methods=['POST'])
def add_meal():
    """新增菜單"""
    data = request.json
    db = get_db()
    cursor = db.execute('''
        INSERT INTO meals (name, meal_type, ingredients, calories, protein)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['name'], data['meal_type'], data['ingredients'],
          data['calories'], data['protein']))
    db.commit()
    return jsonify({'id': cursor.lastrowid, 'message': '新增成功'})


@app.route('/api/meals/<int:meal_id>', methods=['PUT'])
def update_meal(meal_id):
    """更新菜單"""
    data = request.json
    db = get_db()
    db.execute('''
        UPDATE meals SET name=?, meal_type=?, ingredients=?, calories=?, protein=?
        WHERE id=?
    ''', (data['name'], data['meal_type'], data['ingredients'],
          data['calories'], data['protein'], meal_id))
    db.commit()
    return jsonify({'message': '更新成功'})


@app.route('/api/meals/<int:meal_id>', methods=['DELETE'])
def delete_meal(meal_id):
    """刪除菜單"""
    db = get_db()
    db.execute('DELETE FROM meals WHERE id=?', (meal_id,))
    db.commit()
    return jsonify({'message': '刪除成功'})


# ==================== 每日飲食記錄 API ====================

@app.route('/api/daily-meals', methods=['GET'])
def get_daily_meals():
    """取得指定日期的飲食記錄"""
    date = request.args.get('date')
    db = get_db()
    records = db.execute('''
        SELECT * FROM daily_meals WHERE date=? ORDER BY
        CASE meal_type
            WHEN 'breakfast' THEN 1
            WHEN 'lunch' THEN 2
            WHEN 'dinner' THEN 3
        END
    ''', (date,)).fetchall()
    return jsonify([dict(row) for row in records])


@app.route('/api/daily-meals', methods=['POST'])
def add_daily_meal():
    """記錄今日吃了什麼"""
    data = request.json
    db = get_db()
    cursor = db.execute('''
        INSERT INTO daily_meals (date, meal_type, meal_id, meal_name)
        VALUES (?, ?, ?, ?)
    ''', (data['date'], data['meal_type'], data.get('meal_id'), data['meal_name']))
    db.commit()
    return jsonify({'id': cursor.lastrowid, 'message': '記錄成功'})


@app.route('/api/daily-meals/<int:record_id>', methods=['DELETE'])
def delete_daily_meal(record_id):
    """刪除飲食記錄"""
    db = get_db()
    db.execute('DELETE FROM daily_meals WHERE id=?', (record_id,))
    db.commit()
    return jsonify({'message': '刪除成功'})


@app.route('/api/daily-meals/clear', methods=['POST'])
def clear_daily_meals():
    """清除指定日期的某餐記錄"""
    data = request.json
    db = get_db()
    db.execute('''
        DELETE FROM daily_meals WHERE date=? AND meal_type=?
    ''', (data['date'], data['meal_type']))
    db.commit()
    return jsonify({'message': '清除成功'})


@app.route('/api/daily-meals/history', methods=['GET'])
def get_meal_history():
    """取得所有飲食記錄歷史（按日期分組）"""
    db = get_db()
    records = db.execute('''
        SELECT * FROM daily_meals ORDER BY date DESC,
        CASE meal_type
            WHEN 'breakfast' THEN 1
            WHEN 'lunch' THEN 2
            WHEN 'dinner' THEN 3
        END
    ''').fetchall()
    return jsonify([dict(row) for row in records])


# ==================== 採買清單 API ====================

@app.route('/api/shopping', methods=['GET'])
def get_shopping():
    """取得採買清單"""
    db = get_db()
    items = db.execute('''
        SELECT * FROM shopping_list ORDER BY category, id
    ''').fetchall()
    return jsonify([dict(row) for row in items])


@app.route('/api/shopping', methods=['POST'])
def add_shopping_item():
    """新增採買項目"""
    data = request.json
    db = get_db()
    cursor = db.execute('''
        INSERT INTO shopping_list (name, category, brand, spec, price, weekly_amount, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (data['name'], data['category'], data.get('brand', ''), data.get('spec', ''),
          data.get('price', ''), data.get('weekly_amount', ''), data.get('note', '')))
    db.commit()
    return jsonify({'id': cursor.lastrowid, 'message': '新增成功'})


@app.route('/api/shopping/<int:item_id>', methods=['PUT'])
def update_shopping_item(item_id):
    """更新採買項目"""
    data = request.json
    db = get_db()
    db.execute('''
        UPDATE shopping_list SET name=?, category=?, brand=?, spec=?, price=?, weekly_amount=?, note=?
        WHERE id=?
    ''', (data['name'], data['category'], data.get('brand', ''), data.get('spec', ''),
          data.get('price', ''), data.get('weekly_amount', ''), data.get('note', ''), item_id))
    db.commit()
    return jsonify({'message': '更新成功'})


@app.route('/api/shopping/<int:item_id>', methods=['DELETE'])
def delete_shopping_item(item_id):
    """刪除採買項目"""
    db = get_db()
    db.execute('DELETE FROM shopping_list WHERE id=?', (item_id,))
    db.commit()
    return jsonify({'message': '刪除成功'})


# ==================== 體重追蹤 API ====================

@app.route('/api/weight', methods=['GET'])
def get_weight_records():
    """取得體重記錄"""
    db = get_db()
    records = db.execute('''
        SELECT * FROM weight_records ORDER BY date DESC
    ''').fetchall()
    return jsonify([dict(row) for row in records])


@app.route('/api/weight', methods=['POST'])
def add_weight_record():
    """新增體重記錄"""
    data = request.json
    db = get_db()

    # 檢查是否已有今天的記錄
    existing = db.execute(
        'SELECT id FROM weight_records WHERE date=?', (data['date'],)
    ).fetchone()

    if existing:
        db.execute('''
            UPDATE weight_records SET weight=?, day=? WHERE date=?
        ''', (data['weight'], data.get('day', 1), data['date']))
    else:
        db.execute('''
            INSERT INTO weight_records (date, weight, day)
            VALUES (?, ?, ?)
        ''', (data['date'], data['weight'], data.get('day', 1)))

    db.commit()
    return jsonify({'message': '記錄成功'})


@app.route('/api/weight/<int:record_id>', methods=['DELETE'])
def delete_weight_record(record_id):
    """刪除體重記錄"""
    db = get_db()
    db.execute('DELETE FROM weight_records WHERE id=?', (record_id,))
    db.commit()
    return jsonify({'message': '刪除成功'})


# ==================== 每日檢查 API ====================

@app.route('/api/checklist', methods=['GET'])
def get_checklist():
    """取得今日檢查清單狀態"""
    date = request.args.get('date')
    db = get_db()
    items = db.execute('''
        SELECT * FROM daily_checklist WHERE date=?
    ''', (date,)).fetchall()
    return jsonify([dict(row) for row in items])


@app.route('/api/checklist', methods=['POST'])
def update_checklist():
    """更新檢查清單項目"""
    data = request.json
    db = get_db()

    existing = db.execute('''
        SELECT id FROM daily_checklist WHERE date=? AND item_key=?
    ''', (data['date'], data['item_key'])).fetchone()

    if existing:
        db.execute('''
            UPDATE daily_checklist SET checked=? WHERE id=?
        ''', (data['checked'], existing['id']))
    else:
        db.execute('''
            INSERT INTO daily_checklist (date, item_key, checked)
            VALUES (?, ?, ?)
        ''', (data['date'], data['item_key'], data['checked']))

    db.commit()
    return jsonify({'message': '更新成功'})


# ==================== 運動計畫 API ====================

@app.route('/api/exercise', methods=['GET'])
def get_exercise():
    """取得運動參數"""
    db = get_db()
    exercises = db.execute('SELECT * FROM exercise_params ORDER BY id').fetchall()
    return jsonify([dict(row) for row in exercises])


@app.route('/api/exercise', methods=['POST'])
def add_exercise():
    """新增運動項目"""
    data = request.json
    db = get_db()
    cursor = db.execute('''
        INSERT INTO exercise_params (name, duration, intensity, distance, calories)
        VALUES (?, ?, ?, ?, ?)
    ''', (data['name'], data['duration'], data['intensity'],
          data['distance'], data['calories']))
    db.commit()
    return jsonify({'id': cursor.lastrowid, 'message': '新增成功'})


@app.route('/api/exercise/<int:exercise_id>', methods=['PUT'])
def update_exercise(exercise_id):
    """更新運動項目"""
    data = request.json
    db = get_db()
    db.execute('''
        UPDATE exercise_params SET name=?, duration=?, intensity=?, distance=?, calories=?
        WHERE id=?
    ''', (data['name'], data['duration'], data['intensity'],
          data['distance'], data['calories'], exercise_id))
    db.commit()
    return jsonify({'message': '更新成功'})


@app.route('/api/exercise/<int:exercise_id>', methods=['DELETE'])
def delete_exercise(exercise_id):
    """刪除運動項目"""
    db = get_db()
    db.execute('DELETE FROM exercise_params WHERE id=?', (exercise_id,))
    db.commit()
    return jsonify({'message': '刪除成功'})


# ==================== 設定 API ====================

@app.route('/api/settings', methods=['GET'])
def get_settings():
    """取得設定"""
    db = get_db()
    settings = db.execute('SELECT * FROM settings').fetchall()
    return jsonify({row['key']: row['value'] for row in settings})


@app.route('/api/settings', methods=['POST'])
def update_settings():
    """更新設定"""
    data = request.json
    db = get_db()
    for key, value in data.items():
        db.execute('''
            INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)
        ''', (key, str(value)))
    db.commit()
    return jsonify({'message': '設定已更新'})


if __name__ == '__main__':
    print("="*50)
    print("80天減重計畫 Server")
    print("請開啟瀏覽器訪問: http://127.0.0.1:5000")
    print("="*50)
    app.run(debug=True, host='127.0.0.1', port=5000)
