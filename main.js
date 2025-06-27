// متغيرات النظام
const systemConfig = {
    apiBaseUrl: 'http://localhost:3000/api',
    currentUser: null,
    currentModule: 'index'
};

// تهيئة النظام عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function () {
    // التحقق من حالة تسجيل الدخول
    checkAuthStatus();

    // تهيئة الأحداث
    initEvents();

    // تحميل لوحة التحكم إذا كانت الصفحة الحالية هي dashboard.html
    if (window.location.pathname.endsWith('index.html')) {
        loadDashboard();
    }
});

// التحقق من حالة المصادقة
function checkAuthStatus() {
    const token = localStorage.getItem('yaman_token');

    // ✅ السماح بتوكن الثائر (دخول بدون API)
    if (token === 'dummy-token') {
        if (!systemConfig.currentUser) {
            systemConfig.currentUser = {
                name: 'ثائر',
                role: 'مدير'
            };
        }

        updateUserInfo();
        return;
    }

    if (token) {
        fetch(`${systemConfig.apiBaseUrl}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    systemConfig.currentUser = data.user;
                    updateUserInfo();

                    if (window.location.pathname.endsWith('index.html')) {
                        window.location.href = 'index.html';
                    }
                } else {
                    localStorage.removeItem('yaman_token');
                    if (!window.location.pathname.endsWith('index.html')) {
                        window.location.href = 'index.html';
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                if (!window.location.pathname.endsWith('index.html')) {
                    window.location.href = 'index.html';
                }
            });
    } else if (!window.location.pathname.endsWith('index.html')) {
        window.location.href = 'index.html';
    }
}

// تحديث معلومات المستخدم في الواجهة
function updateUserInfo() {
    if (systemConfig.currentUser) {
        const userNameElement = document.getElementById('userName');
        const userRoleElement = document.getElementById('userRole');

        if (userNameElement) userNameElement.textContent = systemConfig.currentUser.name;
        if (userRoleElement) userRoleElement.textContent = systemConfig.currentUser.role;
    }
}

// تهيئة الأحداث
function initEvents() {
    // تسجيل الدخول
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            // كلمة السر الخاصة
            if (username === "admin" && password === "thaaer") {
                localStorage.setItem('yaman_token', 'dummy-token');
                systemConfig.currentUser = {
                    name: 'ثائر',
                    role: 'مدير'
                };
                window.location.href = 'index.html';
                return;
            }

            loginUser(username, password);
        });
    }

    // تسجيل الخروج
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function () {
            localStorage.removeItem('yaman_token');
            window.location.href = 'index.html';
        });
    }

    // القائمة الجانبية
    const menuItems = document.querySelectorAll('.menu-item[data-module]');
    menuItems.forEach(item => {
        item.addEventListener('click', function () {
            const moduleName = this.dataset.module;
            loadModule(moduleName);
        });
    });
}

// تسجيل دخول المستخدم
function loginUser(username, password) {
    fetch(`${systemConfig.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                localStorage.setItem('yaman_token', data.token);
                window.location.href = 'dashboard.html';
            } else {
                document.getElementById('loginError').textContent = data.message || 'خطأ في اسم المستخدم أو كلمة المرور';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('loginError').textContent = 'حدث خطأ أثناء محاولة تسجيل الدخول';
        });
}

// تحميل الوحدة
function loadModule(moduleName) {
    systemConfig.currentModule = moduleName;

    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });

    document.querySelector(`.menu-item[data-module="${moduleName}"]`).classList.add('active');

    document.title = `معهد اليمان - ${getModuleTitle(moduleName)}`;
    document.getElementById('pageTitle').textContent = getModuleTitle(moduleName);

    updateBreadcrumb(moduleName);

    if (moduleName === 'index') {
        loadDashboard();
        return;
    }

    fetch(`pages/${moduleName}.html`)
        .then(response => {
            if (!response.ok) throw new Error('Module not found');
            return response.text();
        })
        .then(html => {
            document.getElementById('moduleContent').innerHTML = html;

            const script = document.createElement('script');
            script.src = `js/modules/${moduleName}.js`;
            script.onload = () => {
                if (typeof initModule === 'function') {
                    initModule();
                }
            };
            document.body.appendChild(script);

            history.pushState(null, null, `index.html?module=${moduleName}`);
        })
        .catch(error => {
            console.error('Error loading module:', error);
            document.getElementById('moduleContent').innerHTML = `
                <div class="alert alert-danger">
                    حدث خطأ أثناء تحميل الوحدة. الرجاء المحاولة لاحقًا.
                </div>
            `;
        });
}

// تحميل لوحة التحكم
function loadDashboard() {
    fetch(`${systemConfig.apiBaseUrl}/index`,{
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('yaman_token')}`
        }
    })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById('studentsCount').textContent = data.stats.students;
                document.getElementById('teachersCount').textContent = data.stats.teachers;
                document.getElementById('monthlyIncome').textContent = data.stats.income;
                document.getElementById('monthlyExpenses').textContent = data.stats.expenses;

                const tbody = document.querySelector('#activityTable tbody');
                tbody.innerHTML = '';

                data.activities.forEach((activity, index) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${index + 1}</td>
                        <td>${activity.action}</td>
                        <td>${activity.user}</td>
                        <td>${new Date(activity.timestamp).toLocaleString('ar-EG')}</td>
                    `;
                    tbody.appendChild(tr);
                });
            } else {
                showAlert('فشل في تحميل بيانات لوحة التحكم', 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('حدث خطأ أثناء تحميل بيانات لوحة التحكم', 'danger');
        });
}

// الحصول على عنوان الوحدة
function getModuleTitle(moduleName) {
    const modules = {
        'dashboard': 'لوحة التحكم',
        'students': 'الطلاب',
        'teachers': 'المدرسون',
        'accounting': 'المحاسبة',
        'attendance': 'الحضور',
        'grades': 'العلامات',
        'hr': 'الموظفين',
        'reports': 'التقارير'
    };
    return modules[moduleName] || 'لوحة التحكم';
}

// تحديث المسار
function updateBreadcrumb(moduleName) {
    const breadcrumb = document.getElementById('breadcrumb');
    if (breadcrumb) {
        breadcrumb.innerHTML = `
            <span>الرئيسية</span>
            <span>${getModuleTitle(moduleName)}</span>
        `;
    }
}

// عرض التنبيه
function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;

    const container = document.querySelector('.main-content') || document.body;
    container.insertBefore(alertDiv, container.firstChild);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// إدارة حالة التاريخ
window.addEventListener('popstate', function () {
    const urlParams = new URLSearchParams(window.location.search);
    const module = urlParams.get('module') || 'index'
    loadModule(module);
});
