"""
資料庫初始化與管理
"""

import sqlite3
import os

DATABASE = 'fitness.db'


def get_db():
    """取得資料庫連線"""
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db


def init_db():
    """初始化資料庫"""
    db = get_db()

    # 建立資料表
    db.executescript('''
        -- 菜單表
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            meal_type TEXT NOT NULL,  -- breakfast, lunch, dinner
            ingredients TEXT,
            calories INTEGER,
            protein INTEGER
        );

        -- 採買清單表
        CREATE TABLE IF NOT EXISTS shopping_list (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,  -- protein, vegetable, carb, oil, seasoning, drink, supplement
            brand TEXT,     -- 品牌/廠商
            spec TEXT,
            price TEXT,
            weekly_amount TEXT,
            note TEXT
        );

        -- 每日飲食記錄表
        CREATE TABLE IF NOT EXISTS daily_meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            meal_type TEXT NOT NULL,  -- breakfast, lunch, dinner
            meal_id INTEGER,
            meal_name TEXT,
            FOREIGN KEY (meal_id) REFERENCES meals(id)
        );

        -- 體重記錄表
        CREATE TABLE IF NOT EXISTS weight_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            weight REAL NOT NULL,
            day INTEGER
        );

        -- 每日檢查清單表
        CREATE TABLE IF NOT EXISTS daily_checklist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            item_key TEXT NOT NULL,
            checked INTEGER DEFAULT 0,
            UNIQUE(date, item_key)
        );

        -- 運動參數表
        CREATE TABLE IF NOT EXISTS exercise_params (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            duration TEXT,
            intensity TEXT,
            distance TEXT,
            calories TEXT
        );

        -- 設定表
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        );
    ''')

    # 檢查是否需要初始化預設資料
    cursor = db.execute('SELECT COUNT(*) FROM meals')
    if cursor.fetchone()[0] == 0:
        insert_default_data(db)

    db.commit()
    db.close()


