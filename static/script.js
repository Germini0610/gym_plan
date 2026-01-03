/**
 * 80天減重計畫 - 前端 JavaScript
 */

// ==================== API 工具 ====================

async function api(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`/api${endpoint}`, options);
    return response.json();
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDaySelector();
    loadSettings();
    loadMeals();
    loadShopping();
    loadExercises();
    loadWeightRecords();
    loadChecklist();
    loadMealHistory();
});

// ==================== 導航 ====================

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ==================== 設定 ====================

async function loadSettings() {
    const settings = await api('/settings');
    document.getElementById('startWeight').textContent = settings.start_weight || '119';
    document.getElementById('targetWeight').textContent = settings.target_weight || '99';
    document.getElementById('bmrValue').textContent = settings.bmr || '2300';
    document.getElementById('caloriesRange').textContent =
        `${settings.daily_calories_min || '1800'}-${settings.daily_calories_max || '2200'}`;
    document.getElementById('proteinTarget').textContent = settings.protein_target || '180-220';
    document.getElementById('wheyInfo').textContent = settings.whey_spec || '35g/包';
}

// ==================== 運動參數 ====================

async function loadExercises() {
    const exercises = await api('/exercise');
    const tbody = document.getElementById('exerciseTable');

    tbody.innerHTML = exercises.map(ex => `
        <tr>
            <td><span class="badge ${getExerciseClass(ex.name)}">${ex.name}</span></td>
            <td>${ex.duration}</td>
            <td>${ex.intensity}</td>
            <td>${ex.distance}</td>
            <td>${ex.calories}</td>
            <td>
                <button class="btn-edit" onclick="editExercise(${ex.id})">編輯</button>
                <button class="btn-danger" onclick="deleteExercise(${ex.id})">刪除</button>
            </td>
        </tr>
    `).join('');
}

function getExerciseClass(name) {
    if (name.includes('走')) return 'walk';
    if (name.includes('飛輪') || name.includes('騎')) return 'bike';
    if (name.includes('游泳')) return 'swim';
    return 'walk';
}

async function deleteExercise(id) {
    if (!confirm('確定要刪除嗎？')) return;
    await api(`/exercise/${id}`, 'DELETE');
    showToast('已刪除');
    loadExercises();
}

// ==================== 菜單 ====================

async function loadMeals() {
    const meals = await api('/meals');
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = await api(`/daily-meals?date=${today}`);

    const breakfast = meals.filter(m => m.meal_type === 'breakfast');
    const lunch = meals.filter(m => m.meal_type === 'lunch');
    const dinner = meals.filter(m => m.meal_type === 'dinner');

    const todayBreakfast = todayMeals.filter(m => m.meal_type === 'breakfast');
    const todayLunch = todayMeals.filter(m => m.meal_type === 'lunch');
    const todayDinner = todayMeals.filter(m => m.meal_type === 'dinner');

    document.getElementById('breakfastGrid').innerHTML = renderMealGrid(breakfast, 'breakfast', todayBreakfast);
    document.getElementById('lunchGrid').innerHTML = renderMealGrid(lunch, 'lunch', todayLunch);
    document.getElementById('dinnerGrid').innerHTML = renderMealGrid(dinner, 'dinner', todayDinner);

    // 更新今日飲食顯示
    updateTodayMealsSummary(todayMeals);
}

function renderMealGrid(meals, mealType, todayRecords) {
    const recordedMealIds = todayRecords.map(r => r.meal_id);

    return meals.map(meal => {
        const isRecorded = recordedMealIds.includes(meal.id);
        return `
        <div class="menu-item ${isRecorded ? 'recorded' : ''}" onclick="toggleMealRecord(${meal.id}, '${mealType}', '${meal.name.replace(/'/g, "\\'")}')">
            <div class="actions" onclick="event.stopPropagation()">
                <button class="btn-edit" onclick="editMeal(${meal.id})">編輯</button>
                <button class="btn-danger" onclick="deleteMeal(${meal.id})">刪除</button>
            </div>
            ${isRecorded ? '<span class="recorded-badge">✓ 今日已選</span>' : ''}
            <h4>${meal.name}</h4>
            <div class="ingredients">${meal.ingredients}</div>
            <div class="menu-stats">
                <span class="kcal">${meal.calories} kcal</span>
                <span class="protein">${meal.protein}g 蛋白質</span>
            </div>
        </div>
    `}).join('');
}

