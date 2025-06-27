// main.js - السكربت الرئيسي المعدل لمجلد pages

document.addEventListener('DOMContentLoaded', function() {
    // تهيئة الموقع عند تحميل الصفحة
    initSite();
});

function initSite() {
    // تعيين معلومات المستخدم من localStorage إذا وجدت
    setUserInfo();
    
    // إعداد التنقل بين الوحدات
    setupNavigation();
    
    // إعداد الأحداث العامة
    setupGeneralEvents();
    
    // تحميل الوحدة الحالية
    loadCurrentModule();
    
    // إعداد تسجيل الخروج
    setupLogout();
}

// تعيين معلومات المستخدم في الشريط الجانبي
function setUserInfo() {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (userData) {
        document.getElementById('userName').textContent = userData.name || 'مستخدم';
        document.getElementById('userRole').textContent = userData.role || 'مستخدم';
    }
}

// إعداد التنقل بين الوحدات
function setupNavigation() {
    const menuItems = document.querySelectorAll('.menu-item:not(#logoutBtn)');
    
    menuItems.forEach(item => {
        item.addEventListener('click', function() {
            const module = this.getAttribute('data-module');
            loadModule(module);
            
            // تحديث العنصر النشط في القائمة
            menuItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // تحديث عنوان الصفحة
            document.getElementById('pageTitle').textContent = this.querySelector('span').textContent;
            
            // تحديث مسار التنقل
            updateBreadcrumb(module);
            
            // حفظ الوحدة النشطة في localStorage
            localStorage.setItem('activeModule', module);
        });
    });
}

// تحميل الوحدة الحالية من localStorage
function loadCurrentModule() {
    const activeModule = localStorage.getItem('activeModule') || 'dashboard';
    loadModule(activeModule);
    
    // تحديث القائمة النشطة
    const activeMenuItem = document.querySelector(`.menu-item[data-module="${activeModule}"]`);
    if (activeMenuItem) {
        activeMenuItem.classList.add('active');
    }
    
    // تحديث عنوان الصفحة
    const activeItem = document.querySelector(`.menu-item[data-module="${activeModule}"] span`);
    if (activeItem) {
        document.getElementById('pageTitle').textContent = activeItem.textContent;
        updateBreadcrumb(activeModule);
    }
}

// تحميل وحدة معينة من مجلد pages
function loadModule(moduleName) {
    const moduleContent = document.getElementById('moduleContent');
    
    // إظهار مؤشر تحميل
    moduleContent.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> جاري التحميل...</div>';
    
    // مسار الملف بناءً على اسم الوحدة
    const pagePath = `pages/${moduleName}.html`;
    
    // تحميل المحتوى باستخدام fetch
    fetch(pagePath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.text();
        })
        .then(html => {
            moduleContent.innerHTML = html;
            
            // بعد تحميل المحتوى، نقوم بإعداد الأحداث الخاصة بالوحدة
            setupModuleSpecificEvents(moduleName);
        })
        .catch(error => {
            console.error('Error loading module:', error);
            moduleContent.innerHTML = `
                <div class="error-message">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>حدث خطأ أثناء تحميل الصفحة. يرجى المحاولة لاحقاً.</p>
                    <button onclick="loadModule('${moduleName}')" class="btn btn-primary">
                        <i class="fas fa-sync-alt"></i> إعادة المحاولة
                    </button>
                </div>
            `;
        });
}

// تحديث مسار التنقل
function updateBreadcrumb(module) {
    const breadcrumb = document.getElementById('breadcrumb');
    const moduleNames = {
        'dashboard': 'لوحة التحكم',
        'students': 'الطلاب',
        'teachers': 'المدرسون',
        'accounting': 'المحاسبة',
        'attendance': 'الحضور',
        'grades': 'العلامات',
        'reports': 'التقارير',
        'profile': 'الملف الشخصي',
        'hr': 'الموظفين'
    };
    
    breadcrumb.innerHTML = `<span>${moduleNames[module] || module}</span>`;
}

