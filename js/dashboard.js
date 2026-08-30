// ============================================
// KASHOMBA ELECTRICAL SYSTEM - DASHBOARD LOGIC v14
// With Labour Halisi (baada ya discount) on Dashboard
// ============================================

// Global data storage
let allSystemData = {
    customers: [],
    invoices: [],
    payments: [],
    expenses: [],
    users: [],
    settings: [],
    activityLogs: [],
    reports: [],
    financialSummary: [],
    staff: []
};

let currentPage = 'dashboard';
let currentReportData = [];
let dataLoaded = false;

// ============================================
// INITIALIZE DASHBOARD
// ============================================
async function initializeDashboard() {
    if (!protectPage()) {
        return;
    }
    
    try {
        displayUserInfo();
        setupRoleBasedUI();
        
        await loadAllSystemData();
        
        if (!dataLoaded) {
            showError('Failed to load system data. Please refresh the page.');
            return;
        }
        
        const settings = allSystemData.settings && allSystemData.settings.length > 0 
            ? allSystemData.settings[0] 
            : {};
        updateCompanyNameDisplay(settings['Company_Name'] || 'KASHOMBA');
        updateCompanyTaglineDisplay(settings['Company_Tagline'] || 'ELECTRICAL SYSTEM');
        
        loadDashboardStats();
        loadRecentInvoices();
        
        setTimeout(() => {
            try {
                loadUnpaidInvoicesReminder();
                loadCustomersTable();
                loadInvoicesTable();
                loadPaymentsTable();
                loadExpensesTable();
                loadReportHistory();
                
                if (isAdmin()) {
                    loadActivityLogsTable();
                    loadUsersTable();
                    loadSettings();
                }
            } catch (error) {
                console.error('Error loading tables:', error);
            }
        }, 10);
        
        setupSearch();
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize dashboard. Please refresh the page.');
    }
}

// ============================================
// UPDATE COMPANY NAME DISPLAY
// ============================================
function updateCompanyNameDisplay(companyName) {
    const sidebarLogoName = document.querySelector('.sidebar-logo h2');
    if (sidebarLogoName) {
        sidebarLogoName.textContent = companyName;
    }
}

// ============================================
// UPDATE COMPANY TAGLINE DISPLAY
// ============================================
function updateCompanyTaglineDisplay(tagline) {
    const sidebarLogoTagline = document.querySelector('.sidebar-logo p');
    if (sidebarLogoTagline) {
        sidebarLogoTagline.textContent = tagline;
    }
}

// ============================================
// LOAD ALL SYSTEM DATA
// ============================================
async function loadAllSystemData() {
    try {
        const result = await getAllData();
        
        if (result.success) {
            allSystemData = result.data;
            dataLoaded = true;
            return true;
        } else {
            console.error('Failed to load data:', result.message);
            return false;
        }
    } catch (error) {
        console.error('Error loading data:', error);
        return false;
    }
}

// ============================================
// REFRESH DATA AFTER SAVE
// ============================================
async function refreshDataAfterSave() {
    try {
        const result = await getAllData();
        
        if (result.success) {
            allSystemData = result.data;
            dataLoaded = true;
            
            const settings = allSystemData.settings && allSystemData.settings.length > 0 
                ? allSystemData.settings[0] 
                : {};
            updateCompanyNameDisplay(settings['Company_Name'] || 'KASHOMBA');
            updateCompanyTaglineDisplay(settings['Company_Tagline'] || 'ELECTRICAL SYSTEM');
            
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error refreshing data:', error);
        return false;
    }
}

// ============================================
// SETUP ROLE BASED UI
// ============================================
function setupRoleBasedUI() {
    const session = getUserSession();
    
    if (!session) {
        return;
    }
    
    const role = session.role || 'Secretary';
    const adminRole = (typeof ADMIN_ROLE !== 'undefined') ? ADMIN_ROLE : 'Admin';
    const secretaryRole = (typeof SECRETARY_ROLE !== 'undefined') ? SECRETARY_ROLE : 'Secretary';
    
    if (role === adminRole) {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = 'flex';
        });
        
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(el => {
            el.style.display = 'inline-block';
        });
        
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.style.display = '';
        });
    } else if (role === secretaryRole) {
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = 'none';
        });
        
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(el => {
            el.style.display = 'none';
        });
        
        const permissions = session.permissions ? session.permissions.split(',').map(p => p.trim()) : [];
        
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const page = link.getAttribute('data-page');
            
            if (page !== 'dashboard') {
                const moduleMap = {
                    customers: 'customers',
                    invoices: 'invoices',
                    payments: 'payments',
                    expenses: 'expenses',
                    reports: 'reports',
                    financial: 'financial',
                    users: 'users',
                    settings: 'settings',
                    activity: 'activity'
                };
                
                const moduleName = moduleMap[page];
                
                if (moduleName && !permissions.includes(moduleName) && page !== 'dashboard') {
                    link.style.display = 'none';
                }
            }
        });
        
        const adminOnlyPages = ['financial', 'users', 'settings', 'activity'];
        adminOnlyPages.forEach(page => {
            const link = document.querySelector(`.nav-link[data-page="${page}"]`);
            if (link) {
                link.style.display = 'none';
            }
        });
    }
}

