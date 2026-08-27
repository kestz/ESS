// ============================================
// KASHOMBA ELECTRICAL SYSTEM - DASHBOARD LOGIC v2
// ============================================

// Global data storage
let allSystemData = {
    customers: [],
    invoices: [],
    payments: [],
    expenses: [],
    users: [],
    settings: [],
    activityLogs: []
};

let currentPage = 'dashboard';
let currentReportData = [];

// ============================================
// INITIALIZE DASHBOARD
// ============================================
async function initializeDashboard() {
    // Check if user is logged in
    if (!protectPage()) {
        return;
    }
    
    // Display user info
    displayUserInfo();
    
    // Setup role-based UI
    setupRoleBasedUI();
    
    // Load all data
    await loadAllSystemData();
    
    // Load dashboard stats
    loadDashboardStats();
    
    // Load recent invoices
    loadRecentInvoices();
    
    // Load unpaid invoices reminder
    loadUnpaidInvoicesReminder();
    
    // Load tables
    loadCustomersTable();
    loadInvoicesTable();
    loadPaymentsTable();
    loadExpensesTable();
    
    // Load admin tables kama user ni admin
    if (isAdmin()) {
        loadActivityLogsTable();
        loadUsersTable();
        loadSettings();
    }
    
    // Setup search
    setupSearch();
}

// ============================================
// LOAD ALL SYSTEM DATA
// ============================================
async function loadAllSystemData() {
    try {
        const result = await getAllData();
        
        if (result.success) {
            allSystemData = result.data;
        } else {
            console.error('Failed to load data:', result.message);
        }
    } catch (error) {
        console.error('Error loading data:', error);
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
    
    const role = session.role;
    
    if (role === ADMIN_ROLE) {
        // Admin sees everything
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = 'flex';
        });
        
        // Show delete buttons
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(el => {
            el.style.display = 'inline-block';
        });
    } else if (role === SECRETARY_ROLE) {
        // Secretary hides admin elements
        const adminElements = document.querySelectorAll('.admin-only');
        adminElements.forEach(el => {
            el.style.display = 'none';
        });
        
        // Hide delete buttons for secretary
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(el => {
            el.style.display = 'none';
        });
        
        // Check module permissions
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
    }
}

// ============================================
// LOAD DASHBOARD STATS
// ============================================
function loadDashboardStats() {
    // Total Customers
    document.getElementById('totalCustomers').textContent = allSystemData.customers.length;
    
    // Total Invoices
    document.getElementById('totalInvoices').textContent = allSystemData.invoices.length;
    
    // Total Payments
    const totalPayments = allSystemData.payments.reduce((sum, payment) => {
        return sum + (Number(payment['Amount (Tsh)']) || 0);
    }, 0);
    document.getElementById('totalPayments').textContent = formatCurrency(totalPayments);
    
    // Total Expenses
    const totalExpenses = allSystemData.expenses.reduce((sum, expense) => {
        return sum + (Number(expense['Amount (Tsh)']) || 0);
    }, 0);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
}

