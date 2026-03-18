let teachers = [];
let subjects = [];
let workdayCache = {};

const defaultSubjects = [];

function init() {
    loadData();
    setupEventListeners();
    renderTeachers();
    renderSubjects();
    updateStatistics();
}

function loadData() {
    const savedTeachers = localStorage.getItem('teachers');
    const savedSubjects = localStorage.getItem('subjects');
    
    if (savedTeachers) {
        teachers = JSON.parse(savedTeachers);
    }
    
    if (savedSubjects) {
        subjects = JSON.parse(savedSubjects);
    } else {
        subjects = [...defaultSubjects];
        saveSubjects();
    }
}

function saveTeachers() {
    localStorage.setItem('teachers', JSON.stringify(teachers));
}

function saveSubjects() {
    localStorage.setItem('subjects', JSON.stringify(subjects));
}

function setupEventListeners() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            switchTab(tabId);
        });
    });

    window.onclick = function(event) {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    };
    
    // 页面关闭前保存数据
    window.addEventListener('beforeunload', function() {
        saveTeachers();
        saveSubjects();
    });
    
    // 页面刷新前保存数据
    window.addEventListener('unload', function() {
        saveTeachers();
        saveSubjects();
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
    
    if (tabId === 'statistics') {
        updateStatistics();
    }
}

function parseSubjectString(subjectString) {
    const match = subjectString.match(/^(.*?)(\d+班)\s+(.*)$/);
    if (match) {
        return {
            grade: match[1].trim(),
            class: match[2].trim(),
            subject: match[3].trim()
        };
    }
    return {
        grade: '',
        class: '',
        subject: subjectString
    };
}

function calculateWorkload(periods, subjectName, grade) {
    const subject = subjects.find(s => s.name === subjectName && s.grade === grade);
    const coefficient = subject ? subject.coefficient : 1.0;
    return (periods * coefficient).toFixed(2);
}

function renderTeachers() {
    const tbody = document.getElementById('teachersTableBody');
    const semesterFilter = document.getElementById('semesterFilter').value;
    
    let filteredTeachers = teachers;
    if (semesterFilter !== 'all') {
        filteredTeachers = teachers.filter(t => t.semester === semesterFilter);
    }
    
    if (filteredTeachers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="empty-state">
                    <p>暂无教师数据</p>
                    <p>点击"添加教师"或"导入Excel"开始使用</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = filteredTeachers.map(teacher => {
            const workload = calculateWorkload(teacher.periods, teacher.subject, teacher.grade);
            return `
                <tr>
                    <td>${teacher.name}</td>
                    <td>${formatSemester(teacher.semester)}</td>
                    <td>${teacher.grade || '-'}</td>
                    <td>${teacher.class || '-'}</td>
                    <td>${teacher.subject}</td>
                    <td>${teacher.periods}</td>
                    <td>${getSubjectCoefficient(teacher.subject, teacher.grade)}</td>
                    <td><strong>${workload}</strong></td>
                    <td>
                        <button class="btn btn-info" onclick="showEditTeacherModal('${teacher.id}')" style="padding: 5px 10px; font-size: 12px;">编辑</button>
                        <button class="btn btn-danger" onclick="deleteTeacher('${teacher.id}')" style="padding: 5px 10px; font-size: 12px;">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
    }
    
    updateSummary();
    populateGradeAndClassFilters();
}

function updateSummary() {
    const semesterFilter = document.getElementById('semesterFilter').value;
    let filteredTeachers = teachers;
    
    if (semesterFilter !== 'all') {
        filteredTeachers = teachers.filter(t => t.semester === semesterFilter);
    }
    
    document.getElementById('totalTeachers').textContent = filteredTeachers.length;
    
    const totalWorkload = filteredTeachers.reduce((sum, teacher) => {
        return sum + parseFloat(calculateWorkload(teacher.periods, teacher.subject, teacher.grade));
    }, 0);
    
    document.getElementById('totalWorkload').textContent = totalWorkload.toFixed(2);
}

function formatSemester(semester) {
    const semesterMap = {
        '2024-2025-1': '2024-2025学年第一学期',
        '2024-2025-2': '2024-2025学年第二学期',
        '2025-2026-1': '2025-2026学年第一学期',
        '2025-2026-2': '2025-2026学年第二学期'
    };
    return semesterMap[semester] || semester;
}

function getSubjectCoefficient(subjectName, grade) {
    const subject = subjects.find(s => s.name === subjectName && s.grade === grade);
    return subject ? subject.coefficient.toFixed(2) : '1.00';
}

function filterTeachers() {
    renderTeachers();
}

function showAddTeacherModal() {
    document.getElementById('addTeacherForm').reset();
    populateSubjectSelect('subject');
    document.getElementById('addTeacherModal').style.display = 'block';
}

function showEditTeacherModal(teacherId) {
    const teacher = teachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    document.getElementById('editTeacherId').value = teacher.id;
    document.getElementById('editTeacherName').value = teacher.name;
    document.getElementById('editSemester').value = teacher.semester;
    document.getElementById('editGrade').value = teacher.grade || '';
    document.getElementById('editClass').value = teacher.class || '';
    populateSubjectSelect('editSubject');
    document.getElementById('editSubject').value = teacher.subject;
    document.getElementById('editPeriods').value = teacher.periods;
    
    document.getElementById('editTeacherModal').style.display = 'block';
}

function addTeacher(event) {
    event.preventDefault();
    
    const teacher = {
        id: Date.now().toString(),
        name: document.getElementById('teacherName').value,
        semester: document.getElementById('semester').value,
        grade: document.getElementById('grade').value || '',
        class: document.getElementById('class').value || '',
        subject: document.getElementById('subject').value,
        periods: parseInt(document.getElementById('periods').value)
    };
    
    teachers.push(teacher);
    saveTeachers();
    renderTeachers();
    closeModal('addTeacherModal');
}

function updateTeacher(event) {
    event.preventDefault();
    
    const teacherId = document.getElementById('editTeacherId').value;
    const teacherIndex = teachers.findIndex(t => t.id === teacherId);
    
    if (teacherIndex !== -1) {
        teachers[teacherIndex] = {
            ...teachers[teacherIndex],
            name: document.getElementById('editTeacherName').value,
            semester: document.getElementById('editSemester').value,
            grade: document.getElementById('editGrade').value || '',
            class: document.getElementById('editClass').value || '',
            subject: document.getElementById('editSubject').value,
            periods: parseInt(document.getElementById('editPeriods').value)
        };
        
        saveTeachers();
        renderTeachers();
        closeModal('editTeacherModal');
    }
}

function deleteTeacher(teacherId) {
    if (confirm('确定要删除这位教师的信息吗？')) {
        teachers = teachers.filter(t => t.id !== teacherId);
        saveTeachers();
        renderTeachers();
    }
}

function deleteAllTeachers() {
    if (confirm('确定要删除所有教师记录吗？此操作不可恢复！')) {
        teachers = [];
        saveTeachers();
        renderTeachers();
        alert('所有教师记录已删除！');
    }
}

function populateSubjectSelect(selectId) {
    const select = document.getElementById(selectId);
    select.innerHTML = subjects.map(subject => 
        `<option value="${subject.name}">${subject.name}</option>`
    ).join('');
}

function renderSubjects() {
    const tbody = document.getElementById('subjectsTableBody');
    
    tbody.innerHTML = subjects.map(subject => `
        <tr>
            <td>${subject.grade}</td>
            <td>${subject.name}</td>
            <td>${subject.coefficient.toFixed(2)}</td>
            <td>
                <button class="btn btn-info" onclick="showEditSubjectModal('${subject.id}')" style="padding: 5px 10px; font-size: 12px;">编辑</button>
                <button class="btn btn-danger" onclick="deleteSubject('${subject.id}')" style="padding: 5px 10px; font-size: 12px;">删除</button>
            </td>
        </tr>
    `).join('');
}

function showAddSubjectModal() {
    document.getElementById('addSubjectForm').reset();
    document.getElementById('addSubjectModal').style.display = 'block';
}

function showEditSubjectModal(subjectId) {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    document.getElementById('editSubjectId').value = subject.id;
    document.getElementById('editSubjectGrade').value = subject.grade;
    document.getElementById('editSubjectName').value = subject.name;
    document.getElementById('editCoefficient').value = subject.coefficient;
    
    document.getElementById('editSubjectModal').style.display = 'block';
}

function addSubject(event) {
    event.preventDefault();
    
    const subject = {
        id: Date.now().toString(),
        grade: document.getElementById('subjectGrade').value,
        name: document.getElementById('subjectName').value,
        coefficient: parseFloat(document.getElementById('coefficient').value)
    };
    
    subjects.push(subject);
    saveSubjects();
    renderSubjects();
    renderTeachers();
    closeModal('addSubjectModal');
}

function updateSubject(event) {
    event.preventDefault();
    
    const subjectId = document.getElementById('editSubjectId').value;
    const subjectIndex = subjects.findIndex(s => s.id === subjectId);
    
    if (subjectIndex !== -1) {
        subjects[subjectIndex] = {
            ...subjects[subjectIndex],
            grade: document.getElementById('editSubjectGrade').value,
            name: document.getElementById('editSubjectName').value,
            coefficient: parseFloat(document.getElementById('editCoefficient').value)
        };
        
        saveSubjects();
        renderSubjects();
        renderTeachers();
        closeModal('editSubjectModal');
    }
}

function deleteSubject(subjectId) {
    if (confirm('确定要删除这个学科吗？')) {
        subjects = subjects.filter(s => s.id !== subjectId);
        saveSubjects();
        renderSubjects();
        renderTeachers();
    }
}

function resetSubjectCoefficients() {
    if (confirm('确定要重置所有学科系数为默认值吗？')) {
        subjects = [...defaultSubjects];
        saveSubjects();
        renderSubjects();
        renderTeachers();
    }
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function importFromExcel(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        processImportedData(jsonData);
    };
    reader.readAsArrayBuffer(file);
    
    event.target.value = '';
}

function processImportedData(data) {
    let importedCount = 0;
    
    data.forEach(row => {
        // 智能识别字段名
        const name = row['教师姓名'] || row['姓名'] || row['老师姓名'] || row['教师'];
        const semester = row['学期'] || row['学年学期'] || row['学年度'] || row['年度学期'];
        
        // 检查是否有单独的年级和班级字段
        let grade = row['年级'] || row['年級'];
        let className = row['班级'] || row['班級'] || row['班'];
        let subject = row['学科'] || row['科目'] || row['课程'];
        
        // 如果没有单独的年级班级字段，尝试从科目字段解析
        if (!grade || !className) {
            const subjectField = row['科目'] || row['学科'] || row['课程'];
            if (subjectField) {
                const parsedSubject = parseSubjectString(subjectField);
                if (!grade) grade = parsedSubject.grade;
                if (!className) className = parsedSubject.class;
                if (!subject) subject = parsedSubject.subject;
            }
        }
        
        const periods = row['节数'] || row['课时'] || row['周课时'] || row['课时数'];
        
        if (name && semester && subject && periods) {
            const teacher = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: name.trim(),
                semester: normalizeSemester(semester),
                grade: grade || '',
                class: className || '',
                subject: subject.trim(),
                periods: parseInt(periods)
            };
            
            teachers.push(teacher);
            importedCount++;
        }
    });
    
    saveTeachers();
    renderTeachers();
    
    alert(`成功导入 ${importedCount} 条教师数据！`);
}

function normalizeSemester(semester) {
    if (!semester) return semester;
    
    // 标准化学期格式
    const semesterStr = semester.toString().trim();
    
    // 正则表达式匹配各种学期格式
    const semesterRegex = /(\d{4})[\-\/](\d{4})[\-\/]*([12])/;
    const match = semesterStr.match(semesterRegex);
    
    if (match) {
        const year1 = match[1];
        const year2 = match[2];
        const term = match[3];
        return `${year1}-${year2}-${term}`;
    }
    
    // 匹配 "2024-2025学年第一学期" 格式
    const chineseFormatRegex = /(\d{4})[\-\/](\d{4})[\u5b66\u5e74]*(\u7b2c[一二])\u5b66\u671f/;
    const chineseMatch = semesterStr.match(chineseFormatRegex);
    
    if (chineseMatch) {
        const year1 = chineseMatch[1];
        const year2 = chineseMatch[2];
        const term = chineseMatch[3] === '第一' ? '1' : '2';
        return `${year1}-${year2}-${term}`;
    }
    
    // 匹配 "2024-2025-1" 格式
    const simpleFormatRegex = /(\d{4})[\-](\d{4})[\-]([12])/;
    const simpleMatch = semesterStr.match(simpleFormatRegex);
    
    if (simpleMatch) {
        return semesterStr;
    }
    
    return semester;
}

function exportToExcel() {
    const exportData = teachers.map(teacher => {
        const workload = calculateWorkload(teacher.periods, teacher.subject, teacher.grade);
        return {
            '教师姓名': teacher.name,
            '学期': formatSemester(teacher.semester),
            '年级': teacher.grade || '',
            '班级': teacher.class || '',
            '学科': teacher.subject,
            '节数': teacher.periods,
            '学科系数': getSubjectCoefficient(teacher.subject, teacher.grade),
            '课时量': workload
        };
    });
    
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '教师工作量');
    
    // 导出学科系数表
    const subjectData = subjects.map(subject => {
        return {
            '年级': subject.grade,
            '学科名称': subject.name,
            '学科系数': subject.coefficient.toFixed(2)
        };
    });
    
    const subjectWs = XLSX.utils.json_to_sheet(subjectData);
    XLSX.utils.book_append_sheet(wb, subjectWs, '学科系数');
    
    const fileName = `教师工作量统计_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
}

async function getWorkdayCount(year, semester) {
    const cacheKey = `${year}-${semester}`;
    if (workdayCache[cacheKey]) {
        return workdayCache[cacheKey];
    }
    
    try {
        const startDate = getSemesterStartDate(year, semester);
        const endDate = getSemesterEndDate(year, semester);
        
        const workdays = calculateWorkdays(startDate, endDate);
        workdayCache[cacheKey] = workdays;
        
        return workdays;
    } catch (error) {
        console.error('获取工作日失败:', error);
        return 0;
    }
}

function getSemesterStartDate(year, semester) {
    const yearNum = parseInt(year.split('-')[0]);
    if (semester === '1') {
        return new Date(yearNum, 8, 1);
    } else {
        return new Date(yearNum + 1, 1, 1);
    }
}

function getSemesterEndDate(year, semester) {
    const yearNum = parseInt(year.split('-')[0]);
    if (semester === '1') {
        return new Date(yearNum, 11, 31);
    } else {
        return new Date(yearNum + 1, 6, 30);
    }
}

function calculateWorkdays(startDate, endDate) {
    let workdays = 0;
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            workdays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return workdays;
}

function populateGradeAndClassFilters() {
    const gradeFilter = document.getElementById('gradeFilter');
    const classFilter = document.getElementById('classFilter');
    
    const grades = [...new Set(teachers.map(t => t.grade).filter(g => g))];
    const classes = [...new Set(teachers.map(t => t.class).filter(c => c))];
    
    gradeFilter.innerHTML = '<option value="all">全部年级</option>';
    grades.forEach(grade => {
        gradeFilter.innerHTML += `<option value="${grade}">${grade}</option>`;
    });
    
    classFilter.innerHTML = '<option value="all">全部班级</option>';
    classes.forEach(className => {
        classFilter.innerHTML += `<option value="${className}">${className}</option>`;
    });
}

function updateStatistics() {
    const yearFilter = document.getElementById('yearFilter').value;
    const gradeFilter = document.getElementById('gradeFilter').value;
    const classFilter = document.getElementById('classFilter').value;
    
    let yearTeachers = teachers.filter(t => t.semester.startsWith(yearFilter));
    
    if (gradeFilter !== 'all') {
        yearTeachers = yearTeachers.filter(t => t.grade === gradeFilter);
    }
    
    if (classFilter !== 'all') {
        yearTeachers = yearTeachers.filter(t => t.class === classFilter);
    }
    
    updateSemesterStats(yearFilter, gradeFilter, classFilter);
    updateTeacherRanking(yearTeachers);
    updateSubjectStats(yearTeachers);
}

function updateSemesterStats(year, gradeFilter, classFilter) {
    const container = document.getElementById('semesterStats');
    
    let semester1Teachers = teachers.filter(t => t.semester === `${year}-1`);
    let semester2Teachers = teachers.filter(t => t.semester === `${year}-2`);
    
    if (gradeFilter !== 'all') {
        semester1Teachers = semester1Teachers.filter(t => t.grade === gradeFilter);
        semester2Teachers = semester2Teachers.filter(t => t.grade === gradeFilter);
    }
    
    if (classFilter !== 'all') {
        semester1Teachers = semester1Teachers.filter(t => t.class === classFilter);
        semester2Teachers = semester2Teachers.filter(t => t.class === classFilter);
    }
    
    const semester1Workload = semester1Teachers.reduce((sum, t) => 
        sum + parseFloat(calculateWorkload(t.periods, t.subject, t.grade)), 0);
    const semester2Workload = semester2Teachers.reduce((sum, t) => 
        sum + parseFloat(calculateWorkload(t.periods, t.subject, t.grade)), 0);
    
    container.innerHTML = `
        <div class="stat-item">
            <span class="label">第一学期教师数</span>
            <span class="value">${semester1Teachers.length}</span>
        </div>
        <div class="stat-item">
            <span class="label">第一学期总课时量</span>
            <span class="value">${semester1Workload.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="label">第二学期教师数</span>
            <span class="value">${semester2Teachers.length}</span>
        </div>
        <div class="stat-item">
            <span class="label">第二学期总课时量</span>
            <span class="value">${semester2Workload.toFixed(2)}</span>
        </div>
        <div class="stat-item">
            <span class="label">学年总课时量</span>
            <span class="value">${(semester1Workload + semester2Workload).toFixed(2)}</span>
        </div>
    `;
}

function updateTeacherRanking(yearTeachers) {
    const container = document.getElementById('teacherRanking');
    
    const teacherWorkloads = {};
    yearTeachers.forEach(teacher => {
        if (!teacherWorkloads[teacher.name]) {
            teacherWorkloads[teacher.name] = 0;
        }
        teacherWorkloads[teacher.name] += parseFloat(calculateWorkload(teacher.periods, teacher.subject, teacher.grade));
    });
    
    const sortedTeachers = Object.entries(teacherWorkloads)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (sortedTeachers.length === 0) {
        container.innerHTML = '<p class="empty-state">暂无数据</p>';
        return;
    }
    
    container.innerHTML = sortedTeachers.map(([name, workload], index) => `
        <div class="stat-item">
            <span class="label">${index + 1}. ${name}</span>
            <span class="value">${workload.toFixed(2)}</span>
        </div>
    `).join('');
}

function updateSubjectStats(yearTeachers) {
    const container = document.getElementById('subjectStats');
    
    const subjectStats = {};
    yearTeachers.forEach(teacher => {
        const key = `${teacher.grade || '无年级'}-${teacher.subject}`;
        if (!subjectStats[key]) {
            subjectStats[key] = {
                grade: teacher.grade || '无年级',
                subject: teacher.subject,
                count: 0,
                totalWorkload: 0
            };
        }
        subjectStats[key].count++;
        subjectStats[key].totalWorkload += parseFloat(calculateWorkload(teacher.periods, teacher.subject, teacher.grade));
    });
    
    const sortedSubjects = Object.entries(subjectStats)
        .sort((a, b) => b[1].totalWorkload - a[1].totalWorkload);
    
    if (sortedSubjects.length === 0) {
        container.innerHTML = '<p class="empty-state">暂无数据</p>';
        return;
    }
    
    container.innerHTML = sortedSubjects.map(([key, stats]) => `
        <div class="stat-item">
            <span class="label">${stats.grade} ${stats.subject} (${stats.count}人)</span>
            <span class="value">${stats.totalWorkload.toFixed(2)}</span>
        </div>
    `).join('');
}

// 格式标准化功能

function showFormatStandardizationModal() {
    document.getElementById('formatStandardizationModal').style.display = 'block';
    document.getElementById('standardizeExcel').value = '';
}

function handleStandardizeFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet);
        
        processStandardizeData(jsonData);
    };
    reader.readAsArrayBuffer(file);
    
    event.target.value = '';
}

function processStandardizeData(data) {
    const standardizedRecords = [];
    
    data.forEach(row => {
        // 提取姓名和学期
        const name = row['教师姓名'] || row['姓名'] || row['老师姓名'] || row['教师'] || '';
        const semester = row['学期'] || row['学年学期'] || row['学年度'] || row['年度学期'] || '';
        
        // 尝试从所有列提取信息
        const columns = Object.keys(row);
        for (let i = 2; i < columns.length; i++) {
            const columnName = columns[i];
            const cellValue = row[columnName];
            const cellValueStr = cellValue.toString().trim();
            
            if (!cellValueStr) continue;
            
            // 提取年级、班级、学科和节数
            const grade = extractGrade(cellValueStr);
            const className = extractClass(cellValueStr);
            const subjects = extractMultipleSubjects(cellValueStr);
            const periods = extractPeriods(cellValueStr);
            
            // 为每个学科创建一条标准化记录
            subjects.forEach(subject => {
                if (subject && name && semester && periods) {
                    standardizedRecords.push({
                        '教师姓名': name.trim(),
                        '学期': normalizeSemester(semester),
                        '年级': grade || '',
                        '班级': className || '',
                        '学科': subject.trim(),
                        '节数': parseInt(periods) || 0
                    });
                }
            });
        }
    });
    
    // 调用现有的导入接口处理标准化数据
    if (standardizedRecords.length > 0) {
        processImportedData(standardizedRecords);
    } else {
        alert('未识别到有效数据，请检查文件格式。');
    }
    
    // 关闭模态窗口
    closeModal('formatStandardizationModal');
}

function extractGrade(text) {
    // 提取年级信息，识别到"级"就把"级"和"级"前面的所有内容截取出来
    const gradeIndex = text.indexOf('级');
    if (gradeIndex > 0) {
        // 向前查找年级的开始位置
        let startIndex = gradeIndex - 1;
        while (startIndex >= 0) {
            const char = text[startIndex];
            if (!/[\u4e00-\u9fa5\d]/.test(char)) {
                // 遇到非中文字符或数字时，如果是空格，继续往前查找
                if (char === ' ') {
                    startIndex--;
                    continue;
                }
                break;
            }
            startIndex--;
        }
        startIndex++;
        return text.substring(startIndex, gradeIndex + 1);
    }
    return '';
}

function extractMultipleSubjects(text) {
    const subjects = [];
    const subjectList = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '体育', '音乐', '美术', '信息技术'];
    
    subjectList.forEach(subject => {
        if (text.includes(subject)) {
            subjects.push(subject);
        }
    });
    
    return subjects;
}