// ============================================
// LOAD DASHBOARD STATS - LABOUR HALISI (baada ya discount)
// ============================================
function loadDashboardStats() {
    const totalCustomersEl = document.getElementById('totalCustomers');
    const totalInvoicesEl = document.getElementById('totalInvoices');
    const totalPaymentsEl = document.getElementById('totalPayments');
    const totalExpensesEl = document.getElementById('totalExpenses');
    
    if (totalCustomersEl) {
        totalCustomersEl.textContent = (allSystemData.customers || []).length;
    }
    
    if (totalInvoicesEl) {
        totalInvoicesEl.textContent = (allSystemData.invoices || []).length;
    }
    
    // LABOUR HALISI = Labour Charges - (Labour Charges × Discount / 100)
    const totalLabourHalisi = (allSystemData.invoices || []).reduce((sum, invoice) => {
        const labourCharges = Number(invoice['Labour Charges']) || 0;
        const discount = Number(invoice['Discount (%)']) || 0;
        const labourHalisi = labourCharges - (labourCharges * discount / 100);
        return sum + labourHalisi;
    }, 0);
    
    if (totalPaymentsEl) {
        totalPaymentsEl.textContent = formatCurrency(totalLabourHalisi);
    }
    
    const totalExpenses = (allSystemData.expenses || []).reduce((sum, expense) => {
        return sum + (Number(expense['Amount (Tsh)']) || 0);
    }, 0);
    
    if (totalExpensesEl) {
        totalExpensesEl.textContent = formatCurrency(totalExpenses);
    }
}