// إعداد الأحداث العامة
function setupGeneralEvents() {
    // إدارة النوافذ المنبثقة
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('close') || e.target.classList.contains('cancel-btn')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        }
        
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });
    
    // إدارة تبويبات الصفحات
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab')) {
            const tabContainer = e.target.closest('.tabs');
            const tabContentId = e.target.getAttribute('data-tab') + '-tab';
            
            // تحديث التبويبات النشطة
            tabContainer.querySelectorAll('.tab').forEach(tab => {
                tab.classList.remove('active');
            });
            e.target.classList.add('active');
            
            // تحديث المحتوى النشط
            tabContainer.closest('.module-container')?.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            const activeContent = document.getElementById(tabContentId);
            if (activeContent) {
                activeContent.classList.add('active');
            }
        }
    });
    
    // إدارة الأزرار ذات الأيقونات
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('toggle-password')) {
            const inputId = e.target.getAttribute('onclick').match(/'([^']+)'/)[1];
            const input = document.getElementById(inputId);
            if (input) {
                input.type = input.type === 'password' ? 'text' : 'password';
                e.target.classList.toggle('fa-eye-slash');
                e.target.classList.toggle('fa-eye');
            }
        }
    });
}

// إعداد الأحداث الخاصة بكل وحدة
function setupModuleSpecificEvents(moduleName) {
    switch(moduleName) {
        case 'students':
            setupStudentsEvents();
            break;
        case 'teachers':
            setupTeachersEvents();
            break;
        case 'accounting':
            setupAccountingEvents();
            break;
        case 'attendance':
            setupAttendanceEvents();
            break;
        case 'grades':
            setupGradesEvents();
            break;
        case 'reports':
            setupReportsEvents();
            break;
        case 'profile':
            setupProfileEvents();
            break;
        case 'hr':
            setupHREvents();
            break;
    }
}

// ===== وحدة الطلاب =====
function setupStudentsEvents() {
    // فتح نافذة إضافة طالب جديد
    const addStudentBtn = document.getElementById('addStudentBtn');
    if (addStudentBtn) {
        addStudentBtn.addEventListener('click', function() {
            document.getElementById('studentModal').style.display = 'block';
        });
    }
    
    // معالجة إرسال نموذج الطالب
    const studentForm = document.getElementById('studentForm');
    if (studentForm) {
        studentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('تم حفظ بيانات الطالب بنجاح');
            this.reset();
            document.getElementById('studentModal').style.display = 'none';
        });
    }
    
    // إدارة تبويبات الطلاب
    setupTabsBehavior('students-tabs');
}

// ===== وحدة المدرسين =====
function setupTeachersEvents() {
    // فتح نافذة إضافة مدرس جديد
    const addTeacherBtn = document.getElementById('addTeacherBtn');
    if (addTeacherBtn) {
        addTeacherBtn.addEventListener('click', function() {
            document.getElementById('teacherModal').style.display = 'block';
        });
    }
    
    // معالجة إرسال نموذج المدرس
    const teacherForm = document.getElementById('teacherForm');
    if (teacherForm) {
        teacherForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('تم حفظ بيانات المدرس بنجاح');
            this.reset();
            document.getElementById('teacherModal').style.display = 'none';
        });
    }
    
    // إدارة تبويبات المدرسين
    setupTabsBehavior('teachers-tabs');
}

// ===== وحدة المحاسبة =====
function setupAccountingEvents() {
    // فتح نافذة إضافة دخل
    const addIncomeBtn = document.getElementById('addIncomeBtn');
    if (addIncomeBtn) {
        addIncomeBtn.addEventListener('click', function() {
            document.getElementById('incomeModal').style.display = 'block';
        });
    }
    
    // فتح نافذة إضافة مصروف
    const addExpenseBtn = document.getElementById('addExpenseBtn');
    if (addExpenseBtn) {
        addExpenseBtn.addEventListener('click', function() {
            document.getElementById('expenseModal').style.display = 'block';
        });
    }
    
    // معالجة إرسال نموذج الدخل
    const incomeForm = document.getElementById('incomeForm');
    if (incomeForm) {
        incomeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('تم تسجيل حركة الدخل بنجاح');
            this.reset();
            document.getElementById('incomeModal').style.display = 'none';
        });
    }
    
    // معالجة إرسال نموذج المصروف
    const expenseForm = document.getElementById('expenseForm');
    if (expenseForm) {
        expenseForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('تم تسجيل حركة المصروف بنجاح');
            this.reset();
            document.getElementById('expenseModal').style.display = 'none';
        });
    }
    
    // إدارة تبويبات المحاسبة
    setupTabsBehavior('accounting-tabs');
}

