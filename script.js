// 80天減重計畫 - JavaScript

// ==================== 資料 ====================

const dailySchedule = {
    weekday: [
        { time: '09:00', item: '起床', content: '量體重、喝水 500ml' },
        { time: '09:15', item: '早餐', content: '高蛋白早餐（見菜單）' },
        { time: '10:00-12:00', item: '工作', content: '接案時間' },
        { time: '12:10', item: '午餐', content: '含碳水午餐（見菜單）' },
        { time: '13:00-13:30', item: '散步', content: '輕走 30 分鐘' },
        { time: '14:00-14:45', item: '有氧', content: '' }, // 動態填入
        { time: '15:00-15:30', item: '走路', content: '收操 + 輕走' },
        { time: '16:30-18:30', item: '工作', content: '接案時間' },
        { time: '18:30', item: '晚餐', content: '低碳晚餐（見菜單）' },
        { time: '20:00-20:40', item: '有氧', content: '' }, // 動態填入
        { time: '23:30', item: '就寢', content: '睡眠 7-8 小時' }
    ],
    sunday: [
        { time: '09:00', item: '起床', content: '量體重、記錄本週成果、喝水 500ml' },
        { time: '09:15', item: '早餐', content: '高蛋白早餐（見菜單）' },
        { time: '10:00-12:00', item: '自由', content: '休息或輕度活動' },
        { time: '12:10', item: '午餐', content: '含碳水午餐（見菜單）' },
        { time: '13:00-14:00', item: '散步', content: '輕走 40-60 分鐘（恢復性）' },
        { time: '14:00-18:30', item: '自由', content: '休息、準備下週' },
        { time: '18:30', item: '晚餐', content: '低碳晚餐（見菜單）' },
        { time: '20:00-20:30', item: '有氧', content: '輕鬆散步 30 分鐘' },
        { time: '23:30', item: '就寢', content: '睡眠 7-8 小時' }
    ]
};

const weeklyExercise = {
    1: { afternoon: '快走 45 分（5.5 km/h，4 km）', evening: '飛輪 40 分（75 RPM，12 km）' },
    2: { afternoon: '飛輪 40 分（75 RPM，12 km）', evening: '快走 40 分（5.5 km/h，3.7 km）' },
    3: { afternoon: '游泳 40 分（休閒配速，1000 m）', evening: '快走 40 分（5.5 km/h，3.7 km）' },
    4: { afternoon: '快走 45 分（5.5 km/h，4 km）', evening: '飛輪 40 分（75 RPM，12 km）' },
    5: { afternoon: '飛輪 40 分（75 RPM，12 km）', evening: '快走 40 分（5.5 km/h，3.7 km）' },
    6: { afternoon: '游泳 45 分（休閒配速，1100 m）', evening: '快走 40 分（5.5 km/h，3.7 km）' },
    0: { afternoon: '散步 40 分（恢復）', evening: '散步 30 分（恢復）' }
};

const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

// ==================== 導航功能 ====================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initDaySelector();
    initChecklists();
    initWeightTracker();
    loadSavedData();
    updateDayPlan(1);
});

function initNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;

            // 移除所有 active
            navBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(t => t.classList.remove('active'));

            // 添加 active
            btn.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });
}

// ==================== 每日計畫 ====================

function initDaySelector() {
    const dayInput = document.getElementById('currentDay');
    const showBtn = document.getElementById('showDayBtn');

    showBtn.addEventListener('click', () => {
        const day = parseInt(dayInput.value);
        if (day >= 1 && day <= 80) {
            updateDayPlan(day);
        }
    });

    dayInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            showBtn.click();
        }
    });
}