// ============================================
// LOAD RECENT INVOICES
// ============================================
function loadRecentInvoices() {
    const tbody = document.getElementById('recentInvoicesTable');
    
    if (!tbody) return;
    
    const invoices = allSystemData.invoices || [];
    const recentInvoices = invoices.slice(-5).reverse();
    
    if (recentInvoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No invoices found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    recentInvoices.forEach(invoice => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${escapeHtml(invoice['Invoice No'] || '-')}</strong></td>
            <td>${escapeHtml(invoice['Customer Name'] || '-')}</td>
            <td>${formatDate(invoice['Date'])}</td>
            <td>${formatCurrency(invoice['Total Charges'])}</td>
            <td><span class="status-badge ${getStatusBadgeClass(invoice['Status'])}">${escapeHtml(invoice['Status'] || 'Pending')}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// LOAD UNPAID INVOICES REMINDER
// ============================================
function loadUnpaidInvoicesReminder() {
    const invoices = allSystemData.invoices || [];
    
    const unpaidInvoices = invoices.filter(inv => {
        const balance = Number(inv['Balance']) || 0;
        return balance > 0 && inv['Status'] !== 'Completed';
    });
    
    const reminderContainer = document.getElementById('unpaidReminderContainer');
    
    if (!reminderContainer) return;
    
    if (unpaidInvoices.length === 0) {
        reminderContainer.innerHTML = '';
        return;
    }
    
    let reminderHTML = '<div class="card mb-20" style="border-left: 4px solid #dc3545;">';
    reminderHTML += '<div class="card-header">';
    reminderHTML += '<span class="card-title">Unpaid Invoices Reminder</span>';
    reminderHTML += '<span class="status-badge status-pending">' + unpaidInvoices.length + ' Due</span>';
    reminderHTML += '</div>';
    reminderHTML += '<div class="table-wrapper"><table class="table"><thead><tr>';
    reminderHTML += '<th>Invoice No</th><th>Customer</th><th>Balance (Tsh)</th><th>Date</th>';
    reminderHTML += '</tr></thead><tbody>';
    
    unpaidInvoices.slice(0, 10).forEach(inv => {
        reminderHTML += '<tr>';
        reminderHTML += '<td><strong>' + escapeHtml(inv['Invoice No'] || '-') + '</strong></td>';
        reminderHTML += '<td>' + escapeHtml(inv['Customer Name'] || '-') + '</td>';
        reminderHTML += '<td style="color: #dc3545; font-weight: 700;">' + formatCurrency(inv['Balance']) + '</td>';
        reminderHTML += '<td>' + formatDate(inv['Date']) + '</td>';
        reminderHTML += '</tr>';
    });
    
    reminderHTML += '</tbody></table></div></div>';
    
    reminderContainer.innerHTML = reminderHTML;
}

// ============================================
// NAVIGATE TO PAGE
// ============================================
function navigateTo(page) {
    if (page !== 'dashboard') {
        const moduleMap = {
            customers: 'customers',
            invoices: 'invoices',
            payments: 'payments',
            expenses: 'expenses',
            reports: 'reports',
            financial: 'financial',
            users: 'users',
            settings: 'settings',
            activity: 'activity'
        };
        
        const moduleName = moduleMap[page];
        
        if (moduleName && !hasModulePermission(moduleName)) {
            showError('You do not have permission to access this module. Contact admin.');
            return;
        }
        
        const adminOnlyPages = ['financial', 'users', 'settings', 'activity'];
        if (adminOnlyPages.includes(page) && !isAdmin()) {
            showError('Only Admin can access this section.');
            return;
        }
    }
    
    currentPage = page;
    
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => {
        p.style.display = 'none';
    });
    
    const selectedPage = document.getElementById(page + 'Page');
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    const pageTitles = {
        dashboard: 'Dashboard',
        customers: 'Customers',
        invoices: 'Invoices',
        payments: 'Payments',
        expenses: 'Expenses',
        reports: 'Reports',
        financial: 'Financial Overview',
        users: 'Users',
        settings: 'Settings',
        activity: 'Activity Logs'
    };
    
    const pageTitleEl = document.getElementById('pageTitle');
    if (pageTitleEl) {
        pageTitleEl.textContent = pageTitles[page] || 'Dashboard';
    }
    
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
    
    closeSidebarMobile();
    
    if (page === 'reports') {
        loadReportHistory();
    }
    
    if (page === 'financial' && isAdmin()) {
        loadFinancialSummary();
    }
    
    if (page === 'activity' && isAdmin()) {
        loadActivityLogsTable();
    }
    
    if (page === 'users' && isAdmin()) {
        loadUsersTable();
    }
    
    if (page === 'settings' && isAdmin()) {
        loadSettings();
    }
}

// ============================================
// TOGGLE SIDEBAR
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (!sidebar) return;
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
        
        if (sidebar.classList.contains('mobile-open')) {
            createSidebarOverlay();
        } else {
            removeSidebarOverlay();
        }
    } else {
        sidebar.classList.toggle('collapsed');
        if (mainContent) {
            mainContent.classList.toggle('expanded');
        }
    }
}