// ===== وحدة الحضور =====
function setupAttendanceEvents() {
    // فتح نافذة تسجيل الحضور
    const takeAttendanceBtn = document.getElementById('takeAttendanceBtn');
    if (takeAttendanceBtn) {
        takeAttendanceBtn.addEventListener('click', function() {
            document.getElementById('attendanceModal').style.display = 'block';
        });
    }
    
    // معالجة إرسال نموذج الحضور
    const attendanceForm = document.getElementById('attendanceForm');
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('تم تسجيل الحضور بنجاح');
            this.reset();
            document.getElementById('attendanceModal').style.display = 'none';
        });
    }
}

// ===== وحدة العلامات =====
function setupGradesEvents() {
    // فتح نافذة إضافة علامة
    const addGradeBtn = document.getElementById('addGradeBtn');
    if (addGradeBtn) {
        addGradeBtn.addEventListener('click', function() {
            document.getElementById('gradeModal').style.display = 'block';
        });
    }
    
    // معالجة إرسال نموذج العلامة
    const gradeForm = document.getElementById('gradeForm');
    if (gradeForm) {
        gradeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            alert('تم تسجيل العلامة بنجاح');
            this.reset();
            document.getElementById('gradeModal').style.display = 'none';
        });
        
        // حساب النسبة المئوية عند تغيير العلامة
        const gradeScore = document.getElementById('gradeScore');
        const gradeMax = document.getElementById('gradeMax');
        const gradePercentage = document.getElementById('gradePercentage');
        
        if (gradeScore && gradeMax && gradePercentage) {
            gradeScore.addEventListener('input', calculatePercentage);
            gradeMax.addEventListener('input', calculatePercentage);
            
            function calculatePercentage() {
                const score = parseFloat(gradeScore.value) || 0;
                const max = parseFloat(gradeMax.value) || 20;
                const percentage = (score / max) * 100;
                gradePercentage.value = percentage.toFixed(2) + '%';
            }
        }
    }
}

// ===== وحدة التقارير =====
function setupReportsEvents() {
    // تغيير نوع التقرير
    const reportType = document.getElementById('reportType');
    if (reportType) {
        reportType.addEventListener('change', function() {
            const monthCol = document.getElementById('monthCol');
            const yearCol = document.getElementById('yearCol');
            const customDateCol = document.getElementById('customDateCol');
            
            if (this.value === 'custom') {
                monthCol.style.display = 'none';
                yearCol.style.display = 'none';
                customDateCol.style.display = 'block';
            } else {
                monthCol.style.display = 'block';
                yearCol.style.display = 'block';
                customDateCol.style.display = 'none';
            }
        });
    }
    
    // توليد التقرير
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            alert('جارٍ توليد التقرير...');
            // هنا يمكنك إضافة كود لإنشاء التقرير
        });
    }
    
    // إدارة تبويبات التقارير
    setupTabsBehavior('reports-tabs');
}

// ===== وحدة الملف الشخصي =====
function setupProfileEvents() {
    // زر تعديل الملف الشخصي
    const editProfileBtn = document.querySelector('.profile-actions .btn-primary');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', function() {
            alert('فتح نموذج تعديل الملف الشخصي');
        });
    }
    
    // زر تغيير كلمة المرور
    const changePasswordBtn = document.querySelector('.profile-actions .btn-secondary');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', function() {
            alert('فتح نموذج تغيير كلمة المرور');
        });
    }
}

// ===== وحدة الموظفين =====
function setupHREvents() {
    // يمكنك إضافة أحداث خاصة بوحدة الموظفين هنا
    console.log('تم تحميل أحداث وحدة الموظفين');
}

// ===== إعداد تسجيل الخروج =====
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
                localStorage.removeItem('userData');
                window.location.href = 'pages/login.html';
            }
        });
    }
}

// ===== دالة مساعدة لإدارة التبويبات =====
function setupTabsBehavior(tabsContainerId) {
    const tabsContainer = document.getElementById(tabsContainerId);
    if (!tabsContainer) return;
    
    tabsContainer.addEventListener('click', function(e) {
        const tab = e.target.closest('.tab');
        if (!tab) return;
        
        // تحديث التبويبات النشطة
        tabsContainer.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
        });
        tab.classList.add('active');
        
        // تحديث المحتوى النشط
        const tabContentId = tab.getAttribute('data-tab') + '-tab';
        tabsContainer.closest('.module-container')?.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const activeContent = document.getElementById(tabContentId);
        if (activeContent) {
            activeContent.classList.add('active');
        }
    });
}

// جعل الدوال متاحة عالمياً للاستدعاء من HTML
window.loadModule = loadModule;