function updateDayPlan(day) {
    const dayNumber = document.getElementById('dayNumber');
    const dayOfWeek = document.getElementById('dayOfWeek');
    const tbody = document.querySelector('#dailySchedule tbody');

    // 計算星期幾 (假設 Day 1 是週一)
    const weekDayIndex = (day - 1) % 7; // 0 = 週一, 6 = 週日
    const actualWeekDay = (weekDayIndex + 1) % 7; // 轉換為 JS 的星期格式 (0 = 週日)

    dayNumber.textContent = day;
    dayOfWeek.textContent = dayNames[actualWeekDay === 0 ? 0 : actualWeekDay];

    // 取得運動安排
    const exercise = weeklyExercise[actualWeekDay];

    // 取得時間表
    const schedule = actualWeekDay === 0 ? dailySchedule.sunday : dailySchedule.weekday;

    // 生成表格
    tbody.innerHTML = schedule.map(row => {
        let content = row.content;

        // 填入運動內容
        if (row.item === '有氧' && !content) {
            if (row.time.includes('14:')) {
                content = exercise.afternoon;
            } else if (row.time.includes('20:')) {
                content = exercise.evening;
            }
        }

        // 標記運動項目
        const isExercise = row.item === '有氧';
        const rowClass = isExercise ? 'style="background: #ecfdf5; font-weight: 500;"' : '';

        return `
            <tr ${rowClass}>
                <td>${row.time}</td>
                <td>${isExercise ? '<strong>' + row.item + '</strong>' : row.item}</td>
                <td>${content}</td>
            </tr>
        `;
    }).join('');
}

// ==================== 清單功能 ====================

function initChecklists() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-key]');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            saveChecklistState();
        });
    });
}

function saveChecklistState() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-key]');
    const state = {};

    checkboxes.forEach(checkbox => {
        state[checkbox.dataset.key] = checkbox.checked;
    });

    // 加上日期標記，每天重置
    const today = new Date().toDateString();
    localStorage.setItem('checklistDate', today);
    localStorage.setItem('checklistState', JSON.stringify(state));
}

function loadChecklistState() {
    const savedDate = localStorage.getItem('checklistDate');
    const today = new Date().toDateString();

    // 如果是新的一天，重置清單
    if (savedDate !== today) {
        localStorage.removeItem('checklistState');
        return;
    }

    const state = JSON.parse(localStorage.getItem('checklistState') || '{}');
    const checkboxes = document.querySelectorAll('input[type="checkbox"][data-key]');

    checkboxes.forEach(checkbox => {
        if (state[checkbox.dataset.key]) {
            checkbox.checked = true;
        }
    });
}

// ==================== 體重追蹤 ====================

function initWeightTracker() {
    const saveBtn = document.getElementById('saveWeight');
    const weightInput = document.getElementById('todayWeight');

    saveBtn.addEventListener('click', () => {
        const weight = parseFloat(weightInput.value);
        if (weight && weight > 50 && weight < 200) {
            saveWeight(weight);
            weightInput.value = '';
            renderWeightTable();
            updateStats();
            drawChart();
        }
    });

    weightInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveBtn.click();
        }
    });
}

function saveWeight(weight) {
    const records = JSON.parse(localStorage.getItem('weightRecords') || '[]');
    const today = new Date().toISOString().split('T')[0];

    // 檢查今天是否已有記錄
    const existingIndex = records.findIndex(r => r.date === today);
    if (existingIndex >= 0) {
        records[existingIndex].weight = weight;
    } else {
        // 計算是第幾天
        const startDate = localStorage.getItem('startDate');
        let day = 1;
        if (startDate) {
            const start = new Date(startDate);
            const now = new Date(today);
            day = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
        } else {
            localStorage.setItem('startDate', today);
        }

        records.push({ date: today, weight: weight, day: day });
    }

    records.sort((a, b) => new Date(a.date) - new Date(b.date));
    localStorage.setItem('weightRecords', JSON.stringify(records));
}

function deleteWeight(date) {
    let records = JSON.parse(localStorage.getItem('weightRecords') || '[]');
    records = records.filter(r => r.date !== date);
    localStorage.setItem('weightRecords', JSON.stringify(records));
    renderWeightTable();
    updateStats();
    drawChart();
}