async function toggleMealRecord(mealId, mealType, mealName) {
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = await api(`/daily-meals?date=${today}`);
    const existing = todayMeals.find(m => m.meal_id === mealId && m.meal_type === mealType);

    if (existing) {
        await api(`/daily-meals/${existing.id}`, 'DELETE');
        showToast('已取消記錄');
    } else {
        await api('/daily-meals', 'POST', {
            date: today,
            meal_type: mealType,
            meal_id: mealId,
            meal_name: mealName
        });
        showToast(`已記錄：${mealName}`);
    }
    loadMeals();
    loadMealHistory(); // 同步更新歷史記錄
}

function updateTodayMealsSummary(todayMeals) {
    const summaryEl = document.getElementById('todayMealsSummary');
    if (!summaryEl) return;

    if (todayMeals.length === 0) {
        summaryEl.innerHTML = '<p class="no-record">今日尚未記錄任何餐點</p>';
        return;
    }

    const mealTypes = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
    let html = '<ul class="today-meals-list">';

    for (const [type, label] of Object.entries(mealTypes)) {
        const meals = todayMeals.filter(m => m.meal_type === type);
        if (meals.length > 0) {
            html += `<li><strong>${label}:</strong> ${meals.map(m => m.meal_name).join(', ')}</li>`;
        }
    }
    html += '</ul>';
    summaryEl.innerHTML = html;
}

// ==================== 飲食記錄歷史 ====================

async function loadMealHistory() {
    const records = await api('/daily-meals/history');
    const container = document.getElementById('mealHistoryContainer');

    if (!container) return;

    if (records.length === 0) {
        container.innerHTML = '<p class="no-record">尚無飲食記錄</p>';
        return;
    }

    // 按日期分組
    const groupedByDate = {};
    records.forEach(record => {
        if (!groupedByDate[record.date]) {
            groupedByDate[record.date] = [];
        }
        groupedByDate[record.date].push(record);
    });

    const mealTypeLabels = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
    const dates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

    let html = '<div class="meal-history">';

    dates.forEach(date => {
        const meals = groupedByDate[date];
        const formattedDate = formatDate(date);

        html += `
            <div class="history-day">
                <div class="history-date">${formattedDate}</div>
                <div class="history-meals">
        `;

        ['breakfast', 'lunch', 'dinner'].forEach(type => {
            const typeMeals = meals.filter(m => m.meal_type === type);
            if (typeMeals.length > 0) {
                html += `
                    <div class="history-meal-type">
                        <span class="badge ${type}">${mealTypeLabels[type]}</span>
                        <span class="history-meal-names">${typeMeals.map(m => m.meal_name).join(', ')}</span>
                    </div>
                `;
            }
        });

        html += `
                </div>
                <button class="btn-danger btn-small" onclick="deleteMealsByDate('${date}')">刪除</button>
            </div>
        `;
    });

    html += '</div>';
    container.innerHTML = html;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return '今天';
    if (dateStr === yesterdayStr) return '昨天';

    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekDay = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return `${month}/${day}（週${weekDay}）`;
}

async function deleteMealsByDate(date) {
    if (!confirm(`確定要刪除 ${formatDate(date)} 的所有飲食記錄嗎？`)) return;

    // 刪除該日期的所有記錄
    const records = await api(`/daily-meals?date=${date}`);
    for (const record of records) {
        await api(`/daily-meals/${record.id}`, 'DELETE');
    }

    showToast('已刪除');
    loadMealHistory();
    loadMeals(); // 更新今日記錄顯示
}

function showMealModal(mealType = 'breakfast', meal = null) {
    const modal = document.getElementById('mealModal');
    const form = document.getElementById('mealForm');

    document.getElementById('mealModalTitle').textContent = meal ? '編輯菜單' : '新增菜單';
    document.getElementById('mealId').value = meal ? meal.id : '';
    document.getElementById('mealType').value = meal ? meal.meal_type : mealType;
    document.getElementById('mealName').value = meal ? meal.name : '';
    document.getElementById('mealIngredients').value = meal ? meal.ingredients : '';
    document.getElementById('mealCalories').value = meal ? meal.calories : '';
    document.getElementById('mealProtein').value = meal ? meal.protein : '';

    modal.classList.add('active');
}

async function editMeal(id) {
    const meals = await api('/meals');
    const meal = meals.find(m => m.id === id);
    if (meal) showMealModal(meal.meal_type, meal);
}

