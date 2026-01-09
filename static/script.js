/**
 * 80天減重計畫 - 前端 JavaScript（簡化版）
 */

// ==================== API 工具 ====================

async function api(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' }
    };
    if (data) options.body = JSON.stringify(data);

    const response = await fetch(`api${endpoint}`, options);
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
    loadSettings();
    loadExercises();
    loadWeightRecords();
    initWeekNavigation();
    renderWeekExercise(1);
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

    if (exercises.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #64748b;">尚無運動項目</td></tr>';
        return;
    }

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
    if (name.includes('有氧')) return 'cardio';
    return 'walk';
}

async function deleteExercise(id) {
    if (!confirm('確定要刪除嗎？')) return;
    await api(`/exercise/${id}`, 'DELETE');
    showToast('已刪除');
    loadExercises();
}

function showExerciseModal(exercise = null) {
    const modal = document.getElementById('exerciseModal');
    document.getElementById('exerciseModalTitle').textContent = exercise ? '編輯運動項目' : '新增運動項目';
    document.getElementById('exerciseId').value = exercise ? exercise.id : '';
    document.getElementById('exerciseName').value = exercise ? exercise.name : '';
    document.getElementById('exerciseDuration').value = exercise ? exercise.duration : '';
    document.getElementById('exerciseIntensity').value = exercise ? exercise.intensity : '';
    document.getElementById('exerciseDistance').value = exercise ? exercise.distance : '';
    document.getElementById('exerciseCalories').value = exercise ? exercise.calories : '';
    modal.classList.add('active');
}

async function editExercise(id) {
    const exercises = await api('/exercise');
    const exercise = exercises.find(e => e.id === id);
    if (exercise) showExerciseModal(exercise);
}

async function saveExercise() {
    const id = document.getElementById('exerciseId').value;
    const data = {
        name: document.getElementById('exerciseName').value,
        duration: document.getElementById('exerciseDuration').value,
        intensity: document.getElementById('exerciseIntensity').value,
        distance: document.getElementById('exerciseDistance').value,
        calories: document.getElementById('exerciseCalories').value
    };

    if (id) {
        await api(`/exercise/${id}`, 'PUT', data);
        showToast('運動項目已更新');
    } else {
        await api('/exercise', 'POST', data);
        showToast('運動項目已新增');
    }

    closeExerciseModal();
    loadExercises();
}

function closeExerciseModal() {
    document.getElementById('exerciseModal').classList.remove('active');
}

// ==================== 每日運動（翻頁式，一頁七天） ====================

let currentWeek = 1;
const totalWeeks = 12; // 80天 = 約 12 週

const dayNames = ['週一', '週二', '週三', '週四', '週五', '週六', '週日'];

// 每週運動安排（週一=1, 週日=0）
const weeklyExercise = {
    1: '快走 85 分（5.5 km/h，約 7.8 km）',
    2: '飛輪 40 分 + 快走 40 分',
    3: '游泳 40 分 + 快走 40 分',
    4: '快走 85 分（5.5 km/h，約 7.8 km）',
    5: '飛輪 40 分 + 快走 40 分',
    6: '游泳 45 分 + 快走 40 分',
    0: '散步 60 分（恢復）'
};

function getExerciseIcon(exercise) {
    if (exercise.includes('散步')) return '🚶';
    if (exercise.includes('游泳')) return '🏊';
    if (exercise.includes('飛輪')) return '🚴';
    if (exercise.includes('快走')) return '🏃';
    return '💪';
}

function initWeekNavigation() {
    document.getElementById('prevWeek').addEventListener('click', () => {
        if (currentWeek > 1) {
            currentWeek--;
            renderWeekExercise(currentWeek);
        }
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        if (currentWeek < totalWeeks) {
            currentWeek++;
            renderWeekExercise(currentWeek);
        }
    });
}

function renderWeekExercise(week) {
    const startDay = (week - 1) * 7 + 1;
    const endDay = Math.min(week * 7, 80);

    // 更新標題
    document.getElementById('weekTitle').textContent = `第 ${week} 週（Day ${startDay} - ${endDay}）`;

    // 更新按鈕狀態
    document.getElementById('prevWeek').disabled = week === 1;
    document.getElementById('nextWeek').disabled = week === totalWeeks;

    // 生成七天的卡片
    const grid = document.getElementById('weekGrid');
    let html = '';

    for (let i = 0; i < 7; i++) {
        const day = startDay + i;
        if (day > 80) break;

        const weekDayIndex = i; // 0=週一, 6=週日
        const actualWeekDay = (weekDayIndex + 1) % 7; // 轉換為 JS 的星期格式
        const exercise = weeklyExercise[actualWeekDay];
        const isRestDay = actualWeekDay === 0;
        const icon = getExerciseIcon(exercise);

        html += `
            <div class="day-card ${isRestDay ? 'rest-day' : ''}">
                <div class="day-header">
                    <span class="day-number">Day ${day}</span>
                    <span class="day-name">${dayNames[weekDayIndex]}</span>
                </div>
                <div class="day-content">
                    <div class="exercise-item">
                        <span class="exercise-icon">${icon}</span>
                        <span class="exercise-text">${exercise}</span>
                    </div>
                </div>
            </div>
        `;
    }

    grid.innerHTML = html;
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