def insert_default_data(db):
    """插入預設資料"""

    # 預設設定
    settings = [
        ('start_weight', '119'),
        ('target_weight', '99'),
        ('bmr', '2300'),
        ('daily_calories_min', '1800'),
        ('daily_calories_max', '2200'),
        ('protein_target', '180-220'),
        ('whey_brand', 'MARS 水解乳清隨手包'),
        ('whey_spec', '35g/包，26g蛋白質'),
    ]
    db.executemany('INSERT INTO settings (key, value) VALUES (?, ?)', settings)

    # 預設運動參數
    exercises = [
        ('快走', '40-50 分鐘', '5.5-6.0 km/h', '3.5-5.0 km', '250-350 kcal'),
        ('飛輪', '30-40 分鐘', '70-85 RPM / 阻力 3-5', '10-15 km', '250-350 kcal'),
        ('游泳', '30-40 分鐘', '休閒配速', '800-1200 m', '300-400 kcal'),
    ]
    db.executemany('''
        INSERT INTO exercise_params (name, duration, intensity, distance, calories)
        VALUES (?, ?, ?, ?, ?)
    ''', exercises)

    # 預設早餐菜單
    breakfast_meals = [
        ('經典雞胸蛋', 'breakfast', '雞胸肉 200g, 水煮蛋 2顆, 希臘優格 150g, 黑咖啡 1杯', 495, 73),
        ('燕麥優格碗', 'breakfast', '燕麥片 60g, 希臘優格 200g, MARS水解乳清 1包, 藍莓 50g', 570, 54),
        ('蛋白煎餅', 'breakfast', '蛋白 5顆, 全蛋 2顆, 燕麥粉 40g, 希臘優格 150g', 505, 50),
        ('日式早餐', 'breakfast', '鮭魚 150g, 水煮蛋 2顆, 小黃瓜 100g, 味噌湯 1碗', 470, 46),
        ('高蛋白奶昔', 'breakfast', 'MARS水解乳清 2包, 無糖豆漿 400ml, 燕麥片 50g, 花生醬 15g', 690, 75),
        ('蛋捲+雞胸', 'breakfast', '全蛋 3顆, 蛋白 2顆, 雞胸肉 150g, 菠菜 80g, 起司絲 20g', 505, 67),
        ('希臘優格碗', 'breakfast', '希臘優格 300g, MARS水解乳清 1包, 堅果 20g, 黑咖啡 1杯', 525, 60),
    ]

    # 預設午餐菜單
    lunch_meals = [
        ('雞胸便當', 'lunch', '糙米飯 180g, 雞胸肉 350g, 青花菜 250g, 橄欖油 1湯匙', 790, 92),
        ('鮭魚餐', 'lunch', '地瓜 200g, 鮭魚 250g, 蘆筍 200g, 檸檬汁', 670, 57),
        ('雞腿排餐', 'lunch', '紫米飯 180g, 去骨雞腿排 300g, 四季豆 250g, 蒜頭', 680, 70),
        ('蝦仁炒飯', 'lunch', '糙米飯 180g, 蝦仁 300g, 蛋 2顆, 青菜 150g', 725, 83),
        ('牛肉沙拉碗', 'lunch', '瘦牛肉 300g, 綜合生菜 200g, 酪梨 50g, 橄欖油+醋', 660, 74),
        ('鯛魚定食', 'lunch', '糙米飯 180g, 鯛魚 350g, 味噌湯 1碗, 燙青菜 200g', 640, 89),
        ('雞肉蔬菜咖哩', 'lunch', '花椰菜米 250g, 雞胸肉 350g, 咖哩粉+椰奶, 蔬菜丁 150g', 610, 90),
        ('墨西哥雞肉碗', 'lunch', '糙米飯 150g, 雞胸肉絲 350g, 黑豆 50g, 酪梨+莎莎醬', 710, 91),
        ('豆腐雞肉鍋', 'lunch', '板豆腐 250g, 雞胸肉 300g, 蔬菜 350g, 蛋 2顆', 860, 106),
        ('牛肉燴飯', 'lunch', '糙米飯 180g, 牛腱肉 300g, 洋蔥+蘑菇, 青菜 150g', 732, 78),
        ('豬里肌便當', 'lunch', '糙米飯 180g, 豬里肌 300g, 青花菜 200g, 蒜炒', 720, 75),
    ]

    # 預設晚餐菜單
    dinner_meals = [
        ('清蒸雞胸', 'dinner', '雞胸肉 350g, 花椰菜 250g, 水煮蛋 1顆', 545, 93),
        ('烤鮭魚', 'dinner', '鮭魚 300g, 蘆筍 250g, 小番茄 100g', 610, 66),
        ('蒜香蝦', 'dinner', '蝦仁 350g, 青花菜 250g, 蒜頭+橄欖油', 555, 82),
        ('雞肉沙拉', 'dinner', '雞胸肉 350g, 綜合生菜 250g, 酪梨 50g, 水煮蛋 1顆', 620, 90),
        ('鯛魚清蒸', 'dinner', '鯛魚 400g, 薑絲+蔥花, 菠菜 250g', 482, 96),
        ('豆腐雞肉', 'dinner', '雞胸肉 300g, 板豆腐 250g, 青菜 250g', 605, 94),
        ('牛肉蔬菜', 'dinner', '瘦牛肉 350g, 甜椒 150g, 洋蔥+蘑菇', 637, 86),
        ('蛋白歐姆蛋', 'dinner', '蛋白 8顆, 全蛋 2顆, 雞胸肉丁 250g, 蔬菜丁+起司', 695, 107),
        ('韓式泡菜雞', 'dinner', '雞胸肉 350g, 泡菜 150g, 豆腐 150g, 蛋 1顆', 604, 101),
        ('牛排蔬菜', 'dinner', '牛排 350g, 櫛瓜 200g, 番茄+蘑菇', 617, 87),
        ('蒜香豬排', 'dinner', '豬里肌 350g, 蒜片, 青花菜 250g', 580, 82),
    ]

    db.executemany('''
        INSERT INTO meals (name, meal_type, ingredients, calories, protein)
        VALUES (?, ?, ?, ?, ?)
    ''', breakfast_meals + lunch_meals + dinner_meals)

    # 預設採買清單 - 蛋白質 (name, category, brand, spec, price, weekly_amount, note)
    protein_items = [
        ('雞胸肉（生）', 'protein', '卜蜂 Betagro', '2.5kg/包（6塊裝，冷凍區）', 'NT$ 350-400', '3包', '每餐1塊約400g，藍色包裝'),
        ('雞腿排（去骨）', 'protein', '卜蜂 Betagro', '2kg/包（冷凍區）', 'NT$ 380-420', '1包', '綠色包裝，變化用'),
        ('牛肋條/牛腱', 'protein', '美國 USDA Choice', '1.5kg/包（冷凍區）', 'NT$ 650-800', '1包', '紅肉補鐵'),
        ('牛絞肉（瘦）', 'protein', '美國 USDA', '2kg/包（冷凍區）', 'NT$ 550-650', '0.5包', '快速料理'),
        ('豬里肌肉', 'protein', '台灣豬', '2kg/包（冷藏區）', 'NT$ 350-450', '1包', '最瘦，適合煎炒'),
        ('豬腰內肉', 'protein', '台灣豬', '1kg/包（冷藏區）', 'NT$ 300-400', '0.5包', '超瘦，口感嫩'),
        ('鮭魚輪切', 'protein', '智利/挪威', '1kg/包（冷凍區）', 'NT$ 550-650', '0.5包', 'Omega-3 來源'),
        ('鯛魚片', 'protein', '台灣養殖', '1kg/包（冷凍區）', 'NT$ 350-400', '0.5包', '低脂白肉魚'),
        ('蝦仁', 'protein', 'Kirkland', '908g/包（冷凍區）', 'NT$ 450-500', '0.5包', '紅袋裝，變化用'),
        ('水煮蛋', 'protein', 'Kirkland', '20入/盒（冷藏區）', 'NT$ 159', '2盒', '方便即食，透明盒裝'),
        ('雞蛋', 'protein', '勤億或大成', '30入/盒（冷藏區）', 'NT$ 180-220', '1盒', '自己煮更省'),
        ('希臘優格', 'protein', 'Kirkland 或 Chobani', '1kg/罐（冷藏區）', 'NT$ 250-280', '2罐', '原味無糖，高蛋白'),
        ('無糖豆漿', 'protein', '義美', '1.8L×2（冷藏區）', 'NT$ 99', '1組', '植物蛋白補充'),
    ]

    # 蔬菜類
    vegetable_items = [
        ('青花菜', 'vegetable', 'Kirkland 冷凍', '1.2kg/包（冷凍區）', 'NT$ 180-220', '2包', '主要蔬菜'),
        ('花椰菜米', 'vegetable', 'Kirkland', '1.36kg/包（冷凍區）', 'NT$ 250-280', '1包', '低碳主食替代'),
        ('四季豆', 'vegetable', 'Kirkland 冷凍', '907g/包（冷凍區）', 'NT$ 150-180', '1包', '綠色包裝'),
        ('菠菜', 'vegetable', 'Kirkland 冷凍', '454g×2（冷凍區）', 'NT$ 180-200', '1組', ''),
        ('綜合生菜', 'vegetable', '新鮮區', '454g/盒（冷藏區）', 'NT$ 150-180', '2包', '沙拉用'),
        ('小黃瓜', 'vegetable', '新鮮區', '6入/袋', 'NT$ 80-100', '2包', ''),
        ('番茄', 'vegetable', '新鮮區', '1kg/盒', 'NT$ 120-150', '1盒', ''),
    ]

    # 碳水化合物
    carb_items = [
        ('糙米', 'carb', '中興米', '4kg/袋', 'NT$ 280-320', '0.25袋', '主要碳水來源'),
        ('紫米', 'carb', '台灣在地', '1kg/包', 'NT$ 150-180', '0.5包', '混合糙米'),
        ('燕麥片', 'carb', 'Quaker 桂格', '2.26kg/罐（大罐裝）', 'NT$ 280-320', '0.5罐', '早餐選擇'),
        ('地瓜', 'carb', '新鮮區', '2kg/袋', 'NT$ 150-180', '1袋', '訓練日碳水'),
    ]

    # 健康油脂
    oil_items = [
        ('橄欖油', 'oil', 'Kirkland 特級初榨', '2L/瓶', 'NT$ 550-650', '0.1瓶', '拌沙拉用，綠色瓶'),
        ('酪梨油', 'oil', 'Chosen Foods', '1L/瓶', 'NT$ 400-500', '0.1瓶', '高溫烹調用'),
        ('無調味堅果', 'oil', 'Kirkland', '1.13kg/罐', 'NT$ 550-650', '0.25罐', '每天一小把'),
    ]

    # 補充品
    supplement_items = [
        ('水解乳清隨手包', 'supplement', 'MARS 戰神', '35g/包（26g蛋白質）', 'NT$ 50-60/包', '每日1-2包', '網購/健身房購買，非好市多'),
        ('綜合維他命', 'supplement', 'Kirkland', '200錠/瓶', 'NT$ 600-800', '1瓶/80天', '營養補充'),
        ('魚油', 'supplement', 'Kirkland', '180顆/瓶', 'NT$ 700-900', '1瓶/80天', 'Omega-3'),
    ]

    # 飲品
    drink_items = [
        ('黑咖啡', 'drink', 'Kirkland 即溶/濾掛', '依個人喜好', 'NT$ 300-500', '每日1杯', '早餐必備'),
    ]

    all_shopping = protein_items + vegetable_items + carb_items + oil_items + supplement_items + drink_items
    db.executemany('''
        INSERT INTO shopping_list (name, category, brand, spec, price, weekly_amount, note)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', all_shopping)


if __name__ == '__main__':
    # 直接執行可重新初始化資料庫
    if os.path.exists(DATABASE):
        os.remove(DATABASE)
        print(f"已刪除舊資料庫: {DATABASE}")
    init_db()
    print(f"資料庫已初始化: {DATABASE}")