async function saveMeal() {
    const id = document.getElementById('mealId').value;
    const data = {
        name: document.getElementById('mealName').value,
        meal_type: document.getElementById('mealType').value,
        ingredients: document.getElementById('mealIngredients').value,
        calories: parseInt(document.getElementById('mealCalories').value),
        protein: parseInt(document.getElementById('mealProtein').value)
    };

    if (id) {
        await api(`/meals/${id}`, 'PUT', data);
        showToast('菜單已更新');
    } else {
        await api('/meals', 'POST', data);
        showToast('菜單已新增');
    }

    closeMealModal();
    loadMeals();
}

async function deleteMeal(id) {
    if (!confirm('確定要刪除這個菜單嗎？')) return;
    await api(`/meals/${id}`, 'DELETE');
    showToast('已刪除');
    loadMeals();
}

function closeMealModal() {
    document.getElementById('mealModal').classList.remove('active');
}

// ==================== 採買清單 ====================

async function loadShopping() {
    const items = await api('/shopping');

    const categories = {
        protein: { name: '蛋白質來源', items: [] },
        vegetable: { name: '蔬菜類', items: [] },
        carb: { name: '碳水化合物', items: [] },
        oil: { name: '健康油脂', items: [] },
        supplement: { name: '補充品', items: [] },
        drink: { name: '飲品', items: [] }
    };

    items.forEach(item => {
        if (categories[item.category]) {
            categories[item.category].items.push(item);
        }
    });

    const container = document.getElementById('shoppingList');
    container.innerHTML = Object.entries(categories)
        .filter(([key, cat]) => cat.items.length > 0)
        .map(([key, cat]) => `
        <div class="card">
            <h2>${cat.name} <button class="btn-add" onclick="showShoppingModal('${key}')">+ 新增</button></h2>
            <table>
                <thead>
                    <tr>
                        <th>品項</th>
                        <th>品牌/廠商</th>
                        <th>規格</th>
                        <th>參考價格</th>
                        <th>每週建議量</th>
                        <th>備註</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${cat.items.map(item => `
                        <tr>
                            <td><strong>${item.name}</strong></td>
                            <td class="brand-cell">${item.brand || '-'}</td>
                            <td>${item.spec || '-'}</td>
                            <td>${item.price || '-'}</td>
                            <td>${item.weekly_amount || '-'}</td>
                            <td>${item.note || '-'}</td>
                            <td>
                                <button class="btn-edit" onclick="editShoppingItem(${item.id})">編輯</button>
                                <button class="btn-danger" onclick="deleteShoppingItem(${item.id})">刪除</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `).join('');
}

function showShoppingModal(category = 'protein', item = null) {
    const modal = document.getElementById('shoppingModal');

    document.getElementById('shoppingModalTitle').textContent = item ? '編輯採買項目' : '新增採買項目';
    document.getElementById('shoppingId').value = item ? item.id : '';
    document.getElementById('shoppingCategory').value = item ? item.category : category;
    document.getElementById('shoppingName').value = item ? item.name : '';
    document.getElementById('shoppingBrand').value = item ? (item.brand || '') : '';
    document.getElementById('shoppingSpec').value = item ? item.spec : '';
    document.getElementById('shoppingPrice').value = item ? item.price : '';
    document.getElementById('shoppingAmount').value = item ? item.weekly_amount : '';
    document.getElementById('shoppingNote').value = item ? item.note : '';

    modal.classList.add('active');
}

async function editShoppingItem(id) {
    const items = await api('/shopping');
    const item = items.find(i => i.id === id);
    if (item) showShoppingModal(item.category, item);
}

async function saveShoppingItem() {
    const id = document.getElementById('shoppingId').value;
    const data = {
        name: document.getElementById('shoppingName').value,
        category: document.getElementById('shoppingCategory').value,
        brand: document.getElementById('shoppingBrand').value,
        spec: document.getElementById('shoppingSpec').value,
        price: document.getElementById('shoppingPrice').value,
        weekly_amount: document.getElementById('shoppingAmount').value,
        note: document.getElementById('shoppingNote').value
    };

    if (id) {
        await api(`/shopping/${id}`, 'PUT', data);
        showToast('已更新');
    } else {
        await api('/shopping', 'POST', data);
        showToast('已新增');
    }

    closeShoppingModal();
    loadShopping();
}

async function deleteShoppingItem(id) {
    if (!confirm('確定要刪除嗎？')) return;
    await api(`/shopping/${id}`, 'DELETE');
    showToast('已刪除');
    loadShopping();
}

function closeShoppingModal() {
    document.getElementById('shoppingModal').classList.remove('active');
}

// ==================== 每日計畫 ====================

const weeklyExercise = {
    1: { evening: '快走 85 分（5.5 km/h，約 7.8 km）' },
    2: { evening: '飛輪 40 分 + 快走 40 分' },
    3: { evening: '游泳 40 分 + 快走 40 分' },
    4: { evening: '快走 85 分（5.5 km/h，約 7.8 km）' },
    5: { evening: '飛輪 40 分 + 快走 40 分' },
    6: { evening: '游泳 45 分 + 快走 40 分' },
    0: { evening: '散步 60 分（恢復）' }
};

const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

function initDaySelector() {
    const dayInput = document.getElementById('currentDay');
    const showBtn = document.getElementById('showDayBtn');

    showBtn.addEventListener('click', () => updateDayPlan(parseInt(dayInput.value)));
    dayInput.addEventListener('keypress', e => { if (e.key === 'Enter') showBtn.click(); });

    updateDayPlan(1);
}

function updateDayPlan(day) {
    if (day < 1 || day > 80) return;

    const weekDayIndex = (day - 1) % 7;
    const actualWeekDay = (weekDayIndex + 1) % 7;

    document.getElementById('dayNumber').textContent = day;
    document.getElementById('dayOfWeek').textContent = dayNames[actualWeekDay === 0 ? 0 : actualWeekDay];

    const exercise = weeklyExercise[actualWeekDay];
    const schedule = getSchedule(actualWeekDay, exercise);

    document.getElementById('dailySchedule').innerHTML = schedule.map(row => `
        <tr ${row.highlight ? 'style="background: #ecfdf5; font-weight: 500;"' : ''}>
            <td>${row.time}</td>
            <td>${row.highlight ? '<strong>' + row.item + '</strong>' : row.item}</td>
            <td>${row.content}</td>
        </tr>
    `).join('');
}

function getSchedule(weekDay, exercise) {
    if (weekDay === 0) {
        return [
            { time: '09:00', item: '起床', content: '量體重、記錄本週成果、喝水 500ml' },
            { time: '09:15', item: '早餐', content: '高蛋白早餐' },
            { time: '10:00-12:00', item: '自由', content: '休息或輕度活動' },
            { time: '12:10', item: '午餐', content: '含碳水午餐' },
            { time: '13:00-17:30', item: '自由', content: '休息、準備下週' },
            { time: '17:30-18:30', item: '煮晚餐', content: '備料、烹調晚餐' },
            { time: '18:30', item: '晚餐', content: '低碳晚餐' },
            { time: '20:00-21:00', item: '散步', content: exercise.evening, highlight: true },
            { time: '23:30', item: '就寢', content: '睡眠 7-8 小時' }
        ];
    }

    return [
        { time: '09:00', item: '起床', content: '量體重、喝水 500ml' },
        { time: '09:15', item: '早餐', content: '高蛋白早餐' },
        { time: '10:00-12:00', item: '工作', content: '接案時間' },
        { time: '12:10', item: '午餐', content: '含碳水午餐' },
        { time: '13:00-13:30', item: '散步', content: '輕走 30 分鐘' },
        { time: '14:00-17:30', item: '工作', content: '接案時間' },
        { time: '17:30-18:30', item: '煮晚餐', content: '備料、烹調晚餐' },
        { time: '18:30', item: '晚餐', content: '低碳晚餐' },
        { time: '20:00-21:30', item: '有氧', content: exercise.evening, highlight: true },
        { time: '21:30-22:00', item: '收操', content: '伸展、輕走' },
        { time: '23:30', item: '就寢', content: '睡眠 7-8 小時' }
    ];
}

// ==================== 每日檢查清單 ====================

async function loadChecklist() {
    const today = new Date().toISOString().split('T')[0];
    const items = await api(`/checklist?date=${today}`);
    const checkedKeys = items.filter(i => i.checked).map(i => i.item_key);

    document.querySelectorAll('.checklist input[type="checkbox"]').forEach(cb => {
        cb.checked = checkedKeys.includes(cb.dataset.key);
        cb.parentElement.classList.toggle('checked', cb.checked);

        cb.addEventListener('change', async () => {
            await api('/checklist', 'POST', {
                date: today,
                item_key: cb.dataset.key,
                checked: cb.checked ? 1 : 0
            });
            cb.parentElement.classList.toggle('checked', cb.checked);
        });
    });
}

// ==================== 體重追蹤 ====================

async function loadWeightRecords() {
    const records = await api('/weight');
    renderWeightTable(records);
    updateWeightStats(records);
    drawWeightChart(records);
}

function renderWeightTable(records) {
    const tbody = document.querySelector('#weightTable tbody');

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">尚無記錄</td></tr>';
        return;
    }

    tbody.innerHTML = records.map((record, index) => {
        const prev = index < records.length - 1 ? records[index + 1].weight : record.weight;
        const change = (record.weight - prev).toFixed(1);
        const changeClass = change < 0 ? 'color: #10b981;' : change > 0 ? 'color: #ef4444;' : '';
        const changeText = change > 0 ? `+${change}` : change;

        return `
            <tr>
                <td>${record.date}</td>
                <td>Day ${record.day}</td>
                <td>${record.weight} kg</td>
                <td style="${changeClass}">${index === records.length - 1 ? '-' : changeText + ' kg'}</td>
                <td><button class="btn-danger" onclick="deleteWeight(${record.id})">刪除</button></td>
            </tr>
        `;
    }).join('');
}

function updateWeightStats(records) {
    const startWeight = 119;
    const targetWeight = 99;

    if (records.length === 0) {
        document.getElementById('currentWeightVal').textContent = '--';
        document.getElementById('totalLost').textContent = '--';
        document.getElementById('targetRemaining').textContent = '--';
        return;
    }

    const current = records[0].weight;
    document.getElementById('currentWeightVal').textContent = current;
    document.getElementById('totalLost').textContent = (startWeight - current).toFixed(1);
    document.getElementById('targetRemaining').textContent = (current - targetWeight).toFixed(1);
}

async function saveWeight() {
    const weightInput = document.getElementById('todayWeight');
    const weight = parseFloat(weightInput.value);

    if (!weight || weight < 50 || weight > 200) {
        showToast('請輸入有效的體重', 'error');
        return;
    }

    const today = new Date().toISOString().split('T')[0];
    const records = await api('/weight');
    const day = records.length > 0 ? Math.max(...records.map(r => r.day)) + 1 : 1;

    await api('/weight', 'POST', { date: today, weight, day });
    showToast('體重已記錄');
    weightInput.value = '';
    loadWeightRecords();
}

async function deleteWeight(id) {
    if (!confirm('確定要刪除這筆記錄嗎？')) return;
    await api(`/weight/${id}`, 'DELETE');
    showToast('已刪除');
    loadWeightRecords();
}

function drawWeightChart(records) {
    const canvas = document.getElementById('weightCanvas');
    const ctx = canvas.getContext('2d');

    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = 280;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = canvas.width - padding.left - padding.right;
    const height = canvas.height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (records.length < 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('需要至少 2 筆記錄才能顯示圖表', canvas.width / 2, canvas.height / 2);
        return;
    }

    const sortedRecords = [...records].reverse();
    const weights = sortedRecords.map(r => r.weight);
    const minWeight = Math.min(...weights, 99) - 2;
    const maxWeight = Math.max(...weights, 119) + 2;

    // Grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + width, y);
        ctx.stroke();

        const value = maxWeight - ((maxWeight - minWeight) / 5) * i;
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(0) + ' kg', padding.left - 10, y + 4);
    }

    // Target line
    const targetY = padding.top + height * (maxWeight - 99) / (maxWeight - minWeight);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, targetY);
    ctx.lineTo(padding.left + width, targetY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#10b981';
    ctx.textAlign = 'left';
    ctx.fillText('目標 99 kg', padding.left + 5, targetY - 5);

    // Data line
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    sortedRecords.forEach((record, index) => {
        const x = padding.left + (width / (sortedRecords.length - 1)) * index;
        const y = padding.top + height * (maxWeight - record.weight) / (maxWeight - minWeight);
        index === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Points
    sortedRecords.forEach((record, index) => {
        const x = padding.left + (width / (sortedRecords.length - 1)) * index;
        const y = padding.top + height * (maxWeight - record.weight) / (maxWeight - minWeight);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        if (index === 0 || index === sortedRecords.length - 1 || sortedRecords.length <= 10) {
            ctx.fillStyle = '#64748b';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('D' + record.day, x, canvas.height - 10);
        }
    });
}

window.addEventListener('resize', () => loadWeightRecords());

// Event bindings
document.getElementById('saveWeightBtn')?.addEventListener('click', saveWeight);
document.getElementById('todayWeight')?.addEventListener('keypress', e => { if (e.key === 'Enter') saveWeight(); });