// ============================================
// LOAD RECENT INVOICES
// ============================================
function loadRecentInvoices() {
    const tbody = document.getElementById('recentInvoicesTable');
    
    if (!tbody) {
        return;
    }
    
    const recentInvoices = allSystemData.invoices.slice(-5).reverse();
    
    if (recentInvoices.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">No invoices found</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    
    recentInvoices.forEach(invoice => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td><strong>${invoice['Invoice No']}</strong></td>
            <td>${invoice['Customer Name'] || '-'}</td>
            <td>${formatDate(invoice['Date'])}</td>
            <td>${formatCurrency(invoice['Total Charges'])}</td>
            <td><span class="status-badge ${getStatusBadgeClass(invoice['Status'])}">${invoice['Status'] || 'Pending'}</span></td>
        `;
        
        tbody.appendChild(row);
    });
}

// ============================================
// LOAD UNPAID INVOICES REMINDER
// ============================================
function loadUnpaidInvoicesReminder() {
    const unpaidInvoices = allSystemData.invoices.filter(inv => {
        const balance = Number(inv['Balance']) || 0;
        return balance > 0 && inv['Status'] !== 'Completed';
    });
    
    // Update reminder count kama kuna element
    const reminderCount = document.getElementById('unpaidCount');
    if (reminderCount) {
        reminderCount.textContent = unpaidInvoices.length;
    }
    
    // Onyesha reminder card kwenye dashboard
    const reminderContainer = document.getElementById('unpaidReminderContainer');
    if (reminderContainer && unpaidInvoices.length > 0) {
        let reminderHTML = '<div class="card mb-20" style="border-left: 4px solid #dc3545;">';
        reminderHTML += '<div class="card-header">';
        reminderHTML += '<span class="card-title">⚠️ Unpaid Invoices Reminder</span>';
        reminderHTML += '<span class="status-badge status-pending">' + unpaidInvoices.length + ' Due</span>';
        reminderHTML += '</div>';
        reminderHTML += '<div class="table-wrapper"><table class="table"><thead><tr>';
        reminderHTML += '<th>Invoice No</th><th>Customer</th><th>Balance (Tsh)</th><th>Date</th>';
        reminderHTML += '</tr></thead><tbody>';
        
        unpaidInvoices.slice(0, 10).forEach(inv => {
            reminderHTML += '<tr>';
            reminderHTML += '<td><strong>' + inv['Invoice No'] + '</strong></td>';
            reminderHTML += '<td>' + inv['Customer Name'] + '</td>';
            reminderHTML += '<td style="color: #dc3545; font-weight: 700;">' + formatCurrency(inv['Balance']) + '</td>';
            reminderHTML += '<td>' + formatDate(inv['Date']) + '</td>';
            reminderHTML += '</tr>';
        });
        
        reminderHTML += '</tbody></table></div></div>';
        
        reminderContainer.innerHTML = reminderHTML;
    } else if (reminderContainer) {
        reminderContainer.innerHTML = '';
    }
}

// ============================================
// NAVIGATE TO PAGE
// ============================================
function navigateTo(page) {
    // Check permission
    if (page !== 'dashboard') {
        const moduleMap = {
            customers: 'customers',
            invoices: 'invoices',
            payments: 'payments',
            expenses: 'expenses',
            reports: 'reports',
            users: 'users',
            settings: 'settings',
            activity: 'activity'
        };
        
        const moduleName = moduleMap[page];
        
        if (moduleName && !hasModulePermission(moduleName)) {
            showError('You do not have permission to access this module. Contact admin.');
            return;
        }
    }
    
    currentPage = page;
    
    // Hide all pages
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => {
        p.style.display = 'none';
    });
    
    // Show selected page
    const selectedPage = document.getElementById(page + 'Page');
    if (selectedPage) {
        selectedPage.style.display = 'block';
    }
    
    // Update page title
    const pageTitles = {
        dashboard: 'Dashboard',
        customers: 'Customers',
        invoices: 'Invoices',
        payments: 'Payments',
        expenses: 'Expenses',
        reports: 'Reports',
        users: 'Users',
        settings: 'Settings',
        activity: 'Activity Logs'
    };
    
    document.getElementById('pageTitle').textContent = pageTitles[page] || 'Dashboard';
    
    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        
        if (link.getAttribute('data-page') === page) {
            link.classList.add('active');
        }
    });
    
    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.remove('mobile-open');
}

// ============================================
// TOGGLE SIDEBAR
// ============================================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.querySelector('.main-content');
    
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('mobile-open');
    } else {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');
    }
}

// ============================================
// SETUP SEARCH
// ============================================
function setupSearch() {
    // Customer search
    const customerSearch = document.getElementById('customerSearch');
    if (customerSearch) {
        customerSearch.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const tbody = document.getElementById('customersTableBody');
            const rows = tbody.getElementsByTagName('tr');
            
            for (let i = 0; i < rows.length; i++) {
                const text = rows[i].textContent.toLowerCase();
                rows[i].style.display = text.includes(filter) ? '' : 'none';
            }
        });
    }
    
    // Invoice search
    const invoiceSearch = document.getElementById('invoiceSearch');
    if (invoiceSearch) {
        invoiceSearch.addEventListener('keyup', function() {
            const filter = this.value.toLowerCase();
            const tbody = document.getElementById('invoicesTableBody');
            const rows = tbody.getElementsByTagName('tr');
            
            for (let i = 0; i < rows.length; i++) {
                const text = rows[i].textContent.toLowerCase();
                rows[i].style.display = text.includes(filter) ? '' : 'none';
            }
        });
    }
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
// INITIALIZE ON PAGE LOAD
// ============================================
window.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
});