// ============================================
// CREATE SIDEBAR OVERLAY
// ============================================
function createSidebarOverlay() {
    removeSidebarOverlay();
    
    const overlay = document.createElement('div');
    overlay.id = 'sidebarOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 999;
        animation: fadeIn 0.3s ease;
    `;
    
    overlay.addEventListener('click', function() {
        closeSidebarMobile();
    });
    
    document.body.appendChild(overlay);
}

// ============================================
// REMOVE SIDEBAR OVERLAY
// ============================================
function removeSidebarOverlay() {
    const overlay = document.getElementById('sidebarOverlay');
    if (overlay) {
        overlay.remove();
    }
}

// ============================================
// CLOSE SIDEBAR MOBILE
// ============================================
function closeSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.remove('mobile-open');
    }
    removeSidebarOverlay();
}

// ============================================
// SETUP SEARCH
// ============================================
function setupSearch() {
    const customerSearch = document.getElementById('customerSearch');
    if (customerSearch) {
        customerSearch.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const tbody = document.getElementById('customersTableBody');
            
            if (!tbody) return;
            
            const rows = tbody.getElementsByTagName('tr');
            
            for (let i = 0; i < rows.length; i++) {
                const text = rows[i].textContent.toLowerCase();
                rows[i].style.display = text.includes(filter) ? '' : 'none';
            }
        });
    }
    
    const invoiceSearch = document.getElementById('invoiceSearch');
    if (invoiceSearch) {
        invoiceSearch.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const tbody = document.getElementById('invoicesTableBody');
            
            if (!tbody) return;
            
            const rows = tbody.getElementsByTagName('tr');
            
            for (let i = 0; i < rows.length; i++) {
                const text = rows[i].textContent.toLowerCase();
                rows[i].style.display = text.includes(filter) ? '' : 'none';
            }
        });
    }
}

// ============================================
// CHECK MODULE PERMISSION
// ============================================
function hasModulePermission(moduleName) {
    const session = getUserSession();
    
    if (!session) {
        return false;
    }
    
    if (session.role === 'Admin' || session.role === 'admin' || session.role === 'ADMIN') {
        return true;
    }
    
    const permissions = session.permissions ? session.permissions.split(',').map(p => p.trim()) : [];
    
    return permissions.includes(moduleName);
}

// ============================================
// CHECK IF CURRENT USER IS ADMIN
// ============================================
function isAdmin() {
    const session = getUserSession();
    
    if (!session) {
        return false;
    }
    
    return session.role === 'Admin' || session.role === 'admin' || session.role === 'ADMIN';
}

// ============================================
// SETUP NAVIGATION LINKS
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            navigateTo(page);
        });
    });
});

// ============================================
// CLOSE SIDEBAR KWA ESC KEY
// ============================================
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeSidebarMobile();
    }
});

// ============================================
// CLOSE SIDEBAR KWA RESIZE
// ============================================
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeSidebarMobile();
        
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('mobile-open');
        }
    }
});

// ============================================
// SHOW SUCCESS MESSAGE
// ============================================
function showSuccess(message) {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        showToast(message, 'success');
    } else {
        const successDiv = document.getElementById('successMessage');
        
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
            
            setTimeout(() => {
                successDiv.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }
}

// ============================================
// SHOW ERROR MESSAGE
// ============================================
function showError(message) {
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        showToast(message, 'error');
    } else {
        const errorDiv = document.getElementById('errorMessage');
        
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }
}

// ============================================
// SHOW TOAST NOTIFICATION
// ============================================
function showToast(message, type) {
    const existingToast = document.getElementById('mobileToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'mobileToast';
    
    let backgroundColor = '#28a745';
    let borderColor = '#1e7e34';
    let icon = '✓';
    
    if (type === 'error') {
        backgroundColor = '#dc3545';
        borderColor = '#b21f2d';
        icon = '✗';
    } else if (type === 'warning') {
        backgroundColor = '#ffc107';
        borderColor = '#d39e00';
        icon = '⚠';
    }
    
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 400px;
        background: ${backgroundColor};
        color: ${type === 'warning' ? '#000000' : '#FFFFFF'};
        padding: 15px 20px;
        border-radius: 10px;
        border-left: 4px solid ${borderColor};
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 9999;
        font-size: 14px;
        font-weight: 600;
        text-align: center;
        animation: toastSlideUp 0.4s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
    `;
    
    toast.innerHTML = `
        <span style="font-size: 18px;">${icon}</span>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'toastSlideDown 0.4s ease';
            setTimeout(() => {
                toast.remove();
            }, 400);
        }
    }, 5000);
}

// ============================================
// INITIALIZE ON PAGE LOAD
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});