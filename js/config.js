// ============================================
// KASHOMBA ELECTRICAL SYSTEM - CONFIGURATION
// ============================================

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

// Expense Categories
const EXPENSE_CATEGORIES = [
    'Staff Salary',
    'Transport',
    'Food',
    'Emergency',
    'Materials',
    'Equipment',
    'Other'
];

// Payment Methods
const PAYMENT_METHODS = [
    'Cash',
    'Bank Transfer',
    'Mobile Money',
    'Cheque'
];

// Currency
const CURRENCY = 'Tsh';

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
    mobilePaymentName: '',
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
    warning: '#ffc107'
};

// API Response Timeout (milliseconds)
const API_TIMEOUT = 30000;