function extractClass(text) {
    // 提取班级信息，识别到"班"就把"班"和"班"前面的所有内容截取出来
    const classIndex = text.indexOf('班');
    if (classIndex > 0) {
        // 向前查找班级的开始位置
        let startIndex = classIndex - 1;
        while (startIndex >= 0) {
            const char = text[startIndex];
            if (!/[\u4e00-\u9fa5\d]/.test(char)) {
                // 遇到非中文字符或数字时，如果是空格，继续往前查找
                if (char === ' ') {
                    startIndex--;
                    continue;
                }
                break;
            }
            startIndex--;
        }
        startIndex++;
        let className = text.substring(startIndex, classIndex + 1);
        // 转换中文数字为阿拉伯数字
        const numberMap = {
            '一班': '1班',
            '二班': '2班',
            '三班': '3班',
            '四班': '4班',
            '五班': '5班',
            '六班': '6班',
            '七班': '7班',
            '八班': '8班',
            '九班': '9班',
            '十班': '10班'
        };
        return numberMap[className] || className;
    }
    return '';
}

function extractSubject(text) {
    // 提取学科信息
    const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '历史', '地理', '政治', '体育', '音乐', '美术', '信息技术'];
    for (const subject of subjects) {
        if (text.includes(subject)) {
            return subject;
        }
    }
    return '';
}

function extractPeriods(text) {
    // 提取节数信息，识别到"节"就把"节"前面的数字截取出来
    const periodIndex = text.indexOf('节');
    if (periodIndex > 0) {
        // 向前查找节数的开始位置
        let startIndex = periodIndex - 1;
        while (startIndex >= 0) {
            const char = text[startIndex];
            if (!/\d/.test(char)) {
                // 遇到非数字时，如果是空格，继续往前查找
                if (char === ' ') {
                    startIndex--;
                    continue;
                }
                break;
            }
            startIndex--;
        }
        startIndex++;
        return text.substring(startIndex, periodIndex);
    }
    return '';
}

document.addEventListener('DOMContentLoaded', init);