function renderWeightTable() {
    const tbody = document.querySelector('#weightTable tbody');
    const records = JSON.parse(localStorage.getItem('weightRecords') || '[]');

    if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #64748b;">尚無記錄</td></tr>';
        return;
    }

    tbody.innerHTML = records.map((record, index) => {
        const prev = index > 0 ? records[index - 1].weight : record.weight;
        const change = (record.weight - prev).toFixed(1);
        const changeClass = change < 0 ? 'style="color: #10b981;"' : change > 0 ? 'style="color: #ef4444;"' : '';
        const changeText = change > 0 ? `+${change}` : change;

        return `
            <tr>
                <td>${record.date}</td>
                <td>Day ${record.day}</td>
                <td>${record.weight} kg</td>
                <td ${changeClass}>${index === 0 ? '-' : changeText + ' kg'}</td>
                <td><button onclick="deleteWeight('${record.date}')">刪除</button></td>
            </tr>
        `;
    }).reverse().join('');
}

function updateStats() {
    const records = JSON.parse(localStorage.getItem('weightRecords') || '[]');
    const startWeight = 119;
    const targetWeight = 99;

    document.getElementById('startWeight').textContent = startWeight;

    if (records.length === 0) {
        document.getElementById('currentWeight').textContent = '--';
        document.getElementById('totalLost').textContent = '--';
        document.getElementById('targetRemaining').textContent = '--';
        return;
    }

    const current = records[records.length - 1].weight;
    const lost = (startWeight - current).toFixed(1);
    const remaining = (current - targetWeight).toFixed(1);

    document.getElementById('currentWeight').textContent = current;
    document.getElementById('totalLost').textContent = lost;
    document.getElementById('targetRemaining').textContent = remaining;
}

function drawChart() {
    const canvas = document.getElementById('weightCanvas');
    const ctx = canvas.getContext('2d');
    const records = JSON.parse(localStorage.getItem('weightRecords') || '[]');

    // 設定 canvas 尺寸
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = 280;

    const padding = { top: 20, right: 20, bottom: 40, left: 50 };
    const width = canvas.width - padding.left - padding.right;
    const height = canvas.height - padding.top - padding.bottom;

    // 清除
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (records.length < 2) {
        ctx.fillStyle = '#64748b';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('需要至少 2 筆記錄才能顯示圖表', canvas.width / 2, canvas.height / 2);
        return;
    }

    // 計算範圍
    const weights = records.map(r => r.weight);
    const minWeight = Math.min(...weights, 99) - 2;
    const maxWeight = Math.max(...weights, 119) + 2;

    // 繪製網格線
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    // Y 軸網格
    for (let i = 0; i <= 5; i++) {
        const y = padding.top + (height / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + width, y);
        ctx.stroke();

        // Y 軸標籤
        const value = maxWeight - ((maxWeight - minWeight) / 5) * i;
        ctx.fillStyle = '#64748b';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(value.toFixed(0) + ' kg', padding.left - 10, y + 4);
    }

    // 目標線
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
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('目標 99 kg', padding.left + 5, targetY - 5);

    // 繪製資料線
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.beginPath();

    records.forEach((record, index) => {
        const x = padding.left + (width / (records.length - 1)) * index;
        const y = padding.top + height * (maxWeight - record.weight) / (maxWeight - minWeight);

        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // 繪製資料點
    records.forEach((record, index) => {
        const x = padding.left + (width / (records.length - 1)) * index;
        const y = padding.top + height * (maxWeight - record.weight) / (maxWeight - minWeight);

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#2563eb';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // X 軸標籤（僅顯示部分）
        if (index === 0 || index === records.length - 1 || records.length <= 10) {
            ctx.fillStyle = '#64748b';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('D' + record.day, x, canvas.height - 10);
        }
    });
}

// ==================== 資料載入 ====================

function loadSavedData() {
    loadChecklistState();
    renderWeightTable();
    updateStats();

    // 延遲繪製圖表，確保 DOM 已完全載入
    setTimeout(drawChart, 100);
}

// 視窗大小改變時重繪圖表
window.addEventListener('resize', () => {
    drawChart();
});

// 將 deleteWeight 暴露到全域
window.deleteWeight = deleteWeight;
