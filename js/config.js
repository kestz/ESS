// ============================================
// KASHOMBA ELECTRICAL SYSTEM - CONFIGURATION v2
// Internal Office Management System
// ============================================

// App Information
const APP_VERSION = '1.0.0';
const APP_NAME = 'KASHOMBA ELECTRICAL SYSTEM';

// Google Apps Script Web App URL
const API_URL = 'https://script.google.com/macros/s/AKfycbxXaXK_JLX4APbYRxRH1tbfocNo4v4zfJqHDWeElKh30W6GSPYrRTV2_I7KtpPvfiED/exec';

// Session Management
const SESSION_KEY = 'kashomba_session';
const REMEMBER_ME_KEY = 'kashomba_remember';

// User Roles
const ADMIN_ROLE = 'Admin';
const SECRETARY_ROLE = 'Secretary';

// Invoice Status
const STATUS_PENDING = 'Pending';
const STATUS_IN_PROGRESS = 'In Progress';
const STATUS_COMPLETED = 'Completed';

// Expense Categories (Electrical Business Specific)
const EXPENSE_CATEGORIES = [
    'Staff Salary',
    'Transport',
    'Food',
    'Emergency',
    'Materials',
    'Equipment',
    'Tools',
    'Fuel',
    'Communication',
    'Other'
];

// Payment Methods (Tanzania Specific)
const PAYMENT_METHODS = [
    'Cash',
    'M-Pesa',
    'Tigo Pesa',
    'Airtel Money',
    'HaloPesa',
    'Bank Transfer',
    'Cheque'
];

// Currency
const CURRENCY = 'Tsh';

// Date Formats
const DATE_FORMAT_DISPLAY = 'DD/MM/YYYY';
const DATE_FORMAT_STORAGE = 'YYYY-MM-DD';

// Company Default Settings (fallback kama Google Sheet haijajazwa)
const DEFAULT_SETTINGS = {
    companyName: 'KASHOMBA ELECTRICAL SOLUTION',
    companyTagline: 'Professional Electrical Services',
    companyPhone: '',
    companyEmail: '',
    companyAddress: '',
    bankName: '',
    bankAccountNo: '',
    bankAccountName: '',
    mobilePaymentName: 'M-Pesa',
    mobilePaymentNo: '',
    currency: 'Tsh',
    invoiceTerms: 'Payment due within 14 days',
    invoiceValidityDays: 14,
    companyLogoUrl: ''
};

// Brand Colors (kutoka website)
const BRAND_COLORS = {
    black: '#000000',
    darkBlack: '#0a0a0a',
    gold: '#DAA520',
    lightGold: '#FFD700',
    teal: '#0a6c6c',
    white: '#FFFFFF',
    lightGray: '#f8f8f8',
    textGray: '#666',
    danger: '#dc3545',
    success: '#28a745',
    warning: '#ffc107',
    info: '#17a2b8'
};

// API Response Timeout (milliseconds)
const API_TIMEOUT = 30000;

// API Retry Settings
const API_MAX_RETRIES = 2;
const API_RETRY_DELAY = 1000; // milliseconds

// Pagination
const ITEMS_PER_PAGE = 20;

// Auto Logout Settings
const AUTO_LOGOUT_TIME = 5 * 60 * 1000; // 5 minutes
const NOTIFICATION_BEFORE_LOGOUT = 1 * 60 * 1000; // 1